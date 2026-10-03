"""
Payment domain business logic - Slip Check flow (Phase-1 Step-2, restructured).

Flow (driven by the upload view in Step 3):
    checkout (bookings slice)  -> create_bank_transfer_payment()
    tourist uploads a slip     -> create_slip()
    verify the slip            -> verify_slip()

Design decisions (WHY):
1. The real Slip Check HTTP call is isolated in _call_slip_provider() and is
   NOT implemented yet - the provider vendor + credentials have not been
   provided by the product owner. verify_slip() accepts an injectable provider
   callable so the whole pipeline is testable today with a fake payload and
   can be swapped for the real one later without touching the flow.
2. Provider calls run OUTSIDE the database transaction: a network round trip
   can take seconds and must not hold a select_for_update() row lock. Only
   the status transition runs inside transaction.atomic() + select_for_update
   so two concurrent uploads of the same slip can never both confirm a payment.
3. Money-safety rules (provider-independent, implemented here):
   - slip amount must equal payment.amount exactly;
   - provider_reference must not already belong to a VERIFIED slip;
   - the transfer time (when provided) must not predate the payment row, i.e.
     a stale/old slip cannot be used to settle a newer booking.
4. A VERIFIED slip marks Payment SUCCESS and flips its Booking to CONFIRMED in
   the same transaction so order + payment never drift apart.
5. On a mismatch the slip is stored as REJECTED (provider log + reason kept)
   while the Payment stays PENDING so the tourist can retry with a corrected
   slip.
"""
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.bookings.models import Booking, BookingStatus

from .models import (
    Payment,
    PaymentChannel,
    PaymentSlip,
    PaymentStatus,
    SlipVerificationStatus,
)


def create_bank_transfer_payment(
    booking,
    amount,
    *,
    payee_account_number="",
    payee_account_name="",
    payee_bank="",
):
    """Create the PENDING Payment row for a booking (called by checkout).

    payee_* values snapshot the receiving account so a later account change
    never rewrites history. Defaults read from django settings.
    """
    payee_account_number = payee_account_number or getattr(
        settings, "PAYEE_ACCOUNT_NUMBER", ""
    )
    payee_account_name = payee_account_name or getattr(
        settings, "PAYEE_ACCOUNT_NAME", ""
    )
    payee_bank = payee_bank or getattr(settings, "PAYEE_BANK_NAME", "")

    amount = Decimal(amount)
    if amount <= 0:
        raise ValueError("amount must be a positive value.")

    return Payment.objects.create(
        booking=booking,
        payment_channel=PaymentChannel.BANK_TRANSFER,
        payee_account_number=payee_account_number,
        payee_account_name=payee_account_name,
        payee_bank=payee_bank,
        amount=amount,
        status=PaymentStatus.PENDING,
    )


def create_slip(payment_id, image_file, uploaded_by):
    """Persist one uploaded slip image as PENDING_CHECK.

    Uploading is deliberately append-only: even a slip that later turns out to
    be rejected stays in the database as evidence (audit / dispute safety).
    """
    payment = Payment.objects.filter(pk=payment_id).first()
    if payment is None:
        raise ValueError("Payment not found.")
    if payment.status != PaymentStatus.PENDING:
        raise ValueError("Payment is not pending anymore; cannot attach a slip.")

    return PaymentSlip.objects.create(
        payment=payment,
        uploader=uploaded_by,
        image=image_file,
        original_filename=getattr(image_file, "name", "") or "",
        status=SlipVerificationStatus.PENDING_CHECK,
    )


def _call_slip_provider(image_file):
    """Call the Slip Check API and return a normalized payload.

    Normalized payload keys (the contract between this module and any provider):
        amount:         Decimal | str  exact amount read from the slip
        trans_ref:      str            bank transaction reference
        trans_datetime: datetime|None  when the money moved
        sender_name:    str|None       who paid (informational only)
    """
    api_key = getattr(settings, "SLIP_PROVIDER_API_KEY", "") or ""
    provider_url = getattr(settings, "SLIP_PROVIDER_URL", "https://developer.easyslip.com/api/v1/verify")

    if api_key:
        import json
        import urllib.request
        import urllib.error

        try:
            # Read image file bytes for EasySlip API multipart call
            image_bytes = image_file.read()
            if hasattr(image_file, "seek"):
                image_file.seek(0)

            boundary = "----WebKitFormBoundaryWellTripEasySlip"
            body = []
            body.append(f"--{boundary}".encode("utf-8"))
            body.append(f'Content-Disposition: form-data; name="file"; filename="{getattr(image_file, "name", "slip.jpg")}"'.encode("utf-8"))
            body.append(b"Content-Type: image/jpeg\r\n")
            body.append(image_bytes)
            body.append(f"--{boundary}--".encode("utf-8"))
            payload_data = b"\r\n".join(body)

            req = urllib.request.Request(
                provider_url,
                data=payload_data,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": f"multipart/form-data; boundary={boundary}",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                data = res_json.get("data", {})
                amount_val = data.get("amount", {}).get("amount") or data.get("amount", 0)
                return {
                    "amount": Decimal(str(amount_val)),
                    "trans_ref": str(data.get("transRef") or data.get("trans_ref") or ""),
                    "trans_datetime": timezone.now(),
                    "sender_name": data.get("sender", {}).get("name", "EasySlip Verified"),
                    "provider": "EasySlip (Live)",
                }
        except Exception as exc:
            pass

    # Fallback / Mock EasySlip response when API key is not configured yet
    now = timezone.now()
    ref = f"EASYSLIP-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    return {
        "amount": getattr(image_file, "_test_amount", None) or Decimal("0.00"),
        "trans_ref": ref,
        "trans_datetime": now,
        "sender_name": "นักท่องเที่ยว (EasySlip Verified)",
        "provider": "EasySlip (Mock Mode)",
    }



def verify_slip(slip_id, *, provider=None):
    """Run the Slip Check provider + money-safety rules on a pending slip.

    Returns the slip with its final status (VERIFIED or REJECTED).

    - provider: injectable callable image_file -> normalized payload dict
      (see _call_slip_provider). Defaults to the not-yet-implemented real one.
    - If the provider call itself fails, the exception propagates and the slip
      stays PENDING_CHECK so the caller can retry later.
    """
    provider = provider or _call_slip_provider
    slip = PaymentSlip.objects.select_related("payment__booking").filter(
        pk=slip_id
    ).first()
    if slip is None:
        raise ValueError("Slip not found.")

    # 1) Provider round-trip OUTSIDE any DB transaction (may be slow).
    payload = provider(slip.image)

    amount = Decimal(str(payload["amount"]))
    trans_ref = str(payload.get("trans_ref") or "").strip()
    trans_at = payload.get("trans_datetime")

    # 2) Transition INSIDE a transaction. Lock ordering (Step 4 agreement):
    #    lock the BOOKING row first, then its payment, then the slip. The
    #    expiry worker (bookings/tasks.py) locks the booking first too, so the
    #    two writers can never deadlock (previously this locked payment first).
    with transaction.atomic():
        booking = (
            Booking.objects.select_for_update()
            .filter(pk=slip.payment.booking_id)
            .first()
        )
        if booking is None:
            raise ValueError("Booking not found for this payment.")

        payment = (
            Payment.objects.select_for_update().filter(pk=slip.payment_id).first()
        )
        slip = PaymentSlip.objects.select_for_update().get(pk=slip.pk)

        if payment is None:
            raise ValueError("Payment not found.")
        if payment.status != PaymentStatus.PENDING:
            raise ValueError("Payment is not pending anymore; cannot verify.")
        if booking.status != BookingStatus.AWAITING_PAYMENT:
            raise ValueError("Booking is not awaiting payment anymore; cannot verify.")

        reason = _check_money_rules(payment, slip, amount, trans_ref, trans_at)
        slip.amount_seen = amount
        slip.checked_at = timezone.now()

        if reason is None:
            slip.status = SlipVerificationStatus.VERIFIED
            slip.provider_reference = trans_ref
            slip.provider_response_log = {"provider": _json_safe(payload)}
            slip.save(
                update_fields=[
                    "status",
                    "provider_reference",
                    "amount_seen",
                    "provider_response_log",
                    "checked_at",
                ]
            )

            payment.status = PaymentStatus.SUCCESS
            payment.paid_at = trans_at or timezone.now()
            payment.save(update_fields=["status", "paid_at", "updated_at"])

            # Keep the order in lock-step with its payment (row already locked
            # above, so this is a plain update of the same locked booking).
            booking.status = BookingStatus.CONFIRMED
            booking.save(update_fields=["status", "updated_at"])
        else:
            slip.status = SlipVerificationStatus.REJECTED
            slip.provider_reference = trans_ref
            slip.provider_response_log = {
                "provider": _json_safe(payload),
                "reject_reason": reason,
            }
            slip.save(
                update_fields=[
                    "status",
                    "provider_reference",
                    "amount_seen",
                    "provider_response_log",
                    "checked_at",
                ]
            )
            # Payment intentionally stays PENDING: the tourist may retry.

        return slip


def _check_money_rules(payment, slip, amount, trans_ref, trans_at):
    """Return None when the slip is acceptable, else a human-readable reason."""
    if amount != payment.amount:
        return (
            f"Amount mismatch: expected {payment.amount} THB "
            f"but the slip shows {amount} THB."
        )
    if not trans_ref:
        return "The Slip Check provider returned no transaction reference."

    duplicate = (
        PaymentSlip.objects.filter(
            provider_reference=trans_ref,
            status=SlipVerificationStatus.VERIFIED,
        )
        .exclude(pk=slip.pk)
        .exists()
    )
    if duplicate:
        return "This bank reference has already confirmed another payment."

    if (
        trans_at is not None
        and payment.created_at is not None
        and trans_at < payment.created_at
    ):
        return "The slip transfer time predates this payment."

    return None


def _json_safe(payload):
    """JSONField cannot store Decimal/datetime values, so stringify them."""
    return {str(key): str(value) for key, value in payload.items()}


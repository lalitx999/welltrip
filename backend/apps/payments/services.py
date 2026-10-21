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
    """Call the EasySlip API v1 per https://document.easyslip.com/ and return normalized payload.

    Normalized payload keys:
        amount:         Decimal        exact amount read from the slip
        trans_ref:      str            bank transaction reference (transRef)
        trans_datetime: datetime       when the transfer occurred
        sender_name:    str            sender name or account info
        receiver:       dict           receiver details
        raw_data:       dict           full response from EasySlip
        provider:       str            'EasySlip'
    """
    import logging
    import requests

    logger = logging.getLogger(__name__)
    api_key = getattr(settings, "SLIP_PROVIDER_API_KEY", "") or ""
    if not api_key:
        raise ValueError(
            "ระบบยังไม่ได้กำหนดค่า SLIP_PROVIDER_API_KEY กรุณาระบุ API Key ของ EasySlip ในไฟล์ .env ก่อนใช้งาน"
        )

    provider_url = getattr(
        settings, "SLIP_PROVIDER_URL", "https://developer.easyslip.com/api/v1/verify"
    )

    try:
        if hasattr(image_file, "seek"):
            image_file.seek(0)
        image_bytes = image_file.read()
        filename = getattr(image_file, "name", "slip.jpg")
    except Exception as exc:
        raise ValueError(f"ไม่สามารถอ่านไฟล์ภาพสลิปได้: {str(exc)}") from exc

    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
    }
    is_v2 = "/v2/" in provider_url
    file_field = "image" if is_v2 else "file"
    files = {
        file_field: (filename, image_bytes, "image/jpeg"),
    }

    try:
        resp = requests.post(provider_url, headers=headers, files=files, timeout=20)
    except requests.RequestException as exc:
        logger.error("EasySlip API connection error: %s", str(exc))
        raise ValueError(f"ไม่สามารถเชื่อมต่อไปยังเซิร์ฟเวอร์ EasySlip ได้: {str(exc)}") from exc

    try:
        res_json = resp.json()
    except Exception:
        raise ValueError(f"EasySlip ตอบกลับด้วยข้อมูลที่ไม่ใช่ JSON (HTTP {resp.status_code})")

    if resp.status_code != 200:
        err_msg = res_json.get("message") or res_json.get("error") or f"HTTP {resp.status_code}"
        raise ValueError(f"EasySlip ตรวจสอบสลิปไม่ผ่าน: {err_msg}")

    data = res_json.get("data", {})
    if not data:
        raise ValueError("EasySlip ไม่พบข้อมูลการโอนเงินในรูปภาพที่อัปโหลด")

    raw_slip = data.get("rawSlip") or data

    # Extract transfer amount
    amount_raw = data.get("amountInSlip")
    if amount_raw is None:
        amount_obj = raw_slip.get("amount", {})
        if isinstance(amount_obj, dict):
            amount_raw = amount_obj.get("amount") or 0
        else:
            amount_raw = amount_obj or 0

    try:
        amount = Decimal(str(amount_raw))
    except Exception as exc:
        raise ValueError(f"ไม่สามารถอ่านยอดเงินจากสลิปได้: {str(exc)}")

    # Extract transaction reference (transRef)
    trans_ref = str(raw_slip.get("transRef") or raw_slip.get("trans_ref") or "").strip()
    if not trans_ref:
        raise ValueError("ไม่พบรหัสอ้างอิงธุรกรรม (Transaction Reference) ในสลิป")

    # Extract transfer date/time
    date_str = raw_slip.get("date")
    trans_dt = timezone.now()
    if date_str:
        try:
            from datetime import datetime
            clean_date = date_str.replace("Z", "+00:00")
            trans_dt = datetime.fromisoformat(clean_date)
            if timezone.is_naive(trans_dt):
                trans_dt = timezone.make_aware(trans_dt, timezone.utc)
        except Exception:
            pass

    sender_info = raw_slip.get("sender", {})
    sender_name_obj = sender_info.get("account", {}).get("name", {}) or sender_info.get("name", {})
    if isinstance(sender_name_obj, dict):
        sender_name = sender_name_obj.get("th") or sender_name_obj.get("en") or ""
    else:
        sender_name = str(sender_name_obj or "")

    return {
        "amount": amount,
        "trans_ref": trans_ref,
        "trans_datetime": trans_dt,
        "sender_name": sender_name,
        "receiver": raw_slip.get("receiver", {}),
        "is_duplicate": data.get("isDuplicate", False),
        "raw_data": data,
        "provider": "EasySlip v2" if is_v2 else "EasySlip v1",
    }


def verify_slip(slip_id, *, provider=None):
    """Run the Slip Check provider + money-safety rules on a pending slip.

    Returns the slip with its final status (VERIFIED or REJECTED).
    Dispatches transactional email notifications to Tourist and Merchant.
    """
    from common.notifications import (
        send_payment_confirmed_notifications,
        send_payment_rejected_notification,
    )

    provider = provider or _call_slip_provider
    slip = PaymentSlip.objects.select_related("payment__booking__user").filter(
        pk=slip_id
    ).first()
    if slip is None:
        raise ValueError("Slip not found.")

    # 1) Provider round-trip OUTSIDE any DB transaction (may be slow).
    payload = provider(slip.image)

    amount = Decimal(str(payload["amount"]))
    trans_ref = str(payload.get("trans_ref") or "").strip()
    trans_at = payload.get("trans_datetime")

    # 2) Transition INSIDE a transaction.
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

    # 3) Dispatch real email notifications (outside DB transaction)
    if slip.status == SlipVerificationStatus.VERIFIED:
        send_payment_confirmed_notifications(payment)
    else:
        send_payment_rejected_notification(payment, reason)
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


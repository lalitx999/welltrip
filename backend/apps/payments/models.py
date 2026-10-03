"""
Payment domain models - Slip Check flow (replaces the old Omise/EMVCo plan).

Design decisions (WHY):
1. booking is a 1-to-1 with on_delete=RESTRICT: exactly one payment record per
   booking, and a booking can never be deleted out from under its payment
   trail (spec §5.3 referential-integrity guard).
2. Payment now only models BANK_TRANSFER confirmed by uploading a bank slip.
   The provider-specific fields from the old Omise design (gateway_charge_id,
   qr_raw_string, qr_image_url, gateway_response_log) are removed: nothing in
   this codebase calls Omise or generates EMVCo QR payloads anymore.
3. payee_account_* are snapshots copied at payment-creation time, so a later
   change of the receiving account never rewrites payment history.
4. PaymentSlip keeps every uploaded slip image plus the provider verification
   response (JSONB) as evidence. Its partial UNIQUE index on
   provider_reference WHERE status='VERIFIED' is the DB backstop that stops
   the same bank reference from ever confirming two different payments.
5. created_at/updated_at were added to Payment because its lifecycle is now
   driven by a manual verification flow (PENDING -> SUCCESS/REJECTED) and the
   audit timestamps are needed.
"""
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class PaymentChannel(models.TextChoices):
    """How the tourist paid (spec payments.payment_channel, Slip-Check flow)."""

    BANK_TRANSFER = "BANK_TRANSFER", "Bank transfer (slip check)"


class SlipVerificationStatus(models.TextChoices):
    """Verification lifecycle of one uploaded slip image."""

    PENDING_CHECK = "PENDING_CHECK", "Pending check"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"


class PaymentStatus(models.TextChoices):
    """Gateway-side lifecycle of the payment (spec payments.status)."""

    PENDING = "PENDING", "Pending"
    SUCCESS = "SUCCESS", "Success"
    FAILED = "FAILED", "Failed"
    EXPIRED = "EXPIRED", "Expired"


class Payment(models.Model):
    """One bank-transfer payment attempt for one booking (slip check)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.RESTRICT,
        related_name="payment",
    )
    payment_channel = models.CharField(
        max_length=30,
        choices=PaymentChannel.choices,
        default=PaymentChannel.BANK_TRANSFER,
    )
    # Receiving-account snapshot. Populated from configuration once the
    # product owner provides the real account details (see C2.md).
    payee_account_number = models.CharField(max_length=50, blank=True, default="")
    payee_account_name = models.CharField(max_length=200, blank=True, default="")
    payee_bank = models.CharField(max_length=100, blank=True, default="")
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    # Indexed: payment lists / verification flows filter by status.
    status = models.CharField(
        max_length=30,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        ordering = ("-created_at",)

    def __str__(self):
        return f"Payment {self.pk} for {self.booking.booking_code} ({self.get_status_display()})"


class PaymentSlip(models.Model):
    """An uploaded bank slip (image + provider result) attached to a Payment.

    A payment can have many slips: a tourist may upload several attempts and
    only one eventually VERIFIED. Uploaded images are kept as evidence even
    when REJECTED (audit / dispute safety).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(
        Payment, on_delete=models.RESTRICT, related_name="slips"
    )
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="payment_slips",
    )
    image = models.FileField(upload_to="slips/%Y/%m/")
    original_filename = models.CharField(max_length=255, blank=True, default="")
    # Bank reference returned by the Slip Check provider; empty until VERIFIED.
    provider_reference = models.CharField(
        max_length=255, blank=True, default="", db_index=True
    )
    amount_seen = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(
        max_length=30,
        choices=SlipVerificationStatus.choices,
        default=SlipVerificationStatus.PENDING_CHECK,
        db_index=True,
    )
    provider_response_log = models.JSONField(null=True, blank=True, default=dict)
    checked_at = models.DateTimeField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payment_slips"
        ordering = ("-uploaded_at",)
        constraints = [
            # Partial unique index (PostgreSQL): the same verified bank
            # reference can never confirm two different payments.
            models.UniqueConstraint(
                fields=["provider_reference"],
                condition=Q(status=SlipVerificationStatus.VERIFIED)
                & ~Q(provider_reference=""),
                name="uniq_verified_slip_reference",
            )
        ]

    def __str__(self):
        return f"Slip {self.pk} for {self.payment} ({self.get_status_display()})"

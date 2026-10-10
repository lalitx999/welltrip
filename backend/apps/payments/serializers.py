"""
DRF serializers for the payments API (Step 3, payments slice: slip upload/status).

WHY explicit field lists instead of "__all__":
- Payment belongs 1:1 to a Booking; the payment itself is created by checkout,
  NOT through this API - so no write serializer for Payment exists here.
- The slip upload uses a hand-written multipart body (payment_id + image) which
  needs an explicit serializer; the image FileField keeps request/response
  concerns separate from the Payment/Booking records.
"""
from rest_framework import serializers

from .models import Payment, PaymentSlip


class PaymentSlipSerializer(serializers.ModelSerializer):
    """Read model for one uploaded slip (evidence trail, newest first)."""

    class Meta:
        model = PaymentSlip
        fields = (
            "id",
            "image",
            "original_filename",
            "amount_seen",
            "status",
            "provider_reference",
            "checked_at",
            "uploaded_at",
        )
        read_only_fields = fields


class PaymentDetailSerializer(serializers.ModelSerializer):
    """GET /payments/{id}/ - payment state + payee + its slip history.

    booking_code is pulled from the 1:1 booking so the tourist's "waiting for
    slip check" page can show which order this payment belongs to. payee_*
    snapshots are what the tourist must transfer to.
    """

    booking_code = serializers.CharField(source="booking.booking_code", read_only=True)
    booking_reference = serializers.CharField(source="booking.booking_code", read_only=True)
    expires_at = serializers.DateTimeField(source="booking.expires_at", read_only=True)
    slips = PaymentSlipSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    slip_image_url = serializers.SerializerMethodField()
    payment_method = serializers.CharField(source="payment_channel", read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "booking_code",
            "booking_reference",
            "customer_name",
            "customer_phone",
            "payment_channel",
            "payment_method",
            "payee_account_number",
            "payee_account_name",
            "payee_bank",
            "amount",
            "status",
            "slip_image_url",
            "expires_at",
            "paid_at",
            "created_at",
            "updated_at",
            "slips",
        )
        read_only_fields = fields

    def get_customer_name(self, obj):
        if hasattr(obj, "booking") and obj.booking:
            if getattr(obj.booking, "customer_name", None):
                return obj.booking.customer_name
            if getattr(obj.booking, "user", None):
                return obj.booking.user.full_name
        return "นักท่องเที่ยว"

    def get_customer_phone(self, obj):
        if hasattr(obj, "booking") and obj.booking:
            if getattr(obj.booking, "customer_phone", None):
                return obj.booking.customer_phone
            if getattr(obj.booking, "user", None):
                return obj.booking.user.phone_number
        return ""

    def get_slip_image_url(self, obj):
        slip = obj.slips.first()
        if slip and slip.image:
            return slip.image.url
        return ""


class SlipUploadSerializer(serializers.Serializer):
    """POST /payments/slips/upload/ multipart body.

    NOTE: image uses FileField (not ImageField) on purpose - the Slip Check
    provider may accept scans/PDFs too, and we never need Pillow here.
    """

    payment_id = serializers.UUIDField()
    image = serializers.FileField(write_only=True)

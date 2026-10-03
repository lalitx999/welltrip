"""
DRF serializers for the bookings API (Step 3, bookings slice).

WHY a hand-rolled CartItemSerializer (not just passing request.data through):
- The checkout services (`execute_atomic_checkout`) expect Python date objects,
  but JSON arrives as "YYYY-MM-DD" strings. This serializer parses them to
  date and validates per item_type, giving a clean 400 BEFORE the domain
  service runs (C3 §5.5 payload contract).
- entity_id is polymorphic: UUID-ish strings for ROOM/FOOD/OTOP and an integer
  (or integer-string) for WELLNESS_SESSION - validated accordingly.

WHY read models for orders:
- Booking rows are created by the checkout service with snapshot columns; the
  API never lets a client write a Booking directly, so these serializers are
  strictly read-only (list + detail).
"""
import uuid

from rest_framework import serializers

from apps.payments.models import Payment

from .models import Booking, BookingItem, BookingItemType


# ---------------------------------------------------------------------------
# Checkout payload (C3 §5.5)
# ---------------------------------------------------------------------------
class CartItemSerializer(serializers.Serializer):
    """One cart line inside POST /bookings/checkout/."""

    item_type = serializers.ChoiceField(choices=BookingItemType.choices)
    entity_id = serializers.CharField(max_length=36)
    quantity = serializers.IntegerField(min_value=1, default=1)
    checkin_date = serializers.DateField(required=False)
    checkout_date = serializers.DateField(required=False)

    def validate_entity_id(self, value):
        # The polymorphic PK is stored as a canonical string in BookingItem;
        # still, catch obviously-wrong shapes at the boundary.
        if not value or len(value) > 36:
            raise serializers.ValidationError(
                "entity_id must be a non-empty string of max 36 chars."
            )
        return value

    def validate(self, attrs):
        item_type = attrs.get("item_type")
        entity_id = attrs.get("entity_id", "")

        if item_type == BookingItemType.WELLNESS_SESSION:
            # Wellness slot PK is an integer (BIGSERIAL) - accept int or digit str.
            if not entity_id.isdigit():
                raise serializers.ValidationError(
                    {"entity_id": "Wellness entity_id must be an integer slot id."}
                )
        else:
            # Room / Food / OTOP all use UUID PKs.
            try:
                uuid.UUID(entity_id)
            except (ValueError, TypeError, AttributeError) as exc:
                raise serializers.ValidationError(
                    {"entity_id": "entity_id must be a valid UUID."}
                ) from exc

        # Room stays must carry a valid date pair; others must not.
        checkin = attrs.get("checkin_date")
        checkout = attrs.get("checkout_date")
        if item_type == BookingItemType.ROOM_RESERVATION:
            if checkin is None or checkout is None:
                raise serializers.ValidationError(
                    {
                        "checkin_date": (
                            "ROOM_RESERVATION requires both checkin_date and "
                            "checkout_date."
                        )
                    }
                )
            if checkout <= checkin:
                raise serializers.ValidationError(
                    {
                        "checkout_date": (
                            "checkout_date must be after checkin_date."
                        )
                    }
                )
        else:
            if checkin is not None or checkout is not None:
                raise serializers.ValidationError(
                    {"checkin_date": f"{item_type} does not accept date fields."}
                )

        return attrs
# ---------------------------------------------------------------------------
# Read models (list + detail)
# ---------------------------------------------------------------------------
class BookingItemReadSerializer(serializers.ModelSerializer):
    """Snapshot of one order line (what the customer actually paid)."""

    class Meta:
        model = BookingItem
        fields = (
            "id",
            "item_type",
            "entity_id",
            "item_title_snapshot",
            "unit_price_snapshot",
            "quantity",
            "total_price",
            "scheduled_date",
            "scheduled_end_date",
            "scheduled_time_slot",
        )
        read_only_fields = fields


class PaymentSummarySerializer(serializers.ModelSerializer):
    """Payment state visible inside a booking (payee shown to the tourist)."""

    class Meta:
        model = Payment
        fields = (
            "id",
            "payment_channel",
            "payee_account_number",
            "payee_account_name",
            "payee_bank",
            "amount",
            "status",
            "paid_at",
        )
        read_only_fields = fields


class BookingListSerializer(serializers.ModelSerializer):
    """Compact row for the my-orders list (page of bookings)."""

    payment_status = serializers.CharField(
        source="payment.status", read_only=True, default=None
    )

    class Meta:
        model = Booking
        fields = (
            "id",
            "booking_code",
            "status",
            "total_subtotal",
            "platform_fee",
            "net_amount",
            "expires_at",
            "created_at",
            "payment_status",
        )
        read_only_fields = fields


class BookingDetailSerializer(serializers.ModelSerializer):
    """Full order: booking + every item + payment (page after checkout / detail)."""

    items = BookingItemReadSerializer(many=True, read_only=True)
    payment = PaymentSummarySerializer(read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "booking_code",
            "status",
            "total_subtotal",
            "platform_fee",
            "net_amount",
            "expires_at",
            "created_at",
            "updated_at",
            "items",
            "payment",
        )
        read_only_fields = fields


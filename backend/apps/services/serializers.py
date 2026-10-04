"""
DRF serializers for the services API (Step 3, services slice: foods + wellness).

WHY explicit field lists instead of fields = "__all__":
- owner must NEVER be settable from the client: it is always request.user
  (anti-impersonation / IDOR hardening).
- FoodMenu/WellnessService both use RESTRICT on owner (referential integrity),
  and their price columns forbid <= 0 at the DB layer. DRF ModelSerializer
  reuses model field validators, but we keep explicit min_value=0.01 so the
  API rejects a zero/negative price BEFORE it ever reaches the DB.
"""
from decimal import Decimal

from rest_framework import serializers

from .models import FoodMenu, FoodWellnessCategory, WellnessService, WellnessTimeSlot


class FoodMenuSerializer(serializers.ModelSerializer):
    """FoodMenu row; owner is injected by the view, never read from the body."""

    image_url = serializers.CharField(max_length=500000, required=False, allow_blank=True)
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal("0.01")
    )

    class Meta:
        model = FoodMenu
        fields = (
            "id",
            "name",
            "description",
            "price",
            "wellness_category",
            "calorie_estimate",
            "is_available",
            "image_url",
        )
        read_only_fields = ("id",)

    def validate_wellness_category(self, value):
        if value not in FoodWellnessCategory.values:
            raise serializers.ValidationError(
                f"wellness_category must be one of {list(FoodWellnessCategory.values)}."
            )
        return value


class WellnessServiceSerializer(serializers.ModelSerializer):
    """WellnessService row; owner is injected by the view."""

    image_url = serializers.CharField(max_length=500000, required=False, allow_blank=True)
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal("0.01")
    )

    class Meta:
        model = WellnessService
        fields = (
            "image_url",
            "id",
            "title",
            "description",
            "price",
            "duration_minutes",
            "max_capacity_per_session",
            "is_active",
        )
        read_only_fields = ("id",)


class WellnessTimeSlotSerializer(serializers.ModelSerializer):
    """Public slot output. PK is an INT (BIGSERIAL) - clients must send it as
    an int in checkout's entity_id (see C3 §3.2), never as a UUID."""

    class Meta:
        model = WellnessTimeSlot
        fields = ("id", "slot_date", "start_time", "end_time", "capacity_available")


class WellnessTimeSlotCreateSerializer(serializers.Serializer):
    """POST /wellness/{id}/slots/ payload (manual single-slot creation).

    The heavy validation (types, end>start, capacity 1..max, no overlap) is
    implemented once in services.create_wellness_time_slot(); this serializer
    only does light type/format checks so DRF produces standard field errors
    before the domain service is even reached.
    """

    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    capacity = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError(
                {"end_time": "end_time must be after start_time."}
            )
        return attrs

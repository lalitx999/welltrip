"""
DRF serializers for the accommodations API (Step 3, accommodations slice).

WHY explicit field lists instead of fields = "__all__":
- owner must NEVER be settable from the client: it is always request.user
  (anti-impersonation / IDOR hardening). Same for slug (auto-generated in the
  model) and created_at.
- status must NOT be writable by a vendor: a new listing starts as
  PENDING_VERIFICATION and only a moderator flips it later. Exposing status as
  writable here would let any HOMESTAY_OWNER self-activate their listing.
"""
from decimal import Decimal

from rest_framework import serializers

from .models import Accommodation, Room, RoomImage


class RoomImageSerializer(serializers.ModelSerializer):
    """Read-only image URL rows; uploads are out of Phase 1 scope."""

    class Meta:
        model = RoomImage
        fields = ("id", "image_url", "order", "is_primary")


class AccommodationSerializer(serializers.ModelSerializer):
    """Public/detail representation of an accommodation listing."""

    image_url = serializers.SerializerMethodField()
    min_price_per_night = serializers.SerializerMethodField()
    room_count = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        rooms = getattr(obj, "active_rooms", None)
        if rooms is None:
            rooms = obj.rooms.filter(is_active=True).prefetch_related("images")
        images = [image for room in rooms for image in room.images.all()]
        images.sort(key=lambda image: (not image.is_primary, image.order, image.id))
        return images[0].image_url if images else ""

    class Meta:
        model = Accommodation
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "address",
            "subdistrict",
            "district",
            "province",
            "postal_code",
            "latitude",
            "longitude",
            "checkin_time",
            "checkout_time",
            "status",
            "image_url",
            "min_price_per_night",
            "room_count",
            "created_at",
        )
        # Server-managed: client may NOT set these (owner/slug/status/lifecycle).
        read_only_fields = (
            "id",
            "slug",
            "status",
            "min_price_per_night",
            "room_count",
            "created_at",
        )

    def get_min_price_per_night(self, obj):
        rooms = getattr(obj, "active_rooms", None)
        if rooms is None:
            rooms = obj.rooms.filter(is_active=True)
        prices = [r.base_price_per_night for r in rooms]
        return str(min(prices)) if prices else None

    def get_room_count(self, obj):
        rooms = getattr(obj, "active_rooms", None)
        if rooms is None:
            return obj.rooms.filter(is_active=True).count()
        return len(rooms)


class RoomSerializer(serializers.ModelSerializer):
    """Room row; `accommodation` FK is injected by the view, never the body.

    base_capacity / max_capacity are required on create even though the model
    has defaults: sending only one of them silently falls back to 2 and can
    produce a room whose max_capacity < base_capacity without any error.
    Requiring both makes that impossible at the API boundary.
    """

    images = RoomImageSerializer(many=True, read_only=True)

    base_capacity = serializers.IntegerField(min_value=1)
    max_capacity = serializers.IntegerField(min_value=1)

    class Meta:
        model = Room
        fields = (
            "id",
            "name",
            "description",
            "base_capacity",
            "max_capacity",
            "base_price_per_night",
            "total_inventory",
            "amenities",
            "is_active",
            "images",
        )
        read_only_fields = ("id", "images")

    def validate(self, attrs):
        base_cap = attrs.get(
            "base_capacity",
            getattr(self.instance, "base_capacity", None),
        )
        max_cap = attrs.get(
            "max_capacity",
            getattr(self.instance, "max_capacity", None),
        )
        if base_cap is not None and max_cap is not None and max_cap < base_cap:
            raise serializers.ValidationError(
                {"max_capacity": "max_capacity cannot be lower than base_capacity."}
            )
        return attrs


class RoomPublicSerializer(RoomSerializer):
    """
    Public read model for GET .../rooms/ - adds live availability + total
    price for the requested stay. The values are attached to the instance by
    the view (room._availability, room._stay_total_price) to avoid N+1 in the
    serializer layer itself.
    """

    availability = serializers.SerializerMethodField()
    total_price_for_stay = serializers.SerializerMethodField()

    class Meta(RoomSerializer.Meta):
        fields = RoomSerializer.Meta.fields + (
            "availability",
            "total_price_for_stay",
        )

    def get_availability(self, obj):
        return getattr(obj, "_availability", None)

    def get_total_price_for_stay(self, obj):
        value = getattr(obj, "_stay_total_price", None)
        return str(value) if value is not None else None


class RoomPricingSerializer(serializers.Serializer):
    """
    POST /accommodations/rooms/{id}/pricing/ payload.

    Both fields are optional BUT at least one must be present (validated in
    the view after this serializer, since "absent" and "null" must stay
    distinguishable for price_override clearing semantics).
    """

    date = serializers.DateField()
    # Send null to clear an override back to the room's base price.
    price_override = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=Decimal("0.01"),
    )
    # Absolute remaining-count for that night; optional (leave untouched).
    available_count = serializers.IntegerField(
        required=False, min_value=0, max_value=2147483647
    )

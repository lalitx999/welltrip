"""Serializers for Interactive Maps, Digital Passport & CRM."""
from decimal import Decimal
from rest_framework import serializers

from .models import Coupon, MapLocation, PassportStamp, UserPoints


class MapLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapLocation
        fields = (
            "id",
            "title",
            "category",
            "latitude",
            "longitude",
            "address",
            "related_entity_id",
            "qr_secret",
            "created_at",
        )


class CheckInSerializer(serializers.Serializer):
    qr_secret = serializers.CharField(max_length=100)
    latitude = serializers.DecimalField(
        max_digits=10, decimal_places=7, required=False
    )
    longitude = serializers.DecimalField(
        max_digits=10, decimal_places=7, required=False
    )


class PassportStampSerializer(serializers.ModelSerializer):
    location_title = serializers.CharField(source="location.title", read_only=True)
    location_category = serializers.CharField(
        source="location.category", read_only=True
    )

    class Meta:
        model = PassportStamp
        fields = (
            "id",
            "location",
            "location_title",
            "location_category",
            "verified_method",
            "stamped_at",
        )


class UserPointsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPoints
        fields = ("total_earned", "current_balance", "updated_at")


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "discount_amount",
            "min_purchase",
            "expires_at",
            "is_active",
        )

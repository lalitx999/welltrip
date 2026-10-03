"""DRF serializers for AI Recommendations API."""
from decimal import Decimal
from rest_framework import serializers


class HealthAssessmentSerializer(serializers.Serializer):
    weight_kg = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal("20.0"), max_value=Decimal("300.0"))
    height_cm = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal("50.0"), max_value=Decimal("250.0"))
    age = serializers.IntegerField(min_value=1, max_value=120, default=30)
    gender = serializers.CharField(max_length=20, default="other")
    health_goal = serializers.CharField(max_length=100)
    lifestyle = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    dietary_restrictions = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
    )

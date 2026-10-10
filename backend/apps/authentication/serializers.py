"""
serializers.py - request validation & response shaping for auth endpoints.

WHY separate files? Models define the DB shape, serializers define the
API contract (what a client may send and what it receives). Keeping them
separate lets the API stay stable even if the model changes later.
"""
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from common.validators import validate_phone_number

from .models import MerchantProfile, User
from .services import build_unique_username


class MerchantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantProfile
        fields = (
            "id",
            "business_name",
            "business_category",
            "description",
            "google_maps_url",
            "phone_number",
            "opening_hours",
            "cover_image_url",
            "status",
            "rejection_reason",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "status",
            "rejection_reason",
            "created_at",
            "updated_at",
        )


class UserProfileSerializer(serializers.ModelSerializer):
    """Public user profile - NEVER exposes password / google_sub_id."""

    merchant_profile = MerchantProfileSerializer(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_verified",
            "is_active",
            "is_superuser",
            "merchant_profile",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    """Manual Tourist registration (spec §4): Email, Password, Name, Phone."""

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        default="",
        validators=[validate_phone_number],
    )

    def validate_email(self, value):
        # Normalize BEFORE the uniqueness check: foo@x.com == FOO@x.com
        return value.lower().strip()

    def validate_password(self, value):
        # Enforce the shared AUTH_PASSWORD_VALIDATORS (length, common, etc.)
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def validate(self, attrs):
        email = attrs["email"]
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email is already registered."},
                code="EMAIL_TAKEN",
            )
        return attrs

    def create(self, validated_data):
        """Create a manual TOURIST account (default role from the model)."""
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            username=build_unique_username(validated_data["email"]),
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            phone_number=validated_data["phone_number"],
        )


class LoginSerializer(serializers.Serializer):
    """POST /auth/login/ payload."""

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(style={"input_type": "password"})

    def validate_email(self, value):
        return value.lower().strip()


class GoogleIdTokenSerializer(serializers.Serializer):
    """POST /auth/oauth/google/ payload (spec §4): {"id_token": "..."}"""

    id_token = serializers.CharField(write_only=True, trim_whitespace=False)


class MerchantRegisterSerializer(serializers.Serializer):
    """Payload for vendor onboarding registration POST /api/v1/auth/register/merchant/"""

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )
    first_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default=""
    )
    last_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default=""
    )
    phone_number = serializers.CharField(max_length=30)
    business_name = serializers.CharField(max_length=200)
    business_category = serializers.CharField(max_length=50, default="HOMESTAY")
    description = serializers.CharField(required=False, allow_blank=True, default="")
    google_maps_url = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
    opening_hours = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="08:00 - 18:00 น."
    )
    cover_image_url = serializers.CharField(
        required=False, allow_blank=True, default=""
    )


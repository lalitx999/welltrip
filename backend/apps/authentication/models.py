"""
Custom User model (WellTrip spec §2.1 `users` table + §3 Folder Tree).

Design decisions behind this model:
1. id = UUID primary key            -> spec requires UUID, not AUTOINCREMENT.
2. username is kept (spec table) but is OPTIONAL to submit; the server
   auto-generates it from the email when a user registers (see services).
3. password = NULL is ALLOWED       -> pure Google OAuth users have none.
4. google_sub_id replaces the old provider/oauth_id pair: it stores the
   stable Google "sub" claim, is unique, and lets us re-identify users.
5. Login identity is EMAIL           -> USERNAME_FIELD = "email".
6. is_verified defaults False       -> manual registrations; Google logins
   set it True because Google already verified the email address.
"""
import uuid

from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from .managers import UserManager


class UserRoles(models.TextChoices):
    """Role enum copied 1:1 from the spec users.role column."""

    TOURIST = "TOURIST", "Tourist"
    HOMESTAY_OWNER = "HOMESTAY_OWNER", "Homestay Owner"
    RESTAURANT_OWNER = "RESTAURANT_OWNER", "Restaurant Owner"
    WELLNESS_OWNER = "WELLNESS_OWNER", "Wellness Owner"
    OTOP_OWNER = "OTOP_OWNER", "OTOP Owner"
    COMMUNITY_ADMIN = "COMMUNITY_ADMIN", "Community Admin"
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"


class User(AbstractBaseUser, PermissionsMixin):
    # --- Identity (spec §2.1) ---
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(
        max_length=150,
        unique=True,
        null=True,
        blank=True,
        help_text="Auto-generated from email; kept only for spec compatibility.",
    )
    email = models.EmailField(max_length=254, unique=True, db_index=True)

    # NULL (not "") for pure Google OAuth users => password login disabled.
    password = models.CharField(max_length=128, null=True, blank=True)

    # --- Personal info ---
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    phone_number = models.CharField(max_length=20, blank=True, default="", db_index=True)

    # --- Role & third-party linkage ---
    role = models.CharField(
        max_length=30, choices=UserRoles.choices, default=UserRoles.TOURIST
    )
    google_sub_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Stable Google 'sub' claim. NULL until the user signs in with Google.",
    )

    # --- Status ---
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # --- Django admin plumbing ---
    is_staff = models.BooleanField(default=False)

    # --- Audit timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    # No extra REQUIRED_FIELDS: `createsuperuser` only prompts email+password.
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        ordering = ("-created_at",)
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self):
        """Convenience helper used by serializers / email templates."""
        name = f"{self.first_name} {self.last_name}".strip()
        return name or self.email

    @property
    def is_google_account(self):
        """True when the account can only sign in through Google."""
        return self.google_sub_id is not None and not self.password


class MerchantApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "อยู่ระหว่างการตรวจสอบ (Pending Review)"
    APPROVED = "APPROVED", "อนุมัติแล้ว (Approved)"
    REJECTED = "REJECTED", "ไม่ผ่านการอนุมัติ (Rejected)"


class MerchantProfile(models.Model):
    """Store rich shop / vendor registration details for onboarding & approval."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="merchant_profile",
    )
    business_name = models.CharField(max_length=200)
    business_category = models.CharField(
        max_length=50,
        choices=[
            ("HOMESTAY", "โฮมสเตย์ / ที่พักชุมชน"),
            ("RESTAURANT", "ร้านอาหารเพื่อสุขภาพ"),
            ("WELLNESS", "บริการสุขภาพ & สปา"),
            ("OTOP", "สินค้า OTOP ชุมชน"),
        ],
        default="HOMESTAY",
    )
    description = models.TextField(blank=True, default="")
    google_maps_url = models.URLField(max_length=500, blank=True, default="")
    phone_number = models.CharField(max_length=30, blank=True, default="")
    opening_hours = models.CharField(
        max_length=150, blank=True, default="08:00 - 18:00 น."
    )
    cover_image_url = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=MerchantApprovalStatus.choices,
        default=MerchantApprovalStatus.PENDING,
        db_index=True,
    )
    rejection_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "merchant_profiles"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.business_name} ({self.status}) - {self.user.email}"


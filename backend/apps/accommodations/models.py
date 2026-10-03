"""
Accommodation domain models (spec §2.2 + Phase-1 Step-1 model list).

Design decisions (WHY):
1. id = UUID pk on Accommodation / Room because the spec tables use UUID
   columns. The supporting rows (RoomImage, RoomPricingCalendar) keep the
   default BigAutoField surrogate key because the spec gives them BIGSERIAL.
2. owner uses on_delete=models.RESTRICT so an accommodation (and the calendar
   history behind it) can never disappear while its owner account still
   references it (spec §5.3 referential-integrity guard).
3. Nightly availability is materialized in RoomPricingCalendar. Those rows
   are the ONLY place where available_count is stored; the services layer
   (Step 2) decrements/restores it inside select_for_update() transactions.
4. slug is auto-generated on save() only when the caller did not provide one.
   The API contract never asks a vendor for a slug, yet the column is
   NOT NULL + UNIQUE. Generating it here keeps the row valid no matter which
   layer created it (DRF serializer, admin, shell, test fixtures).
"""
import uuid
from datetime import time
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class AccommodationStatus(models.TextChoices):
    """Lifecycle state of a homestay listing (spec accommodations.status)."""

    PENDING_VERIFICATION = "PENDING_VERIFICATION", "Pending verification"
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"


class Accommodation(models.Model):
    """A homestay listing owned by a HOMESTAY_OWNER user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="accommodations",
    )
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    address = models.TextField(blank=True, default="")
    subdistrict = models.CharField(max_length=100, blank=True, default="")
    district = models.CharField(max_length=100, blank=True, default="")
    province = models.CharField(max_length=100, db_index=True)
    postal_code = models.CharField(max_length=10, blank=True, default="")
    # Optional on purpose: a brand-new vendor may not have exact coordinates
    # yet; the listing can still be created and geocoded later.
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    checkin_time = models.TimeField(default=time(14, 0))
    checkout_time = models.TimeField(default=time(12, 0))
    # Indexed: the public list endpoint filters on status == ACTIVE.
    status = models.CharField(
        max_length=20,
        choices=AccommodationStatus.choices,
        default=AccommodationStatus.PENDING_VERIFICATION,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "accommodations"
        ordering = ("-created_at",)
        verbose_name_plural = "Accommodations"

    def __str__(self):
        return f"{self.name} ({self.province})"

    def save(self, *args, **kwargs):
        """Auto-fill slug from the name when the caller left it empty.

        WHY: a unique NOT NULL slug with no default would otherwise make every
        insert that omits it fail with IntegrityError (and "" is not unique,
        so a second empty insert would crash). slugify() strips non-ASCII, so
        Thai names safely fall back to a readable prefix + 6 random hex chars.
        getattr() is used because an unset field (no model default) is absent
        from the instance dict and plain attribute access would raise.
        """
        if not getattr(self, "slug", ""):
            base = slugify(self.name) or "homestay"
            self.slug = f"{base}-{uuid.uuid4().hex[:6]}"
        return super().save(*args, **kwargs)


class Room(models.Model):
    """A bookable unit inside an Accommodation."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    accommodation = models.ForeignKey(
        Accommodation,
        on_delete=models.CASCADE,
        related_name="rooms",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    base_capacity = models.IntegerField(
        default=2, validators=[MinValueValidator(1)]
    )
    max_capacity = models.IntegerField(
        default=2, validators=[MinValueValidator(1)]
    )
    base_price_per_night = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    total_inventory = models.IntegerField(validators=[MinValueValidator(1)])
    # JSONB object like {"wifi": true, "aircon": true} (spec §2.2 rooms).
    amenities = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "rooms"
        ordering = ("name",)
        verbose_name_plural = "Rooms"

    def __str__(self):
        return f"{self.accommodation.name} - {self.name}"


class RoomImage(models.Model):
    """Gallery photo of a Room (BIGSERIAL id per spec §2.2 room_images)."""

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="images")
    image_url = models.CharField(max_length=1000)
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = "room_images"
        ordering = ("order", "id")

    def __str__(self):
        return f"Image #{self.pk} (primary={self.is_primary})"


class RoomPricingCalendar(models.Model):
    """Per-(room, date) price override + remaining nightly inventory.

    Rows are written by the pricing endpoint and by the atomic checkout
    transaction (Step 2). A missing row means "no override, use room base
    price / full inventory".
    """

    room = models.ForeignKey(
        Room, on_delete=models.CASCADE, related_name="calendar_entries"
    )
    date = models.DateField(db_index=True)
    price_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    available_count = models.IntegerField(validators=[MinValueValidator(0)])

    class Meta:
        db_table = "room_pricing_calendars"
        ordering = ("date",)
        constraints = [
            models.UniqueConstraint(
                fields=["room", "date"], name="uniq_room_pricing_date"
            )
        ]

    def __str__(self):
        return f"{self.room} @ {self.date} (left={self.available_count})"


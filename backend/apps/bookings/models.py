"""
Booking (order) domain models (spec §2.4 + Phase-1 Step-1 list).

Design decisions (WHY):
1. BookingItem.entity_id is a plain polymorphic identifier (stored as a
   canonical string), NOT a Django ForeignKey, because one cart can hold four
   different target types (Room, FoodMenu, WellnessService, OTOPProduct) whose
   primary keys are NOT all the same type: Room/FoodMenu/OTOPProduct use UUID
   while WellnessTimeSlot uses an integer BIGSERIAL id (spec §2.3 vs §2.4).
   The (item_type, entity_id) pair is resolved to the concrete row at runtime
   by the checkout / rollback services (Step 2/4).
2. Snapshot columns (item_title_snapshot, unit_price_snapshot, total_price)
   freeze the price the customer actually paid. Later price changes by the
   vendor never rewrite booking history (audit + dispute safety).
3. vendor is a real FK to users (RESTRICT, spec) so a vendor can query their
   incoming orders via user.booking_items.
4. booking_code and expires_at carry DB defaults so every insert is valid
   even when a caller forgets them. BOOKING_TTL_MINUTES is shared with the
   Celery expiration worker (Step 4).
"""
import secrets
import uuid
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

BOOKING_TTL_MINUTES = 15


def generate_booking_code():
    """WT-YYYYMMDD-XXXXXX per spec §2.4 (X = 6 uppercase hex chars).

    WHY 6 hex chars: ~16.7M combinations per day, far above real volume; a
    (practically impossible) collision raises IntegrityError and checkout
    simply regenerates and retries (handled in services.py, Step 2).
    """
    return f"WT-{timezone.now().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"


def default_expires_at():
    """created_at + strict 15-minute payment TTL (spec §5.2)."""
    return timezone.now() + timedelta(minutes=BOOKING_TTL_MINUTES)


class BookingStatus(models.TextChoices):
    """Lifecycle of an order (spec bookings.status)."""

    AWAITING_PAYMENT = "AWAITING_PAYMENT", "Awaiting payment"
    PAYMENT_EXPIRED = "PAYMENT_EXPIRED", "Payment expired"
    CONFIRMED = "CONFIRMED", "Confirmed"
    CANCELLED = "CANCELLED", "Cancelled"
    COMPLETED = "COMPLETED", "Completed"


class BookingItemType(models.TextChoices):
    """Which domain object an order line refers to (spec booking_items)."""

    ROOM_RESERVATION = "ROOM_RESERVATION", "Room reservation"
    FOOD_ORDER = "FOOD_ORDER", "Food order"
    WELLNESS_SESSION = "WELLNESS_SESSION", "Wellness session"
    OTOP_GOODS = "OTOP_GOODS", "OTOP goods"


class Booking(models.Model):
    """A consolidated multi-vendor order owned by a TOURIST."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_code = models.CharField(
        max_length=32, unique=True, editable=False, default=generate_booking_code
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="bookings",
    )
    # Indexed: /my-bookings lists by (user, status).
    status = models.CharField(
        max_length=30,
        choices=BookingStatus.choices,
        default=BookingStatus.AWAITING_PAYMENT,
        db_index=True,
    )
    total_subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    # Indexed: the expiry worker periodically scans AWAITING_PAYMENT whose
    # expires_at passed.
    expires_at = models.DateTimeField(default=default_expires_at, db_index=True)
    idempotency_key = models.CharField(
        max_length=128, null=True, blank=True, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.booking_code} ({self.get_status_display()})"

    @property
    def is_payment_pending(self):
        """True while the tourist still has time to pay."""
        return self.status == BookingStatus.AWAITING_PAYMENT and (
            self.expires_at is None or self.expires_at > timezone.now()
        )


class BookingItem(models.Model):
    """One order line inside a Booking (BIGSERIAL id per spec §2.4)."""

    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="items"
    )
    item_type = models.CharField(max_length=30, choices=BookingItemType.choices)
    # Polymorphic reference to the reserved row. Stored as a canonical string
    # (36 chars) because the targets have mixed PK types: Room/FoodMenu/OTOP
    # use UUID while WellnessTimeSlot uses an integer BIGSERIAL id. Lookups
    # cast per item_type at runtime (services layer). Rollback/restore runs
    # WHERE item_type=? AND entity_id=?.
    entity_id = models.CharField(max_length=36, db_index=True)
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="booking_items",
    )
    item_title_snapshot = models.CharField(max_length=255)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    # Room stays: check-in -> scheduled_date, check-out -> scheduled_end_date.
    # Wellness: scheduled_date + scheduled_time_slot. Food/OTOP: both NULL.
    scheduled_date = models.DateField(null=True, blank=True)
    scheduled_end_date = models.DateField(null=True, blank=True)
    scheduled_time_slot = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = "booking_items"
        ordering = ("id",)

    def __str__(self):
        return f"{self.get_item_type_display()} x{self.quantity}: {self.item_title_snapshot}"

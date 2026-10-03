"""
Healthy dining & wellness domain models (spec §2.3 + Phase-1 Step-1 list).

Design decisions (WHY):
1. owner uses on_delete=models.RESTRICT (spec §5.3): a menu / wellness
   service referenced by paid bookings must survive its owner account.
2. WellnessTimeSlot carries its own capacity_available counter. Like the room
   calendar in apps.accommodations, that counter is what checkout locks with
   select_for_update() and what the 15-min expiry worker restores (Step 2/4).
3. Decimal prices use max_digits=10, decimal_places=2 and a MinValueValidator
   of 0.01 so zero/negative prices can never be persisted.
"""
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class FoodWellnessCategory(models.TextChoices):
    """Wellness tag for a menu item (spec food_menus.wellness_category)."""

    LOW_SUGAR = "LOW_SUGAR", "Low sugar"
    LOW_SODIUM = "LOW_SODIUM", "Low sodium"
    ORGANIC = "ORGANIC", "Organic"
    HERBAL = "HERBAL", "Herbal"
    VEGAN = "VEGAN", "Vegan"


class FoodMenu(models.Model):
    """A healthy menu item offered by a RESTAURANT_OWNER."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="food_menus",
    )
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    wellness_category = models.CharField(
        max_length=50, choices=FoodWellnessCategory.choices
    )
    calorie_estimate = models.PositiveIntegerField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    # CharField (not URLField) on purpose: keeps the column VARCHAR(1000) as
    # specified, and the value may be a future presigned S3/R2 URL or a CDN
    # path. URL format is validated by the serializer when needed.
    image_url = models.CharField(max_length=1000, blank=True, default="")

    class Meta:
        db_table = "food_menus"
        ordering = ("name",)
        verbose_name_plural = "Food menus"

    def __str__(self):
        return f"{self.name} ({self.get_wellness_category_display()})"


class WellnessService(models.Model):
    """A bookable spa / massage / wellness session by a WELLNESS_OWNER."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="wellness_services",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1)])
    max_capacity_per_session = models.IntegerField(
        default=1, validators=[MinValueValidator(1)]
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "wellness_services"
        ordering = ("title",)
        verbose_name_plural = "Wellness services"

    def __str__(self):
        return f"{self.title} ({self.duration_minutes} min)"


class WellnessTimeSlot(models.Model):
    """A concrete session instance: one service on one date at one time."""

    service = models.ForeignKey(
        WellnessService, on_delete=models.CASCADE, related_name="time_slots"
    )
    slot_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity_available = models.IntegerField(validators=[MinValueValidator(0)])

    class Meta:
        db_table = "wellness_time_slots"
        ordering = ("slot_date", "start_time")
        constraints = [
            models.UniqueConstraint(
                fields=["service", "slot_date", "start_time"],
                name="uniq_wellness_service_slot",
            )
        ]

    def __str__(self):
        return f"{self.service.title} @ {self.slot_date} {self.start_time}"

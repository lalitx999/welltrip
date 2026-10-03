"""Models for Interactive Maps, Digital Passport Gamification & Community CRM."""
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models


class MapLocationCategory(models.TextChoices):
    HOMESTAY = "HOMESTAY", "โฮมสเตย์ / ที่พักชุมชน"
    FOOD = "FOOD", "ร้านอาหารสุขภาพ"
    WELLNESS = "WELLNESS", "ศูนย์นวดแผนไทยและสปา"
    OTOP = "OTOP", "ศูนย์จำหน่ายสินค้า OTOP"
    PHOTO_SPOT = "PHOTO_SPOT", "จุดถ่ายรูป / จุดเช็คอินธรรมชาติ"


class MapLocation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=150)
    category = models.CharField(
        max_length=50,
        choices=MapLocationCategory.choices,
        default=MapLocationCategory.PHOTO_SPOT,
    )
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    address = models.TextField(blank=True, default="")
    related_entity_id = models.CharField(max_length=36, blank=True, null=True)
    qr_secret = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "map_locations"
        ordering = ("title",)

    def __str__(self):
        return f"{self.title} ({self.category})"


class PassportStamp(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="passport_stamps",
    )
    location = models.ForeignKey(
        MapLocation,
        on_delete=models.CASCADE,
        related_name="stamps",
    )
    verified_method = models.CharField(max_length=20, default="QR_GPS")
    stamped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "passport_stamps"
        unique_together = ("user", "location")
        ordering = ("-stamped_at",)

    def __str__(self):
        return f"Stamp ({self.user.email}) at {self.location.title}"


class UserPoints(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="loyalty_points",
    )
    total_earned = models.IntegerField(default=0)
    current_balance = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_points"

    def __str__(self):
        return f"Points ({self.user.email}): {self.current_balance} pts"


class Coupon(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    min_purchase = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "coupons"
        ordering = ("-created_at",)

    def __str__(self):
        return f"Coupon {self.code} (-{self.discount_amount} THB)"

"""
OTOP retail domain model (spec §2.3 otop_products + Phase-1 Step-1 list).

Design decisions (WHY):
1. stock_quantity is a PositiveIntegerField - Django adds a DB CHECK (>= 0)
   on PostgreSQL - so inventory can never go negative even if a buggy caller
   bypasses Python validation (ZERO TRUST at the DB layer).
2. owner is RESTRICT (spec §5.3) so a product referenced by paid bookings
   can never be removed out from under them.
3. sku is auto-generated in save() when omitted, for the same reason as
   Accommodation.slug: NOT NULL + UNIQUE + no default would crash any insert
   that forgets to pass it.
"""
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class OTOPCategory(models.TextChoices):
    """Product category (spec otop_products.category)."""

    HERBAL_PRODUCT = "HERBAL_PRODUCT", "Herbal product"
    TEXTILE = "TEXTILE", "Textile"
    PROCESSED_FOOD = "PROCESSED_FOOD", "Processed food"
    CRAFT = "CRAFT", "Craft"


class OTOPProduct(models.Model):
    """A single retail product sold by an OTOP_OWNER."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="otop_products",
    )
    name = models.CharField(max_length=200, db_index=True)
    category = models.CharField(max_length=50, choices=OTOPCategory.choices)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    # PositiveIntegerField => DB CHECK (stock_quantity >= 0).
    stock_quantity = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "otop_products"
        ordering = ("name",)
        verbose_name_plural = "OTOP products"

    def __str__(self):
        return f"{self.name} (SKU: {self.sku})"

    def save(self, *args, **kwargs):
        """Auto-generate a readable SKU from the name when one was not given.

        WHY: the column is UNIQUE + NOT NULL with no default. Auto-filling here
        keeps inserts valid at every layer and produces a vendor-friendly SKU
        like "HERBAL-TEA-4F8A21" instead of an empty-string crash. getattr() is
        used because an unset field (no model default) is absent from the
        instance dict and plain attribute access would raise.
        """
        if not getattr(self, "sku", ""):
            base = slugify(self.name).upper() or "OTOP"
            self.sku = f"{base}-{uuid.uuid4().hex[:6].upper()}"
        return super().save(*args, **kwargs)

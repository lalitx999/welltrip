"""
HTTP layer for the OTOP API (Step 3, otop slice).

WHY a hybrid view style (same as accommodations / services):
- GET/POST product CRUD uses CBV generics + StandardPagination.
- POST .../stock/ is a single-purpose command that mutates stock_quantity;
  it is an explicit @api_view (no generics magic).

WHY NOT reuse reserve_stock()/restore_stock() for the vendor stock endpoint:
- Those two functions are the booking system's inventory hold/release paths
  (they lock + mutate stock inside the checkout/expiry transactions). A vendor
  manually restocking a product is a different operation: it adjusts the
  CURRENT quantity by a signed delta. Mixing them would couple manual edits to
  booking hold semantics. Both still lock the row the same way to stay safe
  against a concurrent checkout.
"""
from decimal import Decimal

from django.db import transaction
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny

from common.pagination import StandardPagination
from common.permissions import IsOtopOwner
from common.responses import api_success
from common.views import EnvelopeMixin, can_manage_vendor_object

from .models import OTOPCategory, OTOPProduct
from .serializers import (
    OTOPProductSerializer,
    OTOPStockAdjustSerializer,
)


def _parse_price(value, field_name):
    try:
        return Decimal(str(value))
    except Exception as exc:  # decimal.InvalidOperation / TypeError
        raise ValidationError({field_name: f"{field_name} must be a number."}) from exc


# ---------------------------------------------------------------------------
# GET/POST /api/v1/otop/
# ---------------------------------------------------------------------------
class OTOPProductListCreateView(EnvelopeMixin, generics.ListCreateAPIView):
    """Public active-product listing (GET) + OTOP_OWNER create (POST)."""

    serializer_class = OTOPProductSerializer
    pagination_class = StandardPagination

    @property
    def success_message(self):
        if self.request and self.request.method == "POST":
            return "OTOP product created."
        return "OTOP products retrieved."

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsOtopOwner()]
        return [AllowAny()]

    def get_queryset(self):
        params = self.request.query_params
        qs = OTOPProduct.objects.filter(is_active=True)

        # Spec: category can be a comma-separated list (HERBAL_PRODUCT,TEXTILE).
        category = params.get("category")
        if category:
            categories = [c.strip() for c in category.split(",") if c.strip()]
            unknown = [c for c in categories if c not in OTOPCategory.values]
            if unknown:
                raise ValidationError(
                    {
                        "category": (
                            f"Unknown category value(s): {unknown}. "
                            f"Allowed: {list(OTOPCategory.values)}."
                        )
                    }
                )
            qs = qs.filter(category__in=categories)

        search = params.get("search")
        if search:
            qs = qs.filter(name__icontains=search.strip())

        min_price = params.get("min_price")
        if min_price:
            qs = qs.filter(price__gte=_parse_price(min_price, "min_price"))
        max_price = params.get("max_price")
        if max_price:
            qs = qs.filter(price__lte=_parse_price(max_price, "max_price"))

        return qs

    def perform_create(self, serializer):
        # owner comes from the authenticated token, never from the request body.
        serializer.save(owner=self.request.user)


# ---------------------------------------------------------------------------
# POST /api/v1/otop/{id}/stock/
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsOtopOwner])
def otop_stock_view(request, product_id):
    """Adjust stock_quantity by a signed delta ({delta: +N / -N}).

    WHY select_for_update(): a concurrent checkout may be reserving stock from
    this very product (bookings slice). Locking the row here serializes manual
    stock edits against those reservations and prevents lost updates.
    """
    serializer = OTOPStockAdjustSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    delta = serializer.validated_data["delta"]
    if delta == 0:
        raise ValidationError({"delta": "delta must not be zero."})

    with transaction.atomic():
        try:
            product = OTOPProduct.objects.select_for_update().get(pk=product_id)
        except OTOPProduct.DoesNotExist as exc:
            raise NotFound("OTOP product not found.") from exc

        if not can_manage_vendor_object(request.user, product):
            raise PermissionDenied("You can only manage your own OTOP products.")

        new_stock = product.stock_quantity + delta
        if new_stock < 0:
            raise ValidationError(
                {
                    "delta": (
                        f"Cannot reduce below zero: current stock is "
                        f"{product.stock_quantity} but delta is {delta}."
                    )
                }
            )

        product.stock_quantity = new_stock
        # NOTE: OTOPProduct has no updated_at column (models.py) - save only
        # the field that actually changed.
        product.save(update_fields=["stock_quantity"])

    return api_success(
        {"id": str(product.id), "stock_quantity": product.stock_quantity},
        message="OTOP stock updated.",
    )


# ---------------------------------------------------------------------------
# GET /api/v1/otop/my/ & GET/PATCH /api/v1/otop/{id}/
# ---------------------------------------------------------------------------
class MyOTOPProductListView(EnvelopeMixin, generics.ListAPIView):
    """Vendor view to list all OTOP products owned by the current user."""

    permission_classes = [IsOtopOwner]
    serializer_class = OTOPProductSerializer
    pagination_class = StandardPagination
    success_message = "My OTOP products retrieved."

    def get_queryset(self):
        return OTOPProduct.objects.filter(owner=self.request.user)


class OTOPProductDetailUpdateView(EnvelopeMixin, generics.RetrieveUpdateAPIView):
    """Retrieve or update an OTOP product by ID."""

    serializer_class = OTOPProductSerializer
    queryset = OTOPProduct.objects.all()

    @property
    def success_message(self):
        if self.request and self.request.method in ("PATCH", "PUT"):
            return "OTOP product updated."
        return "OTOP product retrieved."

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT"):
            return [IsOtopOwner()]
        return [AllowAny()]

    def get_object(self):
        product = super().get_object()
        if self.request.method in ("PATCH", "PUT") and not can_manage_vendor_object(
            self.request.user, product
        ):
            raise PermissionDenied("You can only manage your own OTOP product.")
        return product


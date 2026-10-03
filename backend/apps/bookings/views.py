"""
HTTP layer for the bookings API (Step 3, bookings slice).

Endpoints (C3 §5.3):
- POST /bookings/checkout/   - atomic multi-vendor checkout (TOURIST)
- GET  /bookings/my-orders/  - paginated order history of the caller (TOURIST)
- GET  /bookings/{id}/       - one booking detail (owner only)

WHY a hybrid view style (consistent with every other slice):
- checkout is a single command -> FBV (@api_view).
- my-orders / detail are read endpoints -> CBV generics/APIView + pagination.

WHY the checkout body is re-validated in a serializer instead of trusting the
services alone: CartItemSerializer turns the JSON date strings into real date
objects and reports 400 field errors per item BEFORE the checkout transaction
starts (a mid-transaction failure is costlier and less readable).
"""
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated

from common.pagination import StandardPagination
from common.permissions import IsTourist
from common.responses import api_error, api_success
from common.views import EnvelopeMixin

from .models import Booking, BookingStatus
from .serializers import (
    BookingDetailSerializer,
    BookingListSerializer,
    CartItemSerializer,
)
from .services import CheckoutError, execute_atomic_checkout

from apps.payments.services import create_bank_transfer_payment

# CheckoutError codes that mean "conflict with current state" (spec §5.1
# aborts with 409 when inventory/slot/stock cannot be fulfilled).
_CONFLICT_CODES = {
    "ROOM_UNAVAILABLE",
    "SLOT_UNAVAILABLE",
    "STOCK_UNAVAILABLE",
    "ITEM_UNAVAILABLE",
}


def _checkout_error_response(exc):
    """Build the error envelope for a CheckoutError (C3 §5.4 mapping).

    - codes meaning "bad input" (EMPTY_CART/INVALID_ITEM/INVALID_ITEM_TYPE)
      stay HTTP 400;
    - codes meaning "not enough stock/slots/rooms right now" become 409
      Conflict, exactly as spec §5.1 prescribes ("abort with 409 Conflict").

    Returning api_error(...) directly (instead of raising a ValidationError)
    keeps the machine `error.code` (e.g. ROOM_UNAVAILABLE) instead of a generic
    VALIDATIONERROR and lets the FBV control the HTTP status.
    """
    is_conflict = exc.code in _CONFLICT_CODES
    # details defaults to {} (services.CheckoutError), so only forward it when
    # the caller actually attached context.
    details = exc.details if exc.details else None
    return api_error(
        code=exc.code or "CHECKOUT_FAILED",
        message=exc.message or "Checkout failed.",
        details=details,
        status=(
            status.HTTP_409_CONFLICT if is_conflict else status.HTTP_400_BAD_REQUEST
        ),
    )


def _get_owned_booking(booking_id, user):
    """Fetch a booking owned by `user`, else 404 (no information leak)."""
    try:
        return Booking.objects.get(pk=booking_id, user_id=user.id)
    except Booking.DoesNotExist as exc:
        raise NotFound("Booking not found.") from exc


# ---------------------------------------------------------------------------
# POST /api/v1/bookings/checkout/
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsTourist])
def checkout_view(request):
    """Atomically reserve every cart line and create Booking + Payment."""
    idempotency_key = request.headers.get("Idempotency-Key") or request.META.get("HTTP_IDEMPOTENCY_KEY")
    if idempotency_key:
        idempotency_key = str(idempotency_key).strip()
        existing = Booking.objects.filter(user=request.user, idempotency_key=idempotency_key).first()
        if existing:
            payment = getattr(existing, "payment", None)
            if not payment:
                payment = create_bank_transfer_payment(existing, existing.net_amount)
            result = {
                "booking_id": str(existing.id),
                "booking_code": existing.booking_code,
                "status": existing.status,
                "total_subtotal": str(existing.total_subtotal),
                "platform_fee": str(existing.platform_fee),
                "net_amount": str(existing.net_amount),
                "expires_at": existing.expires_at.isoformat(),
                "payment_id": str(payment.id),
                "payment_channel": payment.payment_channel,
            }
            return api_success(
                result,
                message="Checkout retrieved (idempotent replay).",
                status=status.HTTP_200_OK,
            )

    cart_items = request.data
    if not isinstance(cart_items, list):
        raise ValidationError({"items": "Request body must be a list of items."})

    # Validate + normalize every line FIRST (400s before any DB write).
    items = []
    for idx, raw in enumerate(cart_items):
        if not isinstance(raw, dict):
            raise ValidationError(
                {f"items[{idx}]": "Each cart item must be an object."}
            )
        serializer = CartItemSerializer(data=raw)
        serializer.is_valid(raise_exception=True)
        items.append(serializer.validated_data)

    try:
        result = execute_atomic_checkout(items, request.user, idempotency_key=idempotency_key)
    except CheckoutError as exc:
        return _checkout_error_response(exc)

    return api_success(
        result,
        message="Checkout successful. Please complete the payment.",
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/bookings/my-orders/
# ---------------------------------------------------------------------------
class MyBookingsListView(EnvelopeMixin, generics.ListAPIView):
    """Paginated order history for the authenticated TOURIST."""

    serializer_class = BookingListSerializer
    pagination_class = StandardPagination
    permission_classes = [IsTourist]
    success_message = "Bookings retrieved."

    # Query: ?status=active|completed|cancelled (FE tabs). Absent = all.
    _TAB_STATUSES = {
        "active": (
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.CONFIRMED,
        ),
        "completed": (BookingStatus.COMPLETED,),
        "cancelled": (
            BookingStatus.CANCELLED,
            BookingStatus.PAYMENT_EXPIRED,
        ),
    }

    def get_queryset(self):
        qs = Booking.objects.filter(user=self.request.user)

        tab = self.request.query_params.get("status")
        if tab:
            statuses = self._TAB_STATUSES.get(tab.lower())
            if statuses is None:
                raise ValidationError(
                    {
                        "status": (
                            "status must be one of "
                            f"{list(self._TAB_STATUSES)}."
                        )
                    }
                )
            qs = qs.filter(status__in=statuses)

        # Optimize: only fetch the payment row for each booking. payment is the
        # reverse side of Payment.booking (OneToOne), so prefetch is required
        # (select_related only works on forward FKs).
        return qs.prefetch_related("payment")


# ---------------------------------------------------------------------------
# GET /api/v1/bookings/{id}/
# ---------------------------------------------------------------------------
class BookingDetailView(EnvelopeMixin, generics.RetrieveAPIView):
    """One booking + items + payment; visible ONLY to the booking owner."""

    serializer_class = BookingDetailSerializer
    permission_classes = [IsAuthenticated]
    success_message = "Booking retrieved."

    def get_object(self):
        return _get_owned_booking(self.kwargs["booking_id"], self.request.user)

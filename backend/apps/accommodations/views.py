"""
HTTP layer for the accommodations API (Step 3, accommodations slice).

WHY a hybrid view style:
- Read/create CRUD endpoints (accommodation list, room list) use CBV generics:
  DRF gives filtering hooks + pagination (StandardPagination) for free and the
  code stays declarative.
- The pricing action (rooms/{id}/pricing/) is a single-purpose command that
  MUST serialize concurrent writes with the checkout transaction (room row is
  the lock point), so it is an explicit @api_view function - no generics magic.

WHY owner checks live in the view (not only in IsRole):
- IsRole only gates "WHO has role X". Editing somebody else's object would
  still pass that gate, so every vendor-mutating endpoint additionally checks
  object ownership (IDOR hardening). Non-owners get 404/403.
"""
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Prefetch, Subquery, OuterRef
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import StandardPagination
from common.permissions import IsHomestayOwner
from common.responses import api_success
from common.views import EnvelopeMixin, can_manage_vendor_object

from .models import (
    Accommodation,
    AccommodationStatus,
    Room,
    RoomPricingCalendar,
)
from .serializers import (
    AccommodationSerializer,
    RoomPricingSerializer,
    RoomPublicSerializer,
    RoomSerializer,
)
from .services import get_total_room_price


def _parse_date(value, field_name):
    """Parse ?date=YYYY-MM-DD into a date; 400 with a clear message on junk."""
    try:
        return date.fromisoformat(str(value))
    except ValueError as exc:
        raise ValidationError(
            {field_name: f"Invalid date '{value}'. Use YYYY-MM-DD."}
        ) from exc


def _parse_date_range(request):
    """Extract optional ?checkin=&checkout= pair; enforce both-or-neither."""
    checkin_raw = request.query_params.get("checkin")
    checkout_raw = request.query_params.get("checkout")
    if not checkin_raw and not checkout_raw:
        return None, None
    if not checkin_raw or not checkout_raw:
        raise ValidationError(
            {"checkin": "checkin and checkout must be provided together."}
        )
    checkin = _parse_date(checkin_raw, "checkin")
    checkout = _parse_date(checkout_raw, "checkout")
    if checkout <= checkin:
        raise ValidationError({"checkout": "checkout must be after checkin."})
    if (checkout - checkin).days > 30:
        raise ValidationError(
            {"checkout": "Stay duration cannot exceed 30 nights."}
        )
    return checkin, checkout


def _nights(checkin, checkout):
    """Every paid night in [checkin, checkout)."""
    return [
        checkin.fromordinal(d)
        for d in range(checkin.toordinal(), checkout.toordinal())
    ]


def _as_decimal(value, field_name):
    try:
        return Decimal(str(value))
    except Exception as exc:  # decimal.InvalidOperation / TypeError
        raise ValidationError(
            {field_name: f"{field_name} must be a number."}
        ) from exc


def _bulk_night_availability(rooms, nights):
    """Return {room_id: {night(iso): count}} using ONE calendar query.

    WHY bulk instead of calling calculate_room_availability() per room: the
    list endpoint may check many rooms for the same stay; N+1 queries would
    make the listing slow. A missing row means "no override => full inventory"
    (models.py RoomPricingCalendar docstring).
    """
    room_ids = [room.id for room in rooms]
    rows = RoomPricingCalendar.objects.filter(
        room_id__in=room_ids, date__in=nights
    )

    counts = {}  # {(room_id, night): count}
    for row in rows:
        counts[(row.room_id, row.date)] = row.available_count

    result = {}
    for room in rooms:
        result[room.id] = {
            night.isoformat(): counts.get((room.id, night), room.total_inventory)
            for night in nights
        }
    return result


# ---------------------------------------------------------------------------
# GET/POST /api/v1/accommodations/
# ---------------------------------------------------------------------------
class AccommodationListCreateView(EnvelopeMixin, generics.ListCreateAPIView):
    """Public ACTIVE listing (GET) + HOMESTAY_OWNER create (POST).

    GET is anonymous: PENDING_VERIFICATION/SUSPENDED listings are never shown.
    Filtering is done in get_queryset() so StandardPagination can count rows on
    the already-filtered set (correct total_items).
    """

    serializer_class = AccommodationSerializer
    pagination_class = StandardPagination

    @property
    def success_message(self):
        if self.request and self.request.method == "POST":
            return "Accommodation created."
        return "Accommodation list retrieved."

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsHomestayOwner()]
        return [AllowAny()]

    def get_queryset(self):
        params = self.request.query_params
        qs = Accommodation.objects.filter(status=AccommodationStatus.ACTIVE)

        province = params.get("province")
        if province:
            qs = qs.filter(province__iexact=province.strip())

        checkin, checkout = _parse_date_range(self.request)

        # ---- guests: keep only accommodations with an active room big enough
        guests = params.get("guests")
        if guests:
            try:
                guest_count = int(guests)
            except ValueError as exc:
                raise ValidationError({"guests": "guests must be an integer."}) from exc
            if guest_count < 1:
                raise ValidationError({"guests": "guests must be at least 1."})
            qs = qs.filter(
                rooms__is_active=True, rooms__max_capacity__gte=guest_count
            ).distinct()

        # ---- price: compare against the cheapest ACTIVE room base price
        cheapest = Subquery(
            Room.objects.filter(
                accommodation_id=OuterRef("pk"), is_active=True
            )
            .order_by("base_price_per_night")
            .values("base_price_per_night")[:1]
        )
        qs = qs.annotate(_min_price=cheapest)

        min_price = params.get("min_price")
        if min_price:
            qs = qs.filter(_min_price__gte=_as_decimal(min_price, "min_price"))
        max_price = params.get("max_price")
        if max_price:
            qs = qs.filter(_min_price__lte=_as_decimal(max_price, "max_price"))

        # ---- date range: keep only accommodations with >=1 fully free room
        # for EVERY night. Bulk scan is acceptable at Phase-1 data volumes;
        # a dedicated availability index is the upgrade path (TODO later).
        if checkin:
            nights = _nights(checkin, checkout)
            free_ids = self._accommodations_with_free_room(qs, nights)
            qs = Accommodation.objects.filter(pk__in=free_ids)

        return qs.prefetch_related(
            Prefetch(
                "rooms",
                queryset=Room.objects.filter(is_active=True).prefetch_related("images"),
                to_attr="active_rooms",
            )
        )

    @staticmethod
    def _accommodations_with_free_room(qs, nights):
        """Return accommodation ids that still have one fully-free active room."""
        accs = list(
            qs.prefetch_related(
                Prefetch(
                    "rooms",
                    queryset=Room.objects.filter(is_active=True).prefetch_related("images"),
                    to_attr="active_rooms",
                )
            )
        )
        rooms = [room for acc in accs for room in acc.active_rooms]
        availability = _bulk_night_availability(rooms, nights)

        free_ids = []
        for acc in accs:
            for room in acc.active_rooms:
                per_night = availability.get(room.id, {})
                # Keys are ISO strings; a missing key means "no calendar row" =
                # full inventory -> treat as >= 1.
                if all(
                    per_night.get(night.isoformat(), 1) >= 1 for night in nights
                ):
                    free_ids.append(acc.id)
                    break
        return free_ids

    def perform_create(self, serializer):
        # owner comes from the authenticated token, never from the request body.
        serializer.save(owner=self.request.user)


# ---------------------------------------------------------------------------
# GET/POST /api/v1/accommodations/{id}/rooms/
# ---------------------------------------------------------------------------
class AccommodationRoomsView(EnvelopeMixin, APIView):
    """Rooms of one accommodation: public read (GET) + owner create (POST).

    GET .../rooms/ accepts optional ?checkin=&checkout=; when present every
    room row is annotated with per-night availability + total price for the
    stay so the frontend can disable unavailable dates before checkout.
    """

    @property
    def success_message(self):
        if self.request and self.request.method == "POST":
            return "Room created."
        return "Rooms retrieved."

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsHomestayOwner()]
        return [AllowAny()]

    def get_accommodation(self, accommodation_id):
        """Public read must not leak non-ACTIVE listings (404 hides them)."""
        try:
            return Accommodation.objects.get(
                pk=accommodation_id, status=AccommodationStatus.ACTIVE
            )
        except Accommodation.DoesNotExist as exc:
            raise NotFound("Accommodation not found.") from exc

    def get_owned_accommodation(self, accommodation_id):
        """Owner write: 404 if missing, 403 when the caller may not manage it."""
        try:
            accommodation = Accommodation.objects.get(pk=accommodation_id)
        except Accommodation.DoesNotExist as exc:
            raise NotFound("Accommodation not found.") from exc
        if not can_manage_vendor_object(self.request.user, accommodation):
            raise PermissionDenied("You can only manage your own accommodation.")
        return accommodation

    def get(self, request, accommodation_id):
        accommodation = self.get_accommodation(accommodation_id)
        checkin, checkout = _parse_date_range(request)

        rooms = list(
            accommodation.rooms.filter(is_active=True).prefetch_related("images")
        )

        availability = None
        totals = {}
        if checkin:
            nights = _nights(checkin, checkout)
            availability = _bulk_night_availability(rooms, nights)
            for room in rooms:
                totals[str(room.id)] = get_total_room_price(
                    room.id, checkin, checkout
                )

        # Cheap trick to feed the serializer without changing its signature:
        # stash computed values on the instances (documented in the serializer).
        for room in rooms:
            room._availability = availability.get(room.id) if availability else None
            room._stay_total_price = totals.get(str(room.id))

        return Response(
            {
                "accommodation": AccommodationSerializer(accommodation).data,
                "rooms": RoomPublicSerializer(rooms, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, accommodation_id):
        accommodation = self.get_owned_accommodation(accommodation_id)
        serializer = RoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        room = serializer.save(accommodation=accommodation)
        return Response(
            RoomSerializer(room).data, status=status.HTTP_201_CREATED
        )


# ---------------------------------------------------------------------------
# POST /api/v1/accommodations/rooms/{id}/pricing/
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsHomestayOwner])
def room_pricing_view(request, room_id):
    """Set one (room, date) calendar override - price and/or remaining count.

    WHY select_for_update() on the Room row: the atomic checkout (bookings
    slice, Step 2) locks the Room row BEFORE touching calendar rows; locking
    the same row in the same order here serializes pricing writes against
    concurrent checkouts and prevents deadlocks (C3 lock-ordering rule).
    """
    serializer = RoomPricingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if "price_override" not in data and "available_count" not in data:
        raise ValidationError(
            "At least one of price_override or available_count is required."
        )

    with transaction.atomic():
        try:
            room = (
                Room.objects.select_for_update()
                .select_related("accommodation")
                .get(pk=room_id)
            )
        except Room.DoesNotExist as exc:
            raise NotFound("Room not found.") from exc

        if not can_manage_vendor_object(request.user, room.accommodation):
            raise PermissionDenied("You can only manage your own room.")

        date_key = data["date"]
        price_changed = "price_override" in data
        count_changed = "available_count" in data

        available_count = data.get("available_count")
        if count_changed:
            # The room row is already locked above (serialization point shared
            # with the atomic checkout). The calendar row can hold fewer than
            # total_inventory because live bookings already took units; a
            # vendor may never push remaining ABOVE what physically exists.
            if not 0 <= available_count <= room.total_inventory:
                raise ValidationError(
                    {
                        "available_count": (
                            "available_count must be between 0 and "
                            f"{room.total_inventory} (room total inventory)."
                        )
                    }
                )

        calendar = RoomPricingCalendar.objects.filter(
            room=room, date=date_key
        ).first()

        if calendar is None:
            # New row: missing row semantics = full availability, so default a
            # fresh row to total_inventory unless the vendor says otherwise.
            calendar = RoomPricingCalendar.objects.create(
                room=room,
                date=date_key,
                price_override=data["price_override"] if price_changed else None,
                available_count=(
                    available_count if count_changed else room.total_inventory
                ),
            )
        else:
            # Existing row may already hold decremented counts from bookings:
            # only touch the field(s) the client actually sent.
            update_fields = []
            if price_changed:
                # Explicit null clears the override back to the base price.
                calendar.price_override = data["price_override"]
                update_fields.append("price_override")
            if count_changed:
                calendar.available_count = available_count
                update_fields.append("available_count")
            calendar.save(update_fields=update_fields)

    return api_success(
        {
            "room_id": str(room.id),
            "date": calendar.date.isoformat(),
            "price_override": (
                str(calendar.price_override)
                if calendar.price_override is not None
                else None
            ),
            "available_count": calendar.available_count,
        },
        message="Room pricing updated.",
    )


# ---------------------------------------------------------------------------
# GET /api/v1/accommodations/my/
# ---------------------------------------------------------------------------
class MyAccommodationListView(EnvelopeMixin, generics.ListAPIView):
    """Vendor view to list all accommodations owned by the current user."""

    permission_classes = [IsHomestayOwner]
    serializer_class = AccommodationSerializer
    pagination_class = StandardPagination
    success_message = "My accommodations retrieved."

    def get_queryset(self):
        return Accommodation.objects.filter(owner=self.request.user)


# ---------------------------------------------------------------------------
# GET/PATCH /api/v1/accommodations/{id}/
# ---------------------------------------------------------------------------
class AccommodationDetailUpdateView(EnvelopeMixin, generics.RetrieveUpdateAPIView):
    """Retrieve or update an accommodation by ID."""

    serializer_class = AccommodationSerializer
    queryset = Accommodation.objects.all()

    @property
    def success_message(self):
        if self.request and self.request.method in ("PATCH", "PUT"):
            return "Accommodation updated."
        return "Accommodation retrieved."

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT"):
            return [IsHomestayOwner()]
        return [AllowAny()]

    def get_object(self):
        acc = super().get_object()
        if self.request.method in ("PATCH", "PUT") and not can_manage_vendor_object(
            self.request.user, acc
        ):
            raise PermissionDenied("You can only manage your own accommodation.")
        return acc


# ---------------------------------------------------------------------------
# GET/PATCH /api/v1/accommodations/rooms/{id}/
# ---------------------------------------------------------------------------
class RoomDetailUpdateView(EnvelopeMixin, generics.RetrieveUpdateAPIView):
    """Retrieve or update a room by ID."""

    serializer_class = RoomSerializer
    queryset = Room.objects.all()

    @property
    def success_message(self):
        if self.request and self.request.method in ("PATCH", "PUT"):
            return "Room updated."
        return "Room retrieved."

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT"):
            return [IsHomestayOwner()]
        return [AllowAny()]

    def get_object(self):
        room = super().get_object()
        if self.request.method in ("PATCH", "PUT") and not can_manage_vendor_object(
            self.request.user, room.accommodation
        ):
            raise PermissionDenied("You can only manage your own room.")
        return room





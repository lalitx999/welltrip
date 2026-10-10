"""
HTTP layer for the services API (Step 3, services slice: foods + wellness).

WHY a hybrid view style (same as accommodations):
- Pure CRUD list/create endpoints use CBV generics + StandardPagination.
- Wellness slot creation is a command backed by the domain service
  (create_wellness_time_slot) which raises ValueError/TypeError; those MUST be
  mapped to 4xx envelopes here (C3 §5.4) instead of leaking as 500s.

WHY owner checks live in the view (not only in IsRole):
- IsRole gates "WHO has the role"; ownership of a specific wellness service is
  checked separately via common.views.can_manage_vendor_object (IDOR guard).
  SUPER_ADMIN may manage any vendor service; others only their own.
"""
from datetime import date

from rest_framework import generics, status
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import StandardPagination
from common.permissions import IsRestaurantOwner, IsWellnessOwner
from common.views import EnvelopeMixin, can_manage_vendor_object

from .models import FoodMenu, FoodWellnessCategory, WellnessService
from .serializers import (
    FoodMenuSerializer,
    WellnessServiceSerializer,
    WellnessTimeSlotCreateSerializer,
    WellnessTimeSlotSerializer,
)
from .services import create_wellness_time_slot, get_wellness_slots


class SlotConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "SLOT_OVERLAP_CONFLICT"


def _parse_date_param(value, field_name="date"):
    """Parse ?date=YYYY-MM-DD into a date; 400 envelope on invalid input."""
    try:
        return date.fromisoformat(str(value))
    except ValueError as exc:
        raise ValidationError(
            {field_name: f"Invalid date '{value}'. Use YYYY-MM-DD."}
        ) from exc


def _map_service_error(exc):
    """Map a ValueError/TypeError from the wellness domain service to a DRF
    envelope (C3 §5.4). Overlaps map to 409 Conflict; others to 400."""
    msg = str(exc)
    if "overlaps" in msg or "already" in msg:
        raise SlotConflictError(msg)
    raise ValidationError(msg) from exc

# ---------------------------------------------------------------------------
# GET/POST /api/v1/foods/
# ---------------------------------------------------------------------------
class FoodListCreateView(EnvelopeMixin, generics.ListCreateAPIView):
    """Public available-food listing (GET) + RESTAURANT_OWNER create (POST)."""

    serializer_class = FoodMenuSerializer
    pagination_class = StandardPagination

    @property
    def success_message(self):
        if self.request and self.request.method == "POST":
            return "Food menu item created."
        return "Food menu items retrieved."

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsRestaurantOwner()]
        return [AllowAny()]

    def get_queryset(self):
        params = self.request.query_params
        qs = FoodMenu.objects.filter(is_available=True)

        # Spec query: category=LOW_SUGAR,VEGAN (comma-separated list).
        category = params.get("category")
        if category:
            categories = [c.strip() for c in category.split(",") if c.strip()]
            unknown = [c for c in categories if c not in FoodWellnessCategory.values]
            if unknown:
                raise ValidationError(
                    {
                        "category": (
                            f"Unknown category value(s): {unknown}. "
                            f"Allowed: {list(FoodWellnessCategory.values)}."
                        )
                    }
                )
            qs = qs.filter(wellness_category__in=categories)

        max_calorie = params.get("max_calorie")
        if max_calorie:
            try:
                qs = qs.filter(calorie_estimate__lte=int(max_calorie))
            except ValueError as exc:
                raise ValidationError(
                    {"max_calorie": "max_calorie must be an integer."}
                ) from exc

        return qs

    def perform_create(self, serializer):
        # owner comes from the authenticated token, never from the request body.
        serializer.save(owner=self.request.user)


# ---------------------------------------------------------------------------
# GET/POST /api/v1/wellness/
# ---------------------------------------------------------------------------
class WellnessServiceListCreateView(EnvelopeMixin, generics.ListCreateAPIView):
    """Public active-wellness list (GET) + WELLNESS_OWNER create (POST)."""

    serializer_class = WellnessServiceSerializer
    pagination_class = StandardPagination

    @property
    def success_message(self):
        if self.request and self.request.method == "POST":
            return "Wellness service created."
        return "Wellness services retrieved."

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsWellnessOwner()]
        return [AllowAny()]

    def get_queryset(self):
        # Public list never shows deactivated services (soft-off switch).
        return WellnessService.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# ---------------------------------------------------------------------------
# GET/POST /api/v1/wellness/{id}/slots/
# ---------------------------------------------------------------------------
class WellnessSlotsView(EnvelopeMixin, APIView):
    """Slots of one wellness service: public read (GET) + owner create (POST)."""

    @property
    def success_message(self):
        if self.request and self.request.method == "POST":
            return "Wellness time slot created."
        return "Wellness time slots retrieved."

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsWellnessOwner()]
        return [AllowAny()]

    def get_service(self, service_id, require_owner=False):
        """Fetch a service. Public GET requires is_active=True (404 otherwise);
        owner POST may manage any service they own regardless of is_active."""
        try:
            service = WellnessService.objects.get(pk=service_id)
        except WellnessService.DoesNotExist as exc:
            raise NotFound("Wellness service not found.") from exc

        if require_owner:
            if not can_manage_vendor_object(self.request.user, service):
                # Same message as "missing" -> do not reveal others' services.
                raise NotFound("Wellness service not found.")
        elif not service.is_active:
            raise NotFound("Wellness service not found.")

        return service

    def get(self, request, service_id):
        service = self.get_service(service_id)
        # Query param is required for a date-scoped slot listing (spec).
        slot_date_raw = request.query_params.get("date")
        if not slot_date_raw:
            raise ValidationError({"date": "date query parameter is required."})
        slot_date = _parse_date_param(slot_date_raw)

        slots = get_wellness_slots(service.id, slot_date)
        return Response(
            {
                "wellness_service": WellnessServiceSerializer(service).data,
                "slots": WellnessTimeSlotSerializer(slots, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, service_id):
        service = self.get_service(service_id, require_owner=True)
        serializer = WellnessTimeSlotCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        try:
            slot = create_wellness_time_slot(
                service_id=service.id,
                slot_date=data["date"],
                start_time=data["start_time"],
                end_time=data["end_time"],
                capacity=data.get("capacity"),
            )
        except (ValueError, TypeError) as exc:
            _map_service_error(exc)

        return Response(
            WellnessTimeSlotSerializer(slot).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# GET /api/v1/foods/my/ & GET/PATCH /api/v1/foods/{id}/
# ---------------------------------------------------------------------------
class MyFoodListView(EnvelopeMixin, generics.ListAPIView):
    """Vendor view to list all food items owned by the current user."""

    permission_classes = [IsRestaurantOwner]
    serializer_class = FoodMenuSerializer
    pagination_class = StandardPagination
    success_message = "My food menu items retrieved."

    def get_queryset(self):
        return FoodMenu.objects.filter(owner=self.request.user)


class FoodDetailUpdateView(EnvelopeMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a food item by ID."""

    serializer_class = FoodMenuSerializer
    queryset = FoodMenu.objects.all()

    @property
    def success_message(self):
        if self.request and self.request.method in ("PATCH", "PUT"):
            return "Food menu item updated."
        if self.request and self.request.method == "DELETE":
            return "Food menu item deleted."
        return "Food menu item retrieved."

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            return [IsRestaurantOwner()]
        return [AllowAny()]

    def get_object(self):
        item = super().get_object()
        if self.request.method in ("PATCH", "PUT", "DELETE") and not can_manage_vendor_object(
            self.request.user, item
        ):
            raise PermissionDenied("You can only manage your own food menu item.")
        return item


# ---------------------------------------------------------------------------
# GET /api/v1/wellness/my/ & GET/PATCH /api/v1/wellness/{id}/
# ---------------------------------------------------------------------------
class MyWellnessListView(EnvelopeMixin, generics.ListAPIView):
    """Vendor view to list all wellness services owned by the current user."""

    permission_classes = [IsWellnessOwner]
    serializer_class = WellnessServiceSerializer
    pagination_class = StandardPagination
    success_message = "My wellness services retrieved."

    def get_queryset(self):
        return WellnessService.objects.filter(owner=self.request.user)


class WellnessDetailUpdateView(EnvelopeMixin, generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a wellness service by ID."""

    serializer_class = WellnessServiceSerializer
    queryset = WellnessService.objects.all()

    @property
    def success_message(self):
        if self.request and self.request.method in ("PATCH", "PUT"):
            return "Wellness service updated."
        if self.request and self.request.method == "DELETE":
            return "Wellness service deleted."
        return "Wellness service retrieved."

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            return [IsWellnessOwner()]
        return [AllowAny()]

    def get_object(self):
        service = super().get_object()
        if self.request.method in ("PATCH", "PUT", "DELETE") and not can_manage_vendor_object(
            self.request.user, service
        ):
            raise PermissionDenied("You can only manage your own wellness service.")
        return service




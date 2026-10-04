"""Database-backed editorial content and optional, authenticated location logs."""
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from common.responses import api_success, api_error
from .models import EditorialEntry, LocationEvent


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EditorialEntry
        fields = ("id", "kind", "title", "title_en", "summary", "summary_en", "body", "body_en", "image_url", "image_alt", "location", "starts_at", "ends_at", "is_published", "updated_at")
        read_only_fields = ("id", "updated_at")

    def validate(self, attrs):
        start = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        end = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if start and end and end < start:
            raise serializers.ValidationError("End must not precede start.")
        return attrs


@api_view(["GET"])
@permission_classes([AllowAny])
def content_list(request):
    kind = request.query_params.get("kind")
    if kind not in EditorialEntry.Kind.values:
        return api_error("INVALID_KIND", "Choose STORY, COMMUNITY or ATTRACTION.")
    rows = EditorialEntry.objects.filter(is_published=True, kind=kind)
    try:
        page = max(1, int(request.query_params.get("page", 1)))
    except (ValueError, TypeError):
        return api_error("INVALID_PAGE", "Invalid page.")
    size = 12
    total = rows.count()
    return api_success(ContentSerializer(rows[(page-1)*size:page*size], many=True).data, meta={"pagination": {"page": page, "total_pages": max(1, (total+size-1)//size), "total": total}})


@api_view(["GET"])
@permission_classes([AllowAny])
def content_detail(request, pk):
    return api_success(ContentSerializer(get_object_or_404(EditorialEntry, pk=pk, is_published=True)).data)


def is_content_admin(user):
    return user.is_superuser or getattr(user, "role", "") == "SUPER_ADMIN"


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def content_admin(request):
    if not is_content_admin(request.user):
        return api_error("FORBIDDEN", "Super admin access required.", status=403)
    if request.method == "GET":
        return api_success(ContentSerializer(EditorialEntry.objects.all()[:100], many=True).data)
    serializer = ContentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return api_success(serializer.data, status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def content_admin_detail(request, pk):
    if not is_content_admin(request.user):
        return api_error("FORBIDDEN", "Super admin access required.", status=403)
    serializer = ContentSerializer(get_object_or_404(EditorialEntry, pk=pk), data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return api_success(serializer.data)


class LocationThrottle(UserRateThrottle):
    scope = "location_event"
    rate = "12/hour"


class LocationInput(serializers.Serializer):
    consent = serializers.BooleanField()
    consent_version = serializers.CharField(max_length=40)
    outcome = serializers.ChoiceField(choices=LocationEvent.Outcome.values)
    latitude = serializers.DecimalField(max_digits=12, decimal_places=8, min_value=-90, max_value=90, required=False)
    longitude = serializers.DecimalField(max_digits=13, decimal_places=8, min_value=-180, max_value=180, required=False)
    accuracy_m = serializers.IntegerField(min_value=0, max_value=40075000, required=False)

    def validate(self, attrs):
        if not attrs["consent"] or attrs["consent_version"] != settings.LOCATION_CONSENT_VERSION:
            raise serializers.ValidationError("Current explicit consent is required.")
        if attrs["outcome"] == "granted":
            if not all(k in attrs for k in ("latitude", "longitude", "accuracy_m")):
                raise serializers.ValidationError("Coordinates and accuracy are required.")
        elif any(k in attrs for k in ("latitude", "longitude", "accuracy_m")):
            raise serializers.ValidationError("Unsuccessful events must not include location.")
        return attrs


@api_view(["GET"])
@permission_classes([AllowAny])
def location_policy(request):
    return api_success({"version": settings.LOCATION_CONSENT_VERSION, "retention_days": settings.LOCATION_LOG_RETENTION_DAYS, "coordinate_decimals": 2, "purpose": "location_log"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([LocationThrottle])
def location_event(request):
    serializer = LocationInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    point = {}
    if data["outcome"] == "granted":
        point = {key: data[key].quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) for key in ("latitude", "longitude")}
        point["accuracy_m"] = data["accuracy_m"]
    LocationEvent.objects.create(user=request.user, outcome=data["outcome"], consent_version=data["consent_version"], expires_at=timezone.now()+timedelta(days=settings.LOCATION_LOG_RETENTION_DAYS), **point)
    return api_success({"recorded": True}, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_my_location_events(request):
    LocationEvent.objects.filter(user=request.user).delete()
    return api_success({"deleted": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def location_admin(request):
    if not is_content_admin(request.user):
        return api_error("FORBIDDEN", "Super admin access required.", status=403)
    # Expires immediately for readers even if the scheduled purge is delayed.
    rows = LocationEvent.objects.filter(expires_at__gt=timezone.now()).values("id", "outcome", "latitude", "longitude", "accuracy_m", "consent_version", "created_at", "expires_at")[:100]
    response = api_success(list(rows))
    response["Cache-Control"] = "no-store"
    return response

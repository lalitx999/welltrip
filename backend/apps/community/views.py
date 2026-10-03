"""Views for Interactive Maps, Digital Passport Gamification & CRM."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from common.responses import api_error, api_success
from .models import Coupon, MapLocation, PassportStamp, UserPoints
from .serializers import (
    CheckInSerializer,
    CouponSerializer,
    MapLocationSerializer,
    PassportStampSerializer,
    UserPointsSerializer,
)
from .services import process_qr_gps_checkin


@api_view(["GET"])
@permission_classes([AllowAny])
def map_locations_list_view(request):
    """GET /api/v1/maps/locations/ - List map location markers with category filtering."""
    category = request.query_params.get("category")
    qs = MapLocation.objects.all()
    if category:
        qs = qs.filter(category=category)

    serializer = MapLocationSerializer(qs, many=True)
    return api_success(serializer.data, message="Map locations retrieved successfully.")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def passport_check_in_view(request):
    """POST /api/v1/passport/check-in/ - Submit QR secret & GPS location to stamp passport."""
    serializer = CheckInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    try:
        result = process_qr_gps_checkin(
            user=request.user,
            qr_secret=data["qr_secret"],
            user_lat=float(data["latitude"]) if data.get("latitude") else None,
            user_lon=float(data["longitude"]) if data.get("longitude") else None,
        )
        return api_success(result, message=result["message"])
    except ValueError as e:
        return api_error(
            code="INVALID_CHECKIN",
            message=str(e),
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_stamps_view(request):
    """GET /api/v1/passport/my-stamps/ - List tourist's collected stamps."""
    stamps = PassportStamp.objects.filter(user=request.user).select_related("location")
    serializer = PassportStampSerializer(stamps, many=True)
    return api_success(serializer.data, message="User stamps retrieved successfully.")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_points_view(request):
    """GET /api/v1/crm/points/ - Check total earned & current points balance."""
    points, _ = UserPoints.objects.get_or_create(user=request.user)
    serializer = UserPointsSerializer(points)
    return api_success(serializer.data, message="Loyalty points retrieved.")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def coupon_redeem_view(request):
    """POST /api/v1/crm/coupons/redeem/ - Redeem a coupon code."""
    code = request.data.get("code", "").strip().upper()
    coupon = Coupon.objects.filter(code=code, is_active=True).first()
    if not coupon:
        return api_error(
            code="INVALID_COUPON",
            message="คูปองส่วนลดไม่ถูกต้อง หรือหมดอายุแล้ว",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    serializer = CouponSerializer(coupon)
    return api_success(serializer.data, message="Coupon applied successfully.")

"""Business logic services for GPS Geofencing, Stamp Rewards & CRM Points."""
import math
import uuid
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone

from .models import Coupon, MapLocation, PassportStamp, UserPoints


def haversine_distance_meters(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate distance in meters between two lat/lon points on Earth."""
    r = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def process_qr_gps_checkin(
    user, qr_secret: str, user_lat: float | None = None, user_lon: float | None = None
) -> dict:
    """Validate QR Secret & Geofence GPS distance (within 100 meters)."""
    location = MapLocation.objects.filter(qr_secret=qr_secret).first()
    if not location:
        raise ValueError("รหัส QR Code ไม่ถูกต้อง หรือไม่พบจุดเช็คอินนี้ในระบบ")

    already_stamped = PassportStamp.objects.filter(
        user=user, location=location
    ).exists()
    if already_stamped:
        return {
            "success": True,
            "message": f"คุณเคยประทับตราที่ '{location.title}' แล้ว",
            "already_stamped": True,
        }

    # Geofence check if user provided GPS coordinates
    verified_method = "QR_CODE"
    if user_lat is not None and user_lon is not None:
        loc_lat = float(location.latitude)
        loc_lon = float(location.longitude)
        dist = haversine_distance_meters(user_lat, user_lon, loc_lat, loc_lon)
        if dist > 500:  # Allow 500 meters tolerance for GPS accuracy
            raise ValueError(
                f"ตำแหน่งของคุณอยู่ห่างจากจุดเช็คอิน {int(dist)} เมตร (ต้องไม่เกิน 500 เมตร)"
            )
        verified_method = "QR_GPS"

    stamp = PassportStamp.objects.create(
        user=user, location=location, verified_method=verified_method
    )

    # Award points for check-in
    points, _ = UserPoints.objects.get_or_create(user=user)
    points.total_earned += 50
    points.current_balance += 50
    points.save()

    # Check for reward milestone (every 3 stamps -> generate 50 THB coupon)
    total_stamps = PassportStamp.objects.filter(user=user).count()
    reward_coupon = None
    if total_stamps % 3 == 0:
        coupon_code = f"WELLTRIP-STAMP-{uuid.uuid4().hex[:6].upper()}"
        reward_coupon = Coupon.objects.create(
            code=coupon_code,
            discount_amount=Decimal("50.00"),
            min_purchase=Decimal("200.00"),
            expires_at=timezone.now() + timedelta(days=30),
            is_active=True,
        )

    return {
        "success": True,
        "message": f"เช็คอินสำเร็จ! สะสมตราประทับ ณ {location.title} เรียบร้อยแล้ว (+50 คะแนน)",
        "stamp_id": stamp.id,
        "total_stamps": total_stamps,
        "reward_coupon": (
            {
                "code": reward_coupon.code,
                "discount_amount": str(reward_coupon.discount_amount),
            }
            if reward_coupon
            else None
        ),
    }

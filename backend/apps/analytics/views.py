"""Views for Community Admin & Super Admin Analytics Reporting."""
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from common.responses import api_error, api_success
from .services import generate_analytics_csv_report, get_community_analytics_data


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def community_analytics_view(request):
    """GET /api/v1/analytics/community/ - Retrieve Community Admin Dashboard metrics."""
    user = request.user
    if user.role not in ["COMMUNITY_ADMIN", "SUPER_ADMIN"]:
        return api_error(
            code="PERMISSION_DENIED",
            message="เฉพาะผู้ดูแลระบบชุมชน (Community Admin) เท่านั้นที่สามารถดูสถิตินี้ได้",
            status=status.HTTP_403_FORBIDDEN,
        )

    data = get_community_analytics_data()
    return api_success(data, message="Community analytics data retrieved successfully.")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_excel_report_view(request):
    """GET /api/v1/analytics/export/excel/ - Export Community Report as a CSV/Excel file."""
    user = request.user
    if user.role not in ["COMMUNITY_ADMIN", "SUPER_ADMIN"]:
        return api_error(
            code="PERMISSION_DENIED",
            message="เฉพาะผู้ดูแลระบบชุมชนเท่านั้นที่สามารถดาวน์โหลดรายงานได้",
            status=status.HTTP_403_FORBIDDEN,
        )

    csv_content = generate_analytics_csv_report()
    response = HttpResponse(csv_content, content_type="text/csv; charset=utf-8-sig")
    response["Content-Disposition"] = 'attachment; filename="welltrip_community_report.csv"'
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def superadmin_analytics_view(request):
    """GET /api/v1/analytics/superadmin/ - Provincial & Multi-community high-level summary overview."""
    user = request.user
    if user.role != "SUPER_ADMIN":
        return api_error(
            code="PERMISSION_DENIED",
            message="เฉพาะผู้ดูแลระบบสูงสุด (Super Admin) เท่านั้น",
            status=status.HTTP_403_FORBIDDEN,
        )

    base_data = get_community_analytics_data()
    provincial_overview = []  # Provincial attribution is not available in the schema.

    result = {
        "overall_summary": base_data["summary"],
        "provincial_overview": provincial_overview,
    }
    return api_success(result, message="Super Admin provincial overview retrieved.")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overview_view(request):
    """Database totals for the existing admin dashboard, no demo fallback."""
    if request.user.role not in ("SUPER_ADMIN", "COMMUNITY_ADMIN"):
        return api_error("FORBIDDEN", "Admin access required.", status=403)
    from django.contrib.auth import get_user_model
    from django.db.models import Sum
    from apps.accommodations.models import Accommodation
    from apps.services.models import WellnessService
    from apps.otop.models import OTOPProduct
    from apps.bookings.models import Booking
    from apps.payments.models import Payment, PaymentSlip
    users = get_user_model().objects.all()
    response = api_success({
        "total_gmv": Payment.objects.filter(status="SUCCESS").aggregate(total=Sum("amount"))["total"] or 0,
        "total_bookings": Booking.objects.count(),
        "total_users": users.count(),
        "total_merchants": users.filter(role__in=("HOMESTAY_OWNER", "RESTAURANT_OWNER", "WELLNESS_OWNER", "OTOP_OWNER")).count(),
        "total_accommodations": Accommodation.objects.count(),
        "total_wellness_services": WellnessService.objects.count(),
        "total_otop_products": OTOPProduct.objects.count(),
        "pending_approvals": Accommodation.objects.filter(status="PENDING_VERIFICATION").count(),
        "pending_payments": PaymentSlip.objects.filter(status="PENDING_CHECK").count(),
    })
    response["Cache-Control"] = "no-store"
    return response

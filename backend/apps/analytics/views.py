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
            status_code=status.HTTP_403_FORBIDDEN,
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
            status_code=status.HTTP_403_FORBIDDEN,
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
            status_code=status.HTTP_403_FORBIDDEN,
        )

    base_data = get_community_analytics_data()
    provincial_overview = [
        {"province": "นนทบุรี", "communities_count": 4, "total_gmv": 450000.0, "active_merchants": 28},
        {"province": "เชียงใหม่", "communities_count": 8, "total_gmv": 820000.0, "active_merchants": 52},
        {"province": "ภูเก็ต", "communities_count": 5, "total_gmv": 690000.0, "active_merchants": 34},
    ]

    result = {
        "overall_summary": base_data["summary"],
        "provincial_overview": provincial_overview,
    }
    return api_success(result, message="Super Admin provincial overview retrieved.")

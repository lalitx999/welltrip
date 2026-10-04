"""URL routes for Community & Super Admin Analytics Reporting."""
from django.urls import path
from . import views

app_name = "analytics"

urlpatterns = [
    path("overview/", views.overview_view, name="overview"),
    path("community/", views.community_analytics_view, name="community-analytics"),
    path("export/excel/", views.export_excel_report_view, name="export-excel"),
    path("superadmin/", views.superadmin_analytics_view, name="superadmin-analytics"),
]

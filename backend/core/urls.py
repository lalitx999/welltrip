"""
Root URL configuration.

All API routes live under /api/v1/... ; the auth endpoints are delegated
to apps.authentication.urls (spec §4 Core Endpoint Matrix).

Media (uploaded slip images) is served by Django ONLY in local development
(DEBUG=True). In production MEDIA_URL is expected to point at object storage
(S3/R2) behind django-storages - Django must never serve user uploads in prod.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.authentication import views as auth_views
from apps.community import views as community_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/media/upload/", community_views.media_upload_view, name="media-upload-root"),
    path("api/v1/admin/approvals/", auth_views.admin_approvals_list_view, name="admin-approvals-list"),
    path("api/v1/admin/approvals/<str:entity_id>/", auth_views.admin_approval_action_view, name="admin-approval-action"),
    path("api/v1/auth/", include("apps.authentication.urls")),
    path(
        "api/v1/accommodations/", include("apps.accommodations.urls")
    ),
    path("api/v1/", include("apps.services.urls")),
    path("api/v1/otop/", include("apps.otop.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/bookings/", include("apps.bookings.urls")),
    path("api/v1/health/", include(("apps.ai_recommendations.urls", "health"), namespace="health")),
    path("api/v1/ai/", include(("apps.ai_recommendations.urls", "ai"), namespace="ai")),
    path("api/v1/", include(("apps.community.urls", "community"), namespace="community")),
    path("api/v1/analytics/", include(("apps.analytics.urls", "analytics"), namespace="analytics")),
]

if settings.DEBUG:
    # Dev-only: let uploaded slip images be reachable at http://127.0.0.1:8000/media/...
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


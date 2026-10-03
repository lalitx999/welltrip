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

urlpatterns = [
    path("admin/", admin.site.urls),
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


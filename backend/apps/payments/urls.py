"""Payment endpoint routes, mounted at /api/v1/payments/ in core/urls.py."""
from django.urls import path

from . import views

app_name = "payments"

urlpatterns = [
    path(
        "slips/upload/",
        views.slip_upload_view,
        name="slip-upload",
    ),
    path(
        "<uuid:payment_id>/",
        views.PaymentDetailView.as_view(),
        name="payment-detail",
    ),
]

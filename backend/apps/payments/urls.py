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
        "admin/pending/",
        views.admin_pending_payments_view,
        name="admin-pending-payments",
    ),
    path(
        "admin/approve/<str:payment_id>/",
        views.admin_approve_payment_view,
        name="admin-approve-payment",
    ),
    path(
        "<str:payment_id>/verify/",
        views.admin_approve_payment_view,
        name="payment-verify",
    ),
    path(
        "<str:payment_id>/",
        views.PaymentDetailView.as_view(),
        name="payment-detail",
    ),
]

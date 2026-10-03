"""Booking endpoint routes, mounted at /api/v1/bookings/ in core/urls.py."""
from django.urls import path

from . import views

app_name = "bookings"

urlpatterns = [
    path("checkout/", views.checkout_view, name="checkout"),
    path("my-orders/", views.MyBookingsListView.as_view(), name="my-orders"),
    path(
        "<uuid:booking_id>/",
        views.BookingDetailView.as_view(),
        name="booking-detail",
    ),
]

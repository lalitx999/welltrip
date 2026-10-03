"""Accommodation endpoint routes, mounted at /api/v1/accommodations/."""
from django.urls import path

from . import views

app_name = "accommodations"

urlpatterns = [
    path("", views.AccommodationListCreateView.as_view(), name="accommodation-list"),
    path(
        "my/",
        views.MyAccommodationListView.as_view(),
        name="my-accommodations",
    ),
    path(
        "<uuid:pk>/",
        views.AccommodationDetailUpdateView.as_view(),
        name="accommodation-detail",
    ),
    path(
        "<uuid:accommodation_id>/rooms/",
        views.AccommodationRoomsView.as_view(),
        name="accommodation-rooms",
    ),
    path(
        "rooms/<uuid:pk>/",
        views.RoomDetailUpdateView.as_view(),
        name="room-detail",
    ),
    path(
        "rooms/<uuid:room_id>/pricing/",
        views.room_pricing_view,
        name="room-pricing",
    ),
]

"""URL routes for Interactive Maps, Digital Passport Gamification & CRM."""
from django.urls import path
from . import views

app_name = "community"

urlpatterns = [
    path("maps/locations/", views.map_locations_list_view, name="map-locations"),
    path("passport/check-in/", views.passport_check_in_view, name="passport-checkin"),
    path("passport/my-stamps/", views.my_stamps_view, name="my-stamps"),
    path("crm/points/", views.user_points_view, name="user-points"),
    path("crm/coupons/redeem/", views.coupon_redeem_view, name="coupon-redeem"),
]

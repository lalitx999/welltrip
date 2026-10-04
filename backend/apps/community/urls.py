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
    path("media/upload/", views.media_upload_view, name="media-upload"),
]

from . import experience_api
urlpatterns += [
    path("content/", experience_api.content_list, name="content-list"),
    path("content/<str:pk>/", experience_api.content_detail, name="content-detail"),
    path("content-admin/", experience_api.content_admin, name="content-admin"),
    path("content-admin/<str:pk>/", experience_api.content_admin_detail, name="content-admin-detail"),
    path("location/policy/", experience_api.location_policy, name="location-policy"),
    path("location/events/", experience_api.location_event, name="location-event"),
    path("location/my-events/", experience_api.delete_my_location_events, name="location-delete"),
    path("location/admin/", experience_api.location_admin, name="location-admin"),
]

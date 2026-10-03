"""Service endpoint routes (foods + wellness), mounted in core/urls.py."""
from django.urls import path

from . import views

app_name = "services"

urlpatterns = [
    path("foods/", views.FoodListCreateView.as_view(), name="food-list"),
    path("foods/my/", views.MyFoodListView.as_view(), name="my-foods"),
    path(
        "foods/<uuid:pk>/",
        views.FoodDetailUpdateView.as_view(),
        name="food-detail",
    ),
    path(
        "wellness/",
        views.WellnessServiceListCreateView.as_view(),
        name="wellness-list",
    ),
    path(
        "wellness/my/",
        views.MyWellnessListView.as_view(),
        name="my-wellness",
    ),
    path(
        "wellness/<uuid:pk>/",
        views.WellnessDetailUpdateView.as_view(),
        name="wellness-detail",
    ),
    path(
        "wellness/<uuid:service_id>/slots/",
        views.WellnessSlotsView.as_view(),
        name="wellness-slots",
    ),
]

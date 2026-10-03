"""OTOP endpoint routes, mounted at /api/v1/otop/ in core/urls.py."""
from django.urls import path

from . import views

app_name = "otop"

urlpatterns = [
    path("", views.OTOPProductListCreateView.as_view(), name="otop-list"),
    path("my/", views.MyOTOPProductListView.as_view(), name="my-otop"),
    path(
        "<uuid:pk>/",
        views.OTOPProductDetailUpdateView.as_view(),
        name="otop-detail",
    ),
    path(
        "<uuid:product_id>/stock/",
        views.otop_stock_view,
        name="otop-stock",
    ),
]

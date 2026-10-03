"""Auth endpoint routes, mounted at /api/v1/auth/ from core/urls.py."""
from django.urls import path

from . import views

app_name = "authentication"

urlpatterns = [
    path("register/", views.register_view, name="register"),
    path("login/", views.login_view, name="login"),
    path("refresh/", views.EnvelopedTokenRefreshView.as_view(), name="refresh"),
    path("oauth/google/", views.google_oauth_view, name="google-oauth"),
]

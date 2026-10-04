"""Auth endpoint routes, mounted at /api/v1/auth/ from core/urls.py."""
from django.urls import path

from . import views

app_name = "authentication"

urlpatterns = [
    path("register/", views.register_view, name="register"),
    path("register/merchant/", views.register_merchant_view, name="register-merchant"),
    path("login/", views.login_view, name="login"),
    path("refresh/", views.EnvelopedTokenRefreshView.as_view(), name="refresh"),
    path("oauth/google/", views.google_oauth_view, name="google-oauth"),
    path("me/", views.me_view, name="me"),
    path("users/", views.users_list_view, name="users-list"),
    path("users/<uuid:user_id>/role/", views.update_user_role_view, name="user-role-update"),
]

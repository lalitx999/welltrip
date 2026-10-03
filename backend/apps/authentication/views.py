"""
views.py - HTTP layer for the auth endpoints.

WHY plain @api_view functions instead of ViewSets? Auth endpoints are
single-purpose, asynchronous pairs of request->response with NO list/detail
CRUD behaviour, so ViewSets would only add ceremony.
"""
from django.contrib.auth import authenticate
from django.db import IntegrityError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenRefreshView

from common.responses import api_error, api_success

from .models import User
from .serializers import (
    GoogleIdTokenSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)
from .services import authenticate_with_google, issue_tokens_for_user


# ---------------------------------------------------------------------------
# POST /api/v1/auth/register/            (spec §4 - public, manual tourist)
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        user = serializer.save()
    except IntegrityError:
        # Race safety: two simultaneous registrations with the same email.
        return api_error(
            "EMAIL_TAKEN",
            "A user with this email is already registered.",
            status=status.HTTP_400_BAD_REQUEST,
        )
    return api_success(
        {"user": UserProfileSerializer(user).data},
        message="Registration successful.",
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login/               (spec §4 - returns JWT pair)
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return api_error(
            "INVALID_CREDENTIALS",
            "Invalid email or password.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.password:
        # Google-only account (password is NULL) can NEVER be used with a
        # password. NOTE: this message reveals that the email exists and is
        # Google-linked - an accepted UX trade-off; flip to the generic
        # INVALID_CREDENTIALS response if you prefer strict anti-enumeration.
        return api_error(
            "GOOGLE_ONLY_ACCOUNT",
            "This email is linked to a Google account. Please sign in with Google.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # authenticate() applies Django's ModelBackend: it verifies the hash and
    # refuses inactive users (is_active=False) transparently.
    user = authenticate(request, username=email, password=password)
    if user is None:
        return api_error(
            "INVALID_CREDENTIALS",
            "Invalid email or password.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    tokens = issue_tokens_for_user(user)
    return api_success(
        {
            "user": UserProfileSerializer(user).data,
            **tokens,
        },
        message="Login successful.",
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/oauth/google/        (spec §4 - verify Google ID token)
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def google_oauth_view(request):
    serializer = GoogleIdTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        user, is_new_user = authenticate_with_google(serializer.validated_data["id_token"])
    except ValueError as exc:
        # Token is malformed / expired / wrong audience / unverified email.
        return api_error(
            "INVALID_ID_TOKEN",
            str(exc),
            status=status.HTTP_401_UNAUTHORIZED,
        )
    except IntegrityError:
        # Extremely rare duplicate-email race between manual + Google signup.
        return api_error(
            "ACCOUNT_CONFLICT",
            "This email is already registered. Please log in first.",
            status=status.HTTP_409_CONFLICT,
        )

    tokens = issue_tokens_for_user(user)
    return api_success(
        {
            "user": UserProfileSerializer(user).data,
            "is_new_user": is_new_user,
            **tokens,
        },
        message="Google sign-in successful.",
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/refresh/  - silent refresh (SimpleJWT + rotation).
# Rotation is enabled in SIMPLE_JWT settings, so this endpoint mints a new
# refresh token too and blacklists the presented one.
# ---------------------------------------------------------------------------
class EnvelopedTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            return api_success(
                {
                    "access_token": response.data.get("access"),
                    "refresh_token": response.data.get("refresh"),
                },
                message="Token refreshed.",
            )
        return response

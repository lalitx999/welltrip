"""
services.py - pure business logic for authentication (spec §3 Folder Tree:
"Token issuance, Google ID Token verification").

Kept OUT of views.py on purpose: views stay thin (HTTP only) and these
functions can be re-used / unit-tested without touching the request layer.
"""
import uuid

import google.auth.exceptions
from django.conf import settings
from django.db.models import Q
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


def issue_tokens_for_user(user):
    """Issue a JWT access + refresh pair for an authenticated user.

    WHY: SimpleJWT's RefreshToken.for_user() is the canonical way to mint
    tokens for a custom User model. The client stores both tokens and uses
    the refresh token on /auth/refresh/ to silently get a new access token.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
    }


def build_unique_username(email, max_length=150):
    """Generate a spec-compatible unique username from an email address.

    WHY: the spec `users` table keeps a unique username column, but no API
    payload ever sends one. Deriving it server-side reconciles both halves
    of the spec without burdening the client. A short random suffix is
    appended when the base local-part is already taken (e.g. two users on
    different email providers can share a local-part).
    """
    base = (email or "").split("@")[0].strip().lower()[:100]
    base = base or "user"

    if not User.objects.filter(username__iexact=base).exists():
        return base

    # Keep trying until we find a free suffix (practically one attempt).
    while True:
        candidate = f"{base[: max_length - 9]}-{uuid.uuid4().hex[:8]}"
        if not User.objects.filter(username=candidate).exists():
            return candidate


def authenticate_with_google(id_token_value):
    """Verify a Google ID token and return (user, created_flag).

    Flow (in order):
      1. Cryptographically verify the token against Google's certs, using
         each configured client ID as the allowed audience.
      2. Reject tokens whose email is not Google-verified.
      3. Find the user by google_sub_id -> existing Google user (login).
      4. Else find by email -> LINK the Google identity to the existing
         account (enables "register by email, then sign in with Google").
      5. Else create a brand-new account with password=NULL.

    Raises ValueError with a client-safe message when the token is unusable.
    """
    info = _verify_id_token(id_token_value)

    # Google can issue tokens without an email scope; we cannot create an
    # account without one, and we never trust an unverified email.
    email = (info.get("email") or "").lower()
    if not email or info.get("email_verified") is not True:
        raise ValueError("Google account has no verified email address.")
    google_sub = info["sub"]

    created = False

    user = User.objects.filter(google_sub_id=google_sub).first()
    if user is not None:
        if not user.is_active:
            raise ValueError("Account is disabled.")
        return user, created  # known Google account -> normal login

    # Link to an existing manual account with the same verified email.
    user = User.objects.filter(Q(email__iexact=email) | Q(google_sub_id=google_sub)).first()
    if user is not None:
        if not user.is_active:
            raise ValueError("Account is disabled.")
        if user.google_sub_id and user.google_sub_id != google_sub:
            raise ValueError("This email is already linked to another Google account.")
        user.google_sub_id = google_sub
        user.is_verified = True  # Google already proved ownership of the email
        user.save(update_fields=["google_sub_id", "is_verified", "updated_at"])
        return user, created

    # Brand-new account: no password (NULL), identity comes from Google.
    user = User.objects.create_user(
        email=email,
        password=None,
        username=build_unique_username(email),
        google_sub_id=google_sub,
        first_name=info.get("given_name", ""),
        last_name=info.get("family_name", ""),
        is_verified=True,
    )
    return user, True


def _verify_id_token(id_token_value):
    """Try every configured audience; raise ValueError if none accepts it."""
    request = google_requests.Request()
    last_error = None
    for audience in settings.GOOGLE_OAUTH_CLIENT_IDS:
        try:
            return id_token.verify_oauth2_token(id_token_value, request, audience)
        except (ValueError, google.auth.exceptions.GoogleAuthError) as exc:
            last_error = exc
    if not settings.GOOGLE_OAUTH_CLIENT_IDS:
        raise ValueError("Google OAuth is not configured on the server.")
    raise ValueError("Google ID token verification failed.") from last_error

"""
Django BASE settings - shared by every environment.

SECURITY-FIRST: secrets come ONLY from environment variables or from a
backend/.env file loaded via django-environ. Nothing secret is hard-coded.
"""
from datetime import timedelta
from pathlib import Path

import environ

# backend/  (this file lives at core/settings/, so BASE_DIR = backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:3000", "http://127.0.0.1:3000"]),
    GOOGLE_OAUTH_CLIENT_IDS=(list, []),
    JWT_ACCESS_TOKEN_LIFETIME_MINUTES=(int, 15),
    JWT_REFRESH_TOKEN_LIFETIME_DAYS=(int, 7),
)

# Load backend/.env when present (used during local development).
environ.Env.read_env(BASE_DIR / ".env")

# ---------------------------------------------------------------------------
# Django core
# ---------------------------------------------------------------------------
# No default on purpose: Django refuses to boot without a real secret key.
SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt.token_blacklist",  # powers token rotation
    # Local apps
    "apps.authentication",
    "apps.accommodations",
    "apps.services",
    "apps.otop",
    "apps.bookings",
    "apps.payments",
    "apps.ai_recommendations",
    "apps.community",
    "apps.analytics",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # must stay high for CORS headers
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# PostgreSQL 15+ per spec; actual credentials come from DATABASE_URL (.env)
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://welltrip:welltrip@127.0.0.1:5432/welltrip",
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Custom User model lives in apps.authentication (per spec Folder Tree §3)
AUTH_USER_MODEL = "authentication.User"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Uploaded media (payment slip images). Local filesystem during development;
# production should move MEDIA_ROOT to object storage (S3/R2) behind django-storages.
# Leading "/" is required: DRF FileField.build_absolute_uri() would otherwise
# join the relative "media/..." onto the current request path (e.g. an API
# route) and produce a broken URL.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    # Standardized error envelope from spec §8.2
    "EXCEPTION_HANDLER": "common.exceptions.standardized_exception_handler",
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

# ---------------------------------------------------------------------------
# SimpleJWT - stateless access + rotating refresh token
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=env.int("JWT_ACCESS_TOKEN_LIFETIME_MINUTES")
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=env.int("JWT_REFRESH_TOKEN_LIFETIME_DAYS")
    ),
    "ROTATE_REFRESH_TOKENS": True,      # every /refresh/ issues a NEW refresh token
    "BLACKLIST_AFTER_ROTATION": True,   # the old refresh token dies immediately
    "AUTH_HEADER_TYPES": ("Bearer",),
    "UPDATE_LAST_LOGIN": True,
}

# ---------------------------------------------------------------------------
# Google OAuth (spec §4 / task #4)
# ---------------------------------------------------------------------------
# Comma-separated list of accepted audience client IDs from .env
GOOGLE_OAUTH_CLIENT_IDS = env.list("GOOGLE_OAUTH_CLIENT_IDS")

# ---------------------------------------------------------------------------
# Celery - async task queue (Step 4: 15-min booking expiry worker)
# ---------------------------------------------------------------------------
# Local dev default expects a Redis on localhost. Production MUST provide a
# real broker URL via .env; never rely on this default there.
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://127.0.0.1:6379/0")
# Keep task timing on the same clock as Django models (expires_at is UTC-aware).
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)
# "fail-fast" policy: when the broker is unreachable a scheduled task raises and
# the CALLING transaction rolls back, so an unpaid booking can never exist
# without its expiry task (inventory would leak). See bookings/services.py.
CELERY_TASK_EAGER_PROPAGATES = True

# ---------------------------------------------------------------------------
# CORS - allow the Next.js frontend during development
# ---------------------------------------------------------------------------
from corsheaders.defaults import default_headers

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    "idempotency-key",
    "Idempotency-Key",
]


# ---------------------------------------------------------------------------
# Payee Account & Slip Check Provider Config (.env driven - NO hardcoding)
# ---------------------------------------------------------------------------
PAYEE_ACCOUNT_NUMBER = env("PAYEE_ACCOUNT_NUMBER", default="001-1-50448-5")
PAYEE_ACCOUNT_NAME = env("PAYEE_ACCOUNT_NAME", default="นาย พรหมลิขิต อุรา")
PAYEE_BANK_NAME = env("PAYEE_BANK_NAME", default="ธนาคารกสิกรไทย")

SLIP_PROVIDER_URL = env("SLIP_PROVIDER_URL", default="https://developer.easyslip.com/api/v1/verify")
SLIP_PROVIDER_API_KEY = env("SLIP_PROVIDER_API_KEY", default="")
EASYSLIP_MOCK_VERIFY = env.bool("EASYSLIP_MOCK_VERIFY", default=True)

# Dual-AI Architecture Keys (DeepSeek Reasoning + Gemini JSON Matching)
DEEPSEEK_API_KEY = env("DEEPSEEK_API_KEY", default="")
GEMINI_API_KEY = env("GEMINI_API_KEY", default="")

# ---------------------------------------------------------------------------
# Email Configuration
# ---------------------------------------------------------------------------
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="promlikit@sskru.ac.th")
ADMIN_EMAIL = env("ADMIN_EMAIL", default="promlikit@sskru.ac.th")






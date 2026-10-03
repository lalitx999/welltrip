"""
Production settings (R0 - deployed & run ONLY by the human owner).

Production must set DJANGO_SETTINGS_MODULE=core.settings.production and
provide real environment variables. This file only adds deployment
hardening; nothing here is allowed to weaken security.
"""
from .base import *  # noqa: F401,F403

DEBUG = False

# Assume HTTPS termination happens at the reverse proxy / load balancer.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Browser-side security cookies.
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Strict transport security for one year.
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Static assets served by WhiteNoise (see requirements/production.txt)
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

"""ASGI config for the WellTrip backend (used by Uvicorn/Daphne later)."""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.local")

application = get_asgi_application()

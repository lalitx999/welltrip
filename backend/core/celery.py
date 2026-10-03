"""
Celery application for WellTrip backend (Step 4).

Standard setup: `core/celery.py` + autodiscover, with broker/timezone pulled
from Django settings (django.conf). The task module that matters today is
apps.bookings.tasks (15-min payment expiry worker).

Run the worker with:
    celery -A core worker -l info

WHY no result backend: Phase 1 does not need task results, only fire-and-forget
expiry scheduling. Adding one later is a settings-only change.
"""
import os

from celery import Celery

# Make sure the worker uses THIS project's settings module by default.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.local")

app = Celery("welltrip")

# Read everything prefixed CELERY_* from Django settings (e.g. CELERY_BROKER_URL,
# CELERY_TIMEZONE) instead of hard-coding broker here.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py inside each app (apps.bookings.tasks is the first one).
app.autodiscover_tasks()

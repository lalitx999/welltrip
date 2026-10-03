# Make Celery's app instance available when Django is imported, so that
# `celery -A core` finds the app AND so @shared_task in app modules can
# resolve it. Importing at the bottom of __init__ avoids circular imports
# (core.celery imports django settings, not core itself).
from .celery import app as celery_app

__all__ = ("celery_app",)


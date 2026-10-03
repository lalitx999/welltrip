"""Django app config for apps.accommodations (Homestay listings + rooms)."""
from django.apps import AppConfig


class AccommodationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accommodations"
    verbose_name = "Accommodations & Rooms"

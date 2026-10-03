"""Django app config for apps.otop (local OTOP products)."""
from django.apps import AppConfig


class OtopConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.otop"
    verbose_name = "OTOP Products"

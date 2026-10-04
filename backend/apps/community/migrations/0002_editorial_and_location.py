import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("community", "0001_initial"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(name="EditorialEntry", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("kind", models.CharField(max_length=16, choices=[("STORY", "News / event"), ("COMMUNITY", "Community"), ("ATTRACTION", "Attraction")])),
            ("title", models.CharField(max_length=200)), ("title_en", models.CharField(max_length=200, blank=True)),
            ("summary", models.TextField(blank=True)), ("summary_en", models.TextField(blank=True)),
            ("body", models.TextField(blank=True)), ("body_en", models.TextField(blank=True)),
            ("image_url", models.URLField(max_length=1000, blank=True)), ("image_alt", models.CharField(max_length=200, blank=True)),
            ("location", models.CharField(max_length=200, blank=True)),
            ("starts_at", models.DateTimeField(null=True, blank=True)), ("ends_at", models.DateTimeField(null=True, blank=True)),
            ("is_published", models.BooleanField(default=False)), ("updated_at", models.DateTimeField(auto_now=True)),
        ], options={"ordering": ("-updated_at",)}),
        migrations.CreateModel(name="LocationEvent", fields=[
            ("id", models.BigAutoField(primary_key=True, serialize=False)),
            ("outcome", models.CharField(max_length=16, choices=[("granted", "Granted"), ("denied", "Denied"), ("unavailable", "Unavailable"), ("timeout", "Timeout")])),
            ("latitude", models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)),
            ("longitude", models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)),
            ("accuracy_m", models.PositiveIntegerField(null=True, blank=True)),
            ("consent_version", models.CharField(max_length=40)), ("purpose", models.CharField(max_length=40, default="location_log")),
            ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)), ("expires_at", models.DateTimeField(db_index=True)),
            ("user", models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=django.db.models.deletion.CASCADE, related_name="location_events")),
        ], options={"ordering": ("-created_at",)}),
    ]

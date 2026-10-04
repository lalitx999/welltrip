from celery import shared_task
from django.utils import timezone
from .models import LocationEvent


@shared_task
def purge_expired_location_events():
    deleted, _ = LocationEvent.objects.filter(expires_at__lte=timezone.now()).delete()
    return deleted

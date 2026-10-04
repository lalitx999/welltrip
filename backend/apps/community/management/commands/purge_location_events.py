from django.core.management.base import BaseCommand
from apps.community.tasks import purge_expired_location_events


class Command(BaseCommand):
    help = "Permanently purge expired optional location logs."

    def handle(self, *args, **options):
        self.stdout.write(str(purge_expired_location_events()))

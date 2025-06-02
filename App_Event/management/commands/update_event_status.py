from django.core.management.base import BaseCommand
from App_Event.models import Event
from django.utils import timezone

class Command(BaseCommand):
    help = 'Update status of events that have passed'

    def handle(self, *args, **options):
        now = timezone.now()
        events_to_update = Event.objects.filter(date_time__lt=now).exclude(status='completed')
        count = events_to_update.update(status='completed')
        self.stdout.write(self.style.SUCCESS(f'{count} event(s) marked as completed.'))
# content/management/commands/archive_past_reservations.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from content.models import Reservation, ReservationHistory


class Command(BaseCommand):
    help = "Archive les réservations dont l'événement est passé."

    def handle(self, *args, **options):
        past = Reservation.objects.filter(
            event__starts_at__lt=timezone.now(),
            history_entry__isnull=True,
        )
        created = 0
        for r in past:
            ReservationHistory.objects.create(reservation=r, is_counted=False)
            created += 1
        self.stdout.write(self.style.SUCCESS(f'{created} réservation(s) archivée(s).'))
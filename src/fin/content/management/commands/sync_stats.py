# stats/management/commands/sync_stats.py
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from stats.mixpanel_service import fetch_event_counts
from stats.models import SiteStatsSnapshot

# metric_key (ce qu'on affiche côté dash) -> nom EXACT de l'event dans Mixpanel.
# À ADAPTER : ces deux noms ("Page View", "Event Registered") sont des
# exemples — remplace-les par les noms réels que tu suis dans ton projet
# Mixpanel (visibles dans Mixpanel > Events).
TRACKED_METRICS = {
    'pageviews_7d': 'Page View',
    'event_registrations_7d': 'Event Registered',
}


class Command(BaseCommand):
    help = "Rafraîchit le cache local des statistiques Mixpanel (SiteStatsSnapshot)."

    def handle(self, *args, **options):
        to_date = date.today()
        from_date = to_date - timedelta(days=7)

        for metric_key, mixpanel_event in TRACKED_METRICS.items():
            try:
                value = fetch_event_counts(
                    mixpanel_event, from_date.isoformat(), to_date.isoformat()
                )
            except Exception as exc:
                self.stderr.write(self.style.ERROR(
                    f"Échec pour \"{mixpanel_event}\" : {exc}"
                ))
                continue

            SiteStatsSnapshot.objects.update_or_create(
                metric_key=metric_key, defaults={'value': value}
            )
            self.stdout.write(self.style.SUCCESS(f"{metric_key} mis à jour."))
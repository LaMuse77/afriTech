# stats/management/commands/sync_stats.py
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from stats.mixpanel_service import fetch_many_event_counts
from stats.models import SiteStatsSnapshot

# metric_key (ce qu'on affiche côté dash) -> nom EXACT de l'event dans Mixpanel.
# Ces noms doivent rester identiques à ceux envoyés par le front
# (web/assets/js/trackingApp.js pour la landing, dashboard.html pour le dash).
TRACKED_METRICS = {
    'pageviews_7d': 'Page View',
    'video_clicks_7d': 'Video Click',
    'youtube_cta_clicks_7d': 'YouTube CTA Click',
    'reserve_clicks_7d': 'Reserve Click',
    'event_registrations_7d': 'Event Registered',
    'newsletter_signups_7d': 'Newsletter Signup',
}


class Command(BaseCommand):
    help = "Rafraîchit le cache local des statistiques Mixpanel (SiteStatsSnapshot)."

    def handle(self, *args, **options):
        to_date = date.today()
        from_date = to_date - timedelta(days=7)

        try:
            counts = fetch_many_event_counts(
                TRACKED_METRICS.values(), from_date.isoformat(), to_date.isoformat()
            )
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Échec de l'export Mixpanel : {exc}"))
            return

        for metric_key, mixpanel_event in TRACKED_METRICS.items():
            SiteStatsSnapshot.objects.update_or_create(
                metric_key=metric_key, defaults={'value': counts[mixpanel_event]}
            )
            self.stdout.write(self.style.SUCCESS(
                f"{metric_key} mis à jour ({counts[mixpanel_event]})."
            ))

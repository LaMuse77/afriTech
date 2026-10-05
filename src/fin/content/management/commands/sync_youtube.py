from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime
from content.models import Video
from content.services import fetch_channel_statistics, fetch_channel_uploads
from stats.models import SiteStatsSnapshot


class Command(BaseCommand):
    help = (
        'Synchronise les vidéos de la chaîne YouTube AFI vers la base locale, '
        'puis met à jour les statistiques de la chaîne (abonnés, vues, likes...) '
        'affichées sur la landing et dans le dashboard.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--stats-only',
            action='store_true',
            help="Ne met à jour que les statistiques de la chaîne (pas les vidéos).",
        )

    def handle(self, *args, **options):
        recent_stats = None
        if not options['stats_only']:
            recent_stats = self.sync_videos()
        self.sync_channel_stats(recent_stats)

    def sync_videos(self):
        videos_data = fetch_channel_uploads(max_results=20)
        created, updated = 0, 0
        totals = {'views': 0, 'likes': 0, 'comments': 0}

        for data in videos_data:
            obj, is_created = Video.objects.update_or_create(
                youtube_id=data['youtube_id'],
                defaults={
                    'title': data['title'],
                    'description': data['description'],
                    'thumbnail_url': data['thumbnail_url'],
                    'published_at': parse_datetime(data['published_at']),
                    'duration': data['duration'],
                }
            )
            created += is_created
            updated += not is_created
            for key in totals:
                totals[key] += data['stats'][key]

        self.stdout.write(self.style.SUCCESS(
            f'Sync terminée : {created} créées, {updated} mises à jour.'
        ))
        return totals

    def sync_channel_stats(self, recent_stats):
        # Un échec ici (quota, réseau) ne doit pas annuler la sync des vidéos.
        try:
            channel = fetch_channel_statistics()
        except Exception as exc:
            self.stderr.write(self.style.ERROR(
                f'Statistiques de la chaîne indisponibles : {exc}'
            ))
            return

        metrics = {
            'youtube_total_views': channel['views'],
            'youtube_video_count': channel['videos'],
        }
        if channel['subscribers'] is not None:
            metrics['youtube_subscribers'] = channel['subscribers']
        if recent_stats is not None:
            metrics['youtube_recent_likes'] = recent_stats['likes']
            metrics['youtube_recent_comments'] = recent_stats['comments']

        for metric_key, value in metrics.items():
            SiteStatsSnapshot.objects.update_or_create(
                metric_key=metric_key, defaults={'value': value}
            )

        self.stdout.write(self.style.SUCCESS(
            f"Stats chaîne mises à jour : {channel['subscribers'] or 'masqués'} abonnés, "
            f"{channel['views']} vues, {channel['videos']} vidéos."
        ))

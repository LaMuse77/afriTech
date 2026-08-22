from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime
from content.models import Video
from content.services import fetch_channel_uploads


class Command(BaseCommand):
    help = 'Synchronise les vidéos de la chaîne YouTube AFI vers la base locale'

    def handle(self, *args, **options):
        videos_data = fetch_channel_uploads(max_results=20)
        created, updated = 0, 0

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

        self.stdout.write(self.style.SUCCESS(
            f'Sync terminée : {created} créées, {updated} mises à jour.'
        ))
from django.conf import settings
from googleapiclient.discovery import build
import isodate  # pip install isodate — pour parser les durées ISO 8601


def get_youtube_client():
    return build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)


def fetch_channel_uploads(max_results=12):
    """
    Récupère les dernières vidéos de la chaîne via sa playlist 'uploads'.
    Coût: ~2 unités de quota au lieu de 100 pour search.list
    """
    youtube = get_youtube_client()

    # 1. Récupérer l'ID de la playlist "uploads" de la chaîne
    channel_response = youtube.channels().list(
        part='contentDetails',
        id=settings.YOUTUBE_CHANNEL_ID
    ).execute()

    uploads_playlist_id = (
        channel_response['items'][0]['contentDetails']
        ['relatedPlaylists']['uploads']
    )

    # 2. Récupérer les vidéos de cette playlist
    playlist_response = youtube.playlistItems().list(
        part='snippet,contentDetails',
        playlistId=uploads_playlist_id,
        maxResults=max_results
    ).execute()

    video_ids = [item['contentDetails']['videoId'] for item in playlist_response['items']]

    # 3. Récupérer les détails (durée notamment) en un seul appel batché
    videos_response = youtube.videos().list(
        part='contentDetails,snippet',
        id=','.join(video_ids)
    ).execute()

    results = []
    for item in videos_response['items']:
        snippet = item['snippet']
        duration_iso = item['contentDetails']['duration']
        duration_seconds = int(isodate.parse_duration(duration_iso).total_seconds())
        minutes, seconds = divmod(duration_seconds, 60)

        # On prend la meilleure résolution réellement disponible, de la plus
        # grande à la plus petite, pour éviter les miniatures manquantes ou
        # génériques (qui donnent l'impression de vignettes répétées).
        thumbnails = snippet.get('thumbnails', {})
        thumbnail = next(
            (thumbnails[key] for key in ('maxres', 'standard', 'high', 'medium', 'default')
             if key in thumbnails),
            None,
        )

        results.append({
            'youtube_id': item['id'],
            'title': snippet['title'],
            'description': snippet['description'],
            'thumbnail_url': thumbnail['url'] if thumbnail else '',
            'published_at': snippet['publishedAt'],
            'duration': f"{minutes:02d}:{seconds:02d}",
        })

    return results
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from .models import SiteStatsSnapshot
from .serializers import SiteStatsSnapshotSerializer


class SiteStatsView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = SiteStatsSnapshotSerializer

    def get(self, request, *args, **kwargs):
        snapshots = SiteStatsSnapshot.objects.all()

        serializer = self.get_serializer(snapshots, many=True)

        return Response(serializer.data)


class PublicYoutubeStatsView(generics.GenericAPIView):
    """Stats publiques de la chaîne YouTube (ex: nombre d'abonnés affiché sur
    la landing). N'expose que les métriques youtube_*, alimentées par
    `manage.py sync_youtube` — jamais les stats internes Mixpanel."""

    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = SiteStatsSnapshotSerializer

    def get(self, request, *args, **kwargs):
        snapshots = SiteStatsSnapshot.objects.filter(metric_key__startswith='youtube_')
        return Response({s.metric_key: s.value for s in snapshots})

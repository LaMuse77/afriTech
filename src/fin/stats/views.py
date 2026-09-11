from rest_framework import generics
from rest_framework.permissions import IsAdminUser
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
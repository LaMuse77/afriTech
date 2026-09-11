"""Serializers for the statistics API."""

from rest_framework import serializers

from .models import SiteStatsSnapshot


class SiteStatsSnapshotSerializer(serializers.ModelSerializer):
    """Serialize a cached statistics snapshot."""

    class Meta:
        model = SiteStatsSnapshot
        fields = [
            "id",
            "metric_key",
            "value",
            "fetched_at",
        ]
        read_only_fields = [
            "id",
            "fetched_at",
        ]
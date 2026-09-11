from django.db import models

# Create your models here.
# stats/models.py
class SiteStatsSnapshot(models.Model):
    """Cache local d'un résultat Mixpanel, rafraîchi périodiquement."""
    metric_key = models.CharField(max_length=100, unique=True)  # ex: 'pageviews_7d'
    value = models.JSONField()
    fetched_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.metric_key} @ {self.fetched_at:%Y-%m-%d %H:%M}'
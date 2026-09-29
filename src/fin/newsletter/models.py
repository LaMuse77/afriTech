from django.db import models


class Subscriber(models.Model):
    """Un abonné à la newsletter AFI Weekly, collecté depuis la landing page."""

    email = models.EmailField(unique=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Décoché = désabonné (ne reçoit plus les envois).",
    )
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = 'Abonné newsletter'
        verbose_name_plural = 'Abonnés newsletter'

    def __str__(self):
        return self.email

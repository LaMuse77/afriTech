from django.conf import settings
from django.db import models


class Video(models.Model):
    class Category(models.TextChoices):
        SPOTLIGHT = 'spotlight', 'CEO & Leaders Spotlight'
        STRATEGIC = 'strategic', 'Strategic Talk'
        DECODING = 'decoding', 'Market & Strategy Decoding'
        LEARNING = 'learning', 'AFI Learning'

    youtube_id = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    thumbnail_url = models.URLField()
    published_at = models.DateTimeField()
    duration = models.CharField(max_length=20, blank=True)  # format "12:45"
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.STRATEGIC)
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.title

    @property
    def watch_url(self):
        return f"https://www.youtube.com/watch?v={self.youtube_id}"


class Event(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Réserver'
        REGISTERED = 'registered', 'Inscrit'
        EARLY_BIRD = 'early_bird', 'Early Bird'

    title = models.CharField(max_length=200)
    badge = models.CharField(max_length=50, blank=True)  # ex: "Networking", "Annuel"
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    starts_at = models.DateTimeField()
    # Lien (visio, billetterie, page dédiée) envoyé par email au moment de la réservation.
    join_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['starts_at']

    def __str__(self):
        return self.title

    @property
    def status_label(self):
        return self.get_status_display()


class Reservation(models.Model):
    """Réservation d'une place à un événement par un visiteur du site."""

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    # Rattaché au compte si la réservation est faite par un membre connecté ;
    # sinon null (réservation anonyme depuis la landing).
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='reservations',
        null=True,
        blank=True,
    )
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    email_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        # Une même adresse ne réserve qu'une fois par événement.
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'email'],
                name='unique_reservation_per_event',
            )
        ]

    def __str__(self):
        return f'{self.full_name} → {self.event.title}'
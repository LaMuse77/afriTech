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



class Communaute(models.Model): # here we think like suscribe 


    user_uuid = models.CharField(max_length=255, unique=True)
    sus_Start_time = models.DateTimeField(auto_now_add=True)
    sus_End_time = models.DateTimeField(auto_now=True)
    status = models.BooleanField(default=True)

    class Meta:
        ordering = ['-sus_Start_time']
        constraints = [
            models.UniqueConstraint(
                fields=['user_uuid'],
                name='unique_user_uuid',
            )
        ]

    def __str__(self):
        return f'{self.user_uuid} → {self.status}'


class ReservationHistory(models.Model):
    """Archive les réservations dont l'événement est passé.
    Ces entrées ne comptent plus dans les stats actives (adhésion
    communauté, compteurs en cours) — uniquement pour la traçabilité.
    """
    reservation = models.OneToOneField(
        Reservation, on_delete=models.CASCADE, related_name='history_entry'
    )
    archived_at = models.DateTimeField(auto_now_add=True)
    is_counted = models.BooleanField(default=False)

    class Meta:
        ordering = ['-archived_at']

    def __str__(self):
        return f'{self.reservation} (archivé, non comptabilisé)'



# (settings et models sont déjà importés en haut du fichier)

class ContentCompletion(models.Model):
    """Marque qu'un membre a 'terminé' (cliqué Regarder) un contenu.

    Une seule ligne par (user, video) grâce à la contrainte d'unicité :
    reregarder la même vidéo ne fait pas repartir le compteur.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='content_completions',
    )
    video = models.ForeignKey(
        Video,
        on_delete=models.CASCADE,
        related_name='completions',
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'video'],
                name='unique_completion_per_user_video',
            )
        ]

    def __str__(self):
        return f'{self.user} → {self.video}'
from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class MemberProfile(models.Model):
    """Profil et statistiques d'un membre, lié 1-1 à un utilisateur Django."""

    class Tier(models.TextChoices):
        FREE = 'free', 'Membre Free'
        PREMIUM = 'premium', 'Membre Premium'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    tier = models.CharField(max_length=10, choices=Tier.choices, default=Tier.FREE)

    # Statistiques affichées sur le dashboard
    completed_contents = models.PositiveIntegerField(default=0)
    training_hours = models.PositiveIntegerField(default=0)
    events_attended = models.PositiveIntegerField(default=0)
    community_points = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'Profil de {self.user.get_username()}'


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_member_profile(sender, instance, created, **kwargs):
    """Crée automatiquement un profil à la création d'un utilisateur."""
    if created:
        MemberProfile.objects.create(user=instance)

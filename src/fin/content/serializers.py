# serializers.py
import hashlib

from django.utils import timezone
from rest_framework import serializers

from .models import Video, Event, Reservation, Communaute


class VideoSerializer(serializers.ModelSerializer):
    watch_url = serializers.ReadOnlyField()

    class Meta:
        model = Video
        fields = [
            'youtube_id', 'title', 'description', 'thumbnail_url',
            'published_at', 'duration', 'category', 'is_featured',
            'watch_url',
        ]


class EventSerializer(serializers.ModelSerializer):
    status_label = serializers.ReadOnlyField()

    class Meta:
        model = Event
        # join_url n'est jamais exposé publiquement : il n'arrive que par email.
        fields = [
            'id', 'title', 'badge', 'description', 'location',
            'starts_at', 'status', 'status_label',
        ]


class ReservationSerializer(serializers.ModelSerializer):
    """Création d'une réservation depuis la landing (accès public).

    Fusion de deux versions qui existaient en double dans le fichier
    d'origine (la seconde écrasait silencieusement la première) :
    validation (event ouvert, pas déjà passé, pas de doublon email)
    + activation automatique de l'adhésion Communauté à la création.
    """

    class Meta:
        model = Reservation
        fields = ['id', 'event', 'full_name', 'email', 'created_at']
        read_only_fields = ['id', 'created_at']
        # On désactive le UniqueTogetherValidator auto (message anglais) au
        # profit du contrôle personnalisé dans validate() (message FR ciblé).
        validators = []

    def validate_event(self, event):
        if event.starts_at < timezone.now():
            raise serializers.ValidationError('Cet événement est déjà passé.')
        if event.status != Event.Status.OPEN:
            raise serializers.ValidationError(
                "Les réservations pour cet événement ne sont pas ouvertes."
            )
        return event

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        attrs['email'] = email
        attrs['full_name'] = attrs.get('full_name', '').strip()
        if Reservation.objects.filter(event=attrs['event'], email=email).exists():
            raise serializers.ValidationError(
                {'email': 'Vous avez déjà réservé une place pour cet événement.'}
            )
        return attrs

    def create(self, validated_data):
        reservation = super().create(validated_data)
        self._activate_communaute_membership(reservation)
        return reservation

    def _activate_communaute_membership(self, reservation):
        """Réserver un événement rend automatiquement membre de la communauté."""
        if reservation.user_id:
            identifier = f"user:{reservation.user_id}"
        else:
            identifier = f"email:{hashlib.sha256(reservation.email.encode()).hexdigest()}"

        Communaute.objects.update_or_create(
            user_uuid=identifier,
            defaults={'status': True},
        )


class AdminEventSerializer(serializers.ModelSerializer):
    """Vue admin : tous les champs, dont join_url, + nombre d'inscrits."""

    status_label = serializers.ReadOnlyField()
    reservation_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'badge', 'description', 'location',
            'starts_at', 'join_url', 'status', 'status_label',
            'order', 'reservation_count',
        ]


class AdminReservationSerializer(serializers.ModelSerializer):
    """Vue admin : détail d'un inscrit, avec le titre de l'événement."""

    event_title = serializers.CharField(source='event.title', read_only=True)
    username = serializers.CharField(
        source='user.username', read_only=True, default=None
    )

    class Meta:
        model = Reservation
        fields = [
            'id', 'event', 'event_title', 'full_name', 'email',
            'username', 'email_sent', 'created_at',
        ]


class CommunauteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Communaute
        # user_uuid n'est jamais exposé : identifiant interne, pas une
        # donnée à renvoyer au client.
        fields = ['status', 'sus_Start_time', 'sus_End_time']
        read_only_fields = fields
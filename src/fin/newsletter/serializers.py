from rest_framework import serializers

from .models import Subscriber


class SubscriberListSerializer(serializers.ModelSerializer):
    """Lecture seule : affichage des abonnés dans le dashboard admin."""

    class Meta:
        model = Subscriber
        fields = ['id', 'email', 'is_active', 'subscribed_at']


class SubscriberSerializer(serializers.ModelSerializer):
    """Validation et création d'un abonné newsletter."""

    # On retire le validateur d'unicité : un email déjà inscrit ne doit pas
    # déclencher une erreur, mais être réactivé silencieusement (voir create()).
    email = serializers.EmailField(validators=[])

    class Meta:
        model = Subscriber
        fields = ['email']

    def validate_email(self, value):
        return value.strip().lower()

    def create(self, validated_data):
        # Si l'email existe déjà, on le réactive au lieu de planter.
        subscriber, _ = Subscriber.objects.get_or_create(
            email=validated_data['email'],
            defaults={'is_active': True},
        )
        if not subscriber.is_active:
            subscriber.is_active = True
            subscriber.save(update_fields=['is_active'])
        return subscriber

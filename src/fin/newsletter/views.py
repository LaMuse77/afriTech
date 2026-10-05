from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from .models import Subscriber
from .serializers import SubscriberListSerializer, SubscriberSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def subscribe_view(request):
    """Enregistre un email envoyé depuis le formulaire newsletter de la landing."""
    serializer = SubscriberSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Déjà abonné et actif : pas d'erreur, mais on le signale au front
    # (notification différente sur la landing).
    already_subscribed = Subscriber.objects.filter(
        email=serializer.validated_data['email'], is_active=True,
    ).exists()
    serializer.save()

    if already_subscribed:
        return Response(
            {
                'detail': 'Vous êtes déjà inscrit(e) à AFI Weekly.',
                'already_subscribed': True,
            },
            status=status.HTTP_200_OK,
        )
    return Response(
        {
            'detail': 'Merci ! Votre inscription à AFI Weekly est confirmée.',
            'already_subscribed': False,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def subscribers_list_view(request):
    """Liste des abonnés newsletter (réservé aux admins/staff)."""
    subscribers = Subscriber.objects.all()
    data = SubscriberListSerializer(subscribers, many=True).data
    return Response({
        'count': subscribers.count(),
        'active_count': subscribers.filter(is_active=True).count(),
        'results': data,
    })

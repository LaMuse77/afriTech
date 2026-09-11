# views.py
import hashlib

from django.db.models import F, Count
from django.utils import timezone
from rest_framework import viewsets, filters, generics, status, permissions
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import MemberProfile
from .emails import send_reservation_email
from .models import Video, Event, Reservation, Communaute
from .serializers import (
    VideoSerializer,
    EventSerializer,
    ReservationSerializer,
    AdminEventSerializer,
    AdminReservationSerializer,
    CommunauteSerializer,
)


class VideoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['published_at', 'order']

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        featured = self.request.query_params.get('featured')
        if category:
            qs = qs.filter(category=category)
        if featured == 'true':
            qs = qs.filter(is_featured=True)
        return qs


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventSerializer

    def get_queryset(self):
        qs = Event.objects.all()
        # Par défaut : seulement les événements à venir.
        if self.request.query_params.get('all') != 'true':
            qs = qs.filter(starts_at__gte=timezone.now())
        return qs


class ReservationCreateView(generics.CreateAPIView):
    """POST public : réserve une place et envoie le lien par email."""

    serializer_class = ReservationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Rattache la réservation au membre s'il est connecté et met à jour
        # sa statistique d'événements suivis.
        user = request.user if request.user.is_authenticated else None
        reservation = serializer.save(user=user)
        if user is not None:
            MemberProfile.objects.filter(user=user).update(
                events_attended=F('events_attended') + 1
            )

        sent = send_reservation_email(reservation)
        if sent:
            reservation.email_sent = True
            reservation.save(update_fields=['email_sent'])

        return Response(
            {
                'detail': (
                    'Réservation confirmée. Un email contenant le lien vient '
                    'de vous être envoyé.'
                    if sent else
                    'Réservation confirmée. L\'email de confirmation suivra sous peu.'
                ),
                'reservation': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminEventViewSet(viewsets.ModelViewSet):
    """CRUD complet des événements + nombre d'inscrits (réservé aux admins)."""

    serializer_class = AdminEventSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return (
            Event.objects.all()
            .annotate(reservation_count=Count('reservations'))
            .order_by('-starts_at')
        )


class AdminReservationViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste des inscrits (réservé aux admins), filtrable par événement."""

    serializer_class = AdminReservationSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'email', 'event__title']

    def get_queryset(self):
        qs = Reservation.objects.select_related('event', 'user')
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs


def _community_identifier_candidates(user):
    """Identifiants possibles dans Communaute pour cet utilisateur.

    Un membre est rattaché soit par son compte (réservation faite en
    étant connecté → 'user:<id>'), soit par son email (réservation faite
    anonymement depuis la landing → 'email:<sha256>').
    """
    candidates = [f"user:{user.id}"]
    if user.email:
        email_hash = hashlib.sha256(user.email.strip().lower().encode()).hexdigest()
        candidates.append(f"email:{email_hash}")
    return candidates


class CommunityMeView(APIView):
    """GET /api/community/me/

    Protection : IsAuthenticated. On ne renvoie que le statut du user
    courant — jamais user_uuid, jamais les données d'un autre membre.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identifiers = _community_identifier_candidates(request.user)
        membership = (
            Communaute.objects
            .filter(user_uuid__in=identifiers, status=True)
            .order_by('-sus_Start_time')
            .first()
        )

        if not membership:
            return Response({'is_member': False})

        data = CommunauteSerializer(membership).data
        data['is_member'] = True
        return Response(data)


class CommunityStatsView(APIView):
    """GET /api/community/stats/

    Protection : IsAuthenticated (réservé aux membres connectés du
    dashboard). Ne renvoie qu'un agrégat, jamais de données individuelles.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_members = Communaute.objects.filter(status=True).count()
        return Response({'total_members': total_members})
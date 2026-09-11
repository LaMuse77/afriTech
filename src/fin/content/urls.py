# content/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    VideoViewSet,
    EventViewSet,
    ReservationCreateView,
    AdminEventViewSet,
    AdminReservationViewSet,
    CommunityMeView,       # à ajouter dans content/views.py (cf. community_views.py donné plus tôt)
    CommunityStatsView,    # idem
)

router = DefaultRouter()
router.register('content', VideoViewSet, basename='video')
router.register('events', EventViewSet, basename='event')
router.register('admin/events', AdminEventViewSet, basename='admin-event')
router.register('admin/reservations', AdminReservationViewSet, basename='admin-reservation')

urlpatterns = router.urls + [
    path('reservations/', ReservationCreateView.as_view(), name='reservation-create'),
    path('community/me/', CommunityMeView.as_view(), name='community-me'),
    path('community/stats/', CommunityStatsView.as_view(), name='community-stats'),
]
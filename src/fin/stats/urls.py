from django.urls import path
from .views import PublicYoutubeStatsView, SiteStatsView

urlpatterns = [
    path('site-stats/', SiteStatsView.as_view(), name='site-stats'),
    path('youtube-stats/', PublicYoutubeStatsView.as_view(), name='youtube-stats'),
]

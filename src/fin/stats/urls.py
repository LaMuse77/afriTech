from django.urls import path
from .views import SiteStatsView

urlpatterns = [
    path('site-stats/', SiteStatsView.as_view(), name='site-stats'),
]

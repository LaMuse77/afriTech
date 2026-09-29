# newsletter/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('newsletter/subscribe/', views.subscribe_view, name='newsletter-subscribe'),
]

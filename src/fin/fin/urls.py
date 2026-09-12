"""
URL configuration for fin project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView




urlpatterns = [
    path(
        '',
        TemplateView.as_view(template_name='index.html'),
        name='landing'
    ),

    path(
        'login/',
        TemplateView.as_view(template_name='pages/login.html'),
        name='login'
    ),

    path(
        'register/',
        TemplateView.as_view(template_name='pages/register.html'),
        name='register'
    ),

    path(
        'dashboard/',
        TemplateView.as_view(template_name='pages/dashboard.html'),
        name='dashboard'
    ),

    path('admin/', admin.site.urls),

    path('api/', include('content.urls')),
    path('api/', include('accounts.urls')),
    path('api/', include('stats.urls')),

    path(
        'api/schema/',
        SpectacularAPIView.as_view(),
        name='schema'
    ),

    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui'
    ),
]
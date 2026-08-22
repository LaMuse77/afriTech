from django.contrib import admin

from .models import Video, Event, Reservation


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_featured', 'published_at', 'order')
    list_filter = ('category', 'is_featured')
    list_editable = ('category', 'is_featured', 'order')
    search_fields = ('title', 'description')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'badge', 'starts_at', 'location', 'status', 'order')
    list_filter = ('status', 'badge')
    list_editable = ('status', 'order')
    search_fields = ('title', 'location', 'description')
    fields = (
        'title', 'badge', 'description', 'location',
        'starts_at', 'join_url', 'status', 'order',
    )


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'event', 'user', 'email_sent', 'created_at')
    list_filter = ('email_sent', 'event')
    search_fields = ('full_name', 'email', 'event__title')
    readonly_fields = ('created_at',)
    autocomplete_fields = ()

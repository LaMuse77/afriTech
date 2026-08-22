from django.contrib import admin

from .models import MemberProfile


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'tier', 'completed_contents',
        'training_hours', 'events_attended', 'community_points',
    )
    list_filter = ('tier',)
    list_editable = (
        'tier', 'completed_contents',
        'training_hours', 'events_attended', 'community_points',
    )
    search_fields = ('user__username', 'user__email')

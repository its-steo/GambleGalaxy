from django.contrib import admin
from .models import UserStats, RecentActivity, TopWinner

@admin.register(UserStats)
class UserStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_bets', 'total_winnings', 'win_rate', 'active_bets', 'last_updated']
    list_filter = ['last_updated']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['last_updated']

@admin.register(RecentActivity)
class RecentActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'game_type', 'amount', 'status', 'timestamp']
    list_filter = ['activity_type', 'game_type', 'status', 'timestamp']
    search_fields = ['user__username', 'description']
    date_hierarchy = 'timestamp'

@admin.register(TopWinner)
class TopWinnerAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'game_type', 'multiplier', 'timestamp']
    list_filter = ['game_type']
    search_fields = ['user__username']
    date_hierarchy = 'timestamp'
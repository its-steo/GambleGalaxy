from django.contrib import admin
from .models import Bet, BetSelection, Match, BigGameImage

class BetSelectionInline(admin.TabularInline):
    model = BetSelection
    extra = 0
    readonly_fields = ['match', 'selected_option', 'is_correct']
    can_delete = False

@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'amount', 'total_odds', 'status', 'placed_at']
    list_filter = ['status']
    inlines = [BetSelectionInline]
    ordering = ['-placed_at']

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ['home_team', 'away_team', 'match_time', 'status', 'score_home', 'score_away', 'ht_score_home', 'ht_score_away', 'elapsed_minutes']
    list_filter = ['status']
    ordering = ['match_time']
    search_fields = ['home_team', 'away_team', 'api_match_id']

@admin.register(BigGameImage)
class BigGameImageAdmin(admin.ModelAdmin):
    list_display = ['title', 'match', 'upload_date', 'is_active']
    list_filter = ['is_active', 'upload_date']
    search_fields = ['title', 'match__home_team', 'match__away_team']
    ordering = ['-upload_date']
    fields = ['title', 'image', 'match', 'is_active']  # Fields shown in the edit form
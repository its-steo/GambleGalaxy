from django.contrib import admin
from .models import Bet, BetSelection, Match

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
    list_display = ['home_team', 'away_team', 'match_time', 'status', 'score_home', 'score_away']
    list_filter = ['status']
    ordering = ['match_time']

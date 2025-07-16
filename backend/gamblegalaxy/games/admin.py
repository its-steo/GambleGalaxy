from django.contrib import admin
from .models import AviatorRound, AviatorBet
from .models import SureOdd

@admin.register(AviatorRound)
class AviatorRoundAdmin(admin.ModelAdmin):
    list_display = ['id', 'start_time', 'crash_multiplier', 'is_active']

@admin.register(AviatorBet)
class AviatorBetAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'cash_out_multiplier', 'round']

@admin.register(SureOdd)
class SureOddAdmin(admin.ModelAdmin):
    list_display = ['user', 'odd', 'verified_by_admin', 'is_used', 'created_at']
    list_filter = ['verified_by_admin', 'is_used']


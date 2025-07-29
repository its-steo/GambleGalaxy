from django.contrib import admin
from .models import AviatorRound, AviatorBet
from .models import SureOdd, SureOddPurchase
from .models import CrashMultiplierSetting



@admin.register(AviatorBet)
class AviatorBetAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'cash_out_multiplier', 'round']

@admin.register(SureOdd)
class SureOddAdmin(admin.ModelAdmin):
    list_display = ['user', 'odd', 'verified_by_admin', 'is_used', 'created_at']
    list_filter = ['verified_by_admin', 'is_used']


@admin.register(SureOddPurchase)
class SureOddPurchaseAdmin(admin.ModelAdmin):
    list_display = ['user', 'odd_value', 'status_display', 'created_at']
    list_filter = ['is_active', 'used']

    @admin.display(description='Status')
    def status_display(self, obj):
        return obj.status()
    
@admin.register(CrashMultiplierSetting)
class CrashMultiplierSettingAdmin(admin.ModelAdmin):
    list_display = ('min_value', 'max_value', 'weight')




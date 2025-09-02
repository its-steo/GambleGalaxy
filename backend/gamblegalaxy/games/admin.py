from django.contrib import admin
from django.utils.html import format_html
from .models import AviatorRound, AviatorBet, PredictorPackage, PredictorPurchase, SureOdd, SureOddPurchase, CrashMultiplierSetting

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

@admin.register(PredictorPackage)
class PredictorPackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'predictions_per_day', 'validity_days', 'created_at', 'image_preview')
    search_fields = ('name',)
    list_filter = ('created_at',)
    fields = ['name', 'image', 'predictions_per_day', 'validity_days', 'price']  # Removed 'created_at'
    readonly_fields = ['created_at']  # Optional: Include as read-only for viewing

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.get_image_url())
        return "No Image"
    image_preview.short_description = "Image"

@admin.register(PredictorPurchase)
class PredictorPurchaseAdmin(admin.ModelAdmin):
    list_display = ('user', 'predictor_package', 'purchase_date', 'expiry_date', 'predictions_used_today')
    list_filter = ('purchase_date', 'expiry_date')
    search_fields = ('user__username', 'predictor_package__name')
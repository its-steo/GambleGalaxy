#from django.contrib import admin
#from django.contrib import admin
#from .models import Wallet, Transaction
#
#@admin.register(Wallet)
#class WalletAdmin(admin.ModelAdmin):
#    list_display = ('user', 'balance')
#
#@admin.register(Transaction)
#class TransactionAdmin(admin.ModelAdmin):
#    list_display = ('user', 'transaction_type', 'amount', 'timestamp')
#    list_filter = ('transaction_type',)
#    ordering = ('-timestamp',)

from django.contrib import admin
from .models import Wallet, Transaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_type', 'amount', 'account_details', 'description', 'timestamp')
    list_filter = ('transaction_type', 'description')  # Add description filter for pending/completed
    ordering = ('-timestamp',)
    actions = ['mark_as_completed', 'mark_as_failed']

    def mark_as_completed(self, request, queryset):
        for transaction in queryset.filter(transaction_type='withdraw', description='user withdrawal: pending'):
            transaction.description = 'user withdrawal: completed'
            transaction.save()
        self.message_user(request, "Selected withdrawals marked as completed.")

    def mark_as_failed(self, request, queryset):
        for transaction in queryset.filter(transaction_type='withdraw', description='user withdrawal: pending'):
            # Refund the amount to the wallet
            wallet = transaction.user.wallet
            wallet.deposit(transaction.amount)
            transaction.description = 'failed: Manually rejected by admin'
            transaction.save()
        self.message_user(request, "Selected withdrawals marked as failed and funds refunded.")
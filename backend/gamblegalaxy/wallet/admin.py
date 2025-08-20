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

#from django.contrib import admin
#from .models import Wallet, Transaction
#
#@admin.register(Wallet)
#class WalletAdmin(admin.ModelAdmin):
#    list_display = ('user', 'balance')
#
#@admin.register(Transaction)
#class TransactionAdmin(admin.ModelAdmin):
#    list_display = ('user', 'transaction_type', 'amount', 'account_details', 'description', 'timestamp')
#    list_filter = ('transaction_type', 'description')  # Add description filter for pending/completed
#    ordering = ('-timestamp',)
#    actions = ['mark_as_completed', 'mark_as_failed']
#
#    def mark_as_completed(self, request, queryset):
#        for transaction in queryset.filter(transaction_type='withdraw', description='pending'):
#            transaction.description = 'completed'
#            transaction.save()
#        self.message_user(request, "Selected withdrawals marked as completed.")
#
#    def mark_as_failed(self, request, queryset):
#        for transaction in queryset.filter(transaction_type='withdraw', description='pending'):
#            # Refund the amount to the wallet
#            wallet = transaction.user.wallet
#            wallet.deposit(transaction.amount)
#            transaction.description = 'failed: Manually rejected by admin'
#            transaction.save()
#        self.message_user(request, "Selected withdrawals marked as failed and funds refunded.")

from django.contrib import admin
from .models import Wallet, Transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger('wallet')

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_type', 'amount', 'account_details', 'description', 'timestamp')
    list_filter = ('transaction_type', 'description')
    ordering = ('-timestamp',)
    actions = ['mark_as_completed', 'mark_as_failed']

    def mark_as_completed(self, request, queryset):
        for transaction in queryset.filter(transaction_type='withdraw', description='pending'):
            transaction.description = 'completed'
            transaction.save()

            # Send confirmation email
            try:
                subject = "Withdrawal Confirmation"
                context = {
                    'user': transaction.user,
                    'amount': transaction.amount,
                    'transaction_id': transaction.payment_transaction_id,
                    'timestamp': transaction.timestamp,
                    'account_details': transaction.account_details,
                }
                html_message = render_to_string('emails/withdraw_confirmation.html', context)
                plain_message = strip_tags(html_message)
                send_mail(
                    subject,
                    plain_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [transaction.user.email],
                    html_message=html_message,
                    fail_silently=False,
                )
                logger.info(f"Withdrawal confirmation email sent to {transaction.user.email} for transaction {transaction.payment_transaction_id}")
            except Exception as e:
                logger.error(f"Failed to send withdrawal confirmation email for transaction {transaction.payment_transaction_id}: {str(e)}")

        self.message_user(request, "Selected withdrawals marked as completed.")

    def mark_as_failed(self, request, queryset):
        for transaction in queryset.filter(transaction_type='withdraw', description='pending'):
            # Refund the amount to the wallet
            wallet = transaction.user.wallet
            wallet.deposit(transaction.amount)
            transaction.description = 'failed: Manually rejected by admin'
            transaction.save()
        self.message_user(request, "Selected withdrawals marked as failed and funds refunded.")
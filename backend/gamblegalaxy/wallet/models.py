from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.username}'s Wallet"

    def deposit(self, amount):
        self.balance += amount
        self.save()

    def withdraw(self, amount):
        if self.balance >= amount:
            self.balance -= amount
            self.save()
            return True
        return False


class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        DEPOSIT = 'deposit', _('Deposit')
        WITHDRAW = 'withdraw', _('Withdraw')
        WINNING = 'winning', _('Winning')  # Bonus type for winnings
        BONUS = 'bonus', _('Bonus')
        PENALTY = 'penalty', _('Penalty')

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)  # Optional, for referencing source

    def __str__(self):
        return f"{self.get_transaction_type_display()} of {self.amount} by {self.user.username}"
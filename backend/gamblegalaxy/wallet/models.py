# from django.db import models
# from django.conf import settings
# from django.db.models import F
#
#class Wallet(models.Model):
#    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
#    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
#
#    def deposit(self, amount):
#        """Atomically increase wallet balance."""
#        self.balance = F('balance') + amount
#        self.save()
#        self.refresh_from_db()  # Ensure balance is updated
#        return True
#
#    def withdraw(self, amount):
#        """Atomically decrease wallet balance if sufficient funds."""
#        if self.balance >= amount:
#            self.balance = F('balance') - amount
#            self.save()
#            self.refresh_from_db()  # Ensure balance is updated
#            return True
#        return False
#
#    def __str__(self):
#        return f"{self.user.username}'s Wallet: {self.balance}"
#
#class Transaction(models.Model):
#    TRANSACTION_TYPES = (
#        ('deposit', 'Deposit'),
#        ('withdraw', 'Withdraw'),
#        ('winning', 'Winning'),
#        ('bonus', 'Bonus'),
#        ('penalty', 'Penalty'),
#    )
#
#    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
#    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
#    amount = models.DecimalField(max_digits=10, decimal_places=2)
#    timestamp = models.DateTimeField(auto_now_add=True)
#    description = models.CharField(max_length=255, blank=True)
#    payment_transaction_id = models.CharField(max_length=50, blank=True, unique=True, null=True)
#
#    def __str__(self):
#        return f"{self.user.username} - {self.transaction_type} - {self.amount} - {self.timestamp}"

# wallet/models.py
from django.db import models
from django.conf import settings
from django.db.models import F
import logging

logger = logging.getLogger('wallet')

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def deposit(self, amount):
        """Atomically increase wallet balance."""
        logger.info(f"Depositing {amount} to wallet for user {self.user.id}. Old balance: {self.balance}")
        self.balance = F('balance') + amount
        self.save()
        self.refresh_from_db()
        logger.info(f"New balance for user {self.user.id}: {self.balance}")
        return True

    def withdraw(self, amount):
        """Atomically decrease wallet balance if sufficient funds."""
        if self.balance >= amount:
            logger.info(f"Withdrawing {amount} from wallet for user {self.user.id}. Old balance: {self.balance}")
            self.balance = F('balance') - amount
            self.save()
            self.refresh_from_db()
            logger.info(f"New balance for user {self.user.id}: {self.balance}")
            return True
        logger.warning(f"Insufficient funds for user {self.user.id}. Attempted withdrawal: {amount}, Balance: {self.balance}")
        return False

    def __str__(self):
        return f"{self.user.username}'s Wallet: {self.balance}"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('deposit', 'Deposit'),
        ('withdraw', 'Withdraw'),
        ('winning', 'Winning'),
        ('bonus', 'Bonus'),
        ('penalty', 'Penalty'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True)
    payment_transaction_id = models.CharField(max_length=50, blank=True, unique=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.amount} - {self.timestamp}"
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import random
from django.conf import settings

class AviatorRound(models.Model):
    start_time = models.DateTimeField(default=timezone.now)
    crash_multiplier = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    ended_at = models.DateTimeField(null=True, blank=True)  # ⬅️ New field to mark when round ended
    delay_before_next = models.PositiveIntegerField(default=5)  # ⬅️ Delay in seconds before next round starts

    def save(self, *args, **kwargs):
        if not self.crash_multiplier:
            ranges = [
                (1.00, 2.00),
                (3.01, 10.00),
                (10.01, 30.00),
                (30.01, 1000.00)
            ]
            weights = [80, 12, 7, 1]
            selected_range = random.choices(ranges, weights=weights, k=1)[0]
            self.crash_multiplier = round(random.uniform(*selected_range), 2)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Round {self.id} - Crash at {self.crash_multiplier}x"

    def get_crash_color(self):
        if self.crash_multiplier < 2:
            return "red"
        elif 2 <= self.crash_multiplier < 5:
            return "yellow"
        elif 5 <= self.crash_multiplier < 11:
            return "green"
        elif 11 <= self.crash_multiplier < 20:
            return "blue"
        else:
            return "purple"

    def should_start_new_round(self):
        """
        Helper method to determine if new round should start after delay.
        """
        if self.ended_at:
            return (timezone.now() - self.ended_at).total_seconds() >= self.delay_before_next
        return False


class AviatorBet(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='aviator_bets')
    round = models.ForeignKey(AviatorRound, on_delete=models.CASCADE, related_name='bets')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    cash_out_multiplier = models.FloatField(null=True, blank=True)
    final_multiplier = models.FloatField(null=True, blank=True)
    time_placed = models.DateTimeField(default=timezone.now)
    is_winner = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    auto_cashout = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - Bet: {self.amount} on Round {self.round.id}"

    def is_win(self):
        if self.cash_out_multiplier is not None:
            return self.cash_out_multiplier < self.round.crash_multiplier
        return False

    def win_amount(self):
        if self.is_win():
            return round(float(self.amount) * self.cash_out_multiplier, 2)
        return 0.0

    @classmethod
    def top_winners_today(cls):
        today = timezone.now().date()
        return cls.objects.filter(
            created_at__date=today,
            is_winner=True
        ).order_by('-win_amount')[:10]


class SureOdd(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sure_odds')
    odd = models.DecimalField(max_digits=5, decimal_places=2)
    is_used = models.BooleanField(default=False)
    verified_by_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.odd} - Verified: {self.verified_by_admin}"


class TransactionLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transaction_logs')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.reason} - {self.amount}"
    
    # In games/models.py
class SureOddPurchase(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sure_odd_purchases')
    odd_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def status(self):
        if self.used:
            return "Used"
        if self.is_active:
            return "Active"
        return "Expired"

    def __str__(self):
        return f"{self.user.username} - {self.odd_value or 'Pending'}"


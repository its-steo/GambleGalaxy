from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import random

User = get_user_model()

class AviatorRound(models.Model):
    start_time = models.DateTimeField(default=timezone.now)
    crash_multiplier = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.crash_multiplier:
            self.crash_multiplier = round(random.uniform(1.00, 50.00), 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Round {self.id} - Crash at {self.crash_multiplier}x"

    def get_crash_color(self):
        if self.crash_multiplier < 2:
            return "red"       # 🔴 Very low
        elif 2 <= self.crash_multiplier < 5:
            return "yellow"    # 🟡 Moderate
        elif 5 <= self.crash_multiplier < 11:
            return "green"     # 🟢 High
        elif 11 <= self.crash_multiplier < 20:
            return "blue"      # 🔵 Very high
        else:
            return "purple"   # 🟣 Extremely high

User = get_user_model()

class AviatorBet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    round = models.ForeignKey(AviatorRound, on_delete=models.CASCADE, related_name='bets')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    cash_out_multiplier = models.FloatField(null=True, blank=True)  # None = did not cash out
    time_placed = models.DateTimeField(default=timezone.now)

    # ✅ ADD THESE FIELDS for leaderboard
    is_winner = models.BooleanField(default=False)  # must be set in your payout logic
    created_at = models.DateTimeField(auto_now_add=True)
    cashed_out_at = models.FloatField(null=True, blank=True)  # store final cashout multiplier

    def is_win(self):
        return self.cash_out_multiplier and self.cash_out_multiplier < self.round.crash_multiplier

    def win_amount(self):
        if self.is_win():
            return float(self.amount) * self.cash_out_multiplier
        return 0.0

    def __str__(self):
        return f"{self.user.username} - Bet: {self.amount} on Round {self.round.id}"

    @classmethod
    def top_winners_today(cls):
        today = timezone.now().date()
        return cls.objects.filter(
            created_at__date=today,
            is_winner=True
        ).order_by('-cashed_out_at')[:10]


class SureOdd(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    odd = models.DecimalField(max_digits=5, decimal_places=2)
    is_used = models.BooleanField(default=False)
    verified_by_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.odd} - Verified: {self.verified_by_admin}"

class TransactionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255)  # e.g., 'bet', 'win', 'refund'
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)


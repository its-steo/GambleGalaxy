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
            self.crash_multiplier = round(random.uniform(1.00, 50.00), 2)  # Random crash
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Round {self.id} - Crash at {self.crash_multiplier}x"


class AviatorBet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    round = models.ForeignKey(AviatorRound, on_delete=models.CASCADE, related_name='bets')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    cash_out_multiplier = models.FloatField(null=True, blank=True)  # None = did not cash out
    time_placed = models.DateTimeField(default=timezone.now)

    def is_win(self):
        return self.cash_out_multiplier and self.cash_out_multiplier < self.round.crash_multiplier

    def win_amount(self):
        if self.is_win():
            return float(self.amount) * self.cash_out_multiplier
        return 0.0

    def __str__(self):
        return f"{self.user.username} - Bet: {self.amount} on Round {self.round.id}"


# Create your models here.

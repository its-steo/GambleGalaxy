#from django.db import models
#from django.utils import timezone
#from django.conf import settings
#import random
#
#class AviatorRound(models.Model):
#    start_time = models.DateTimeField(default=timezone.now)
#    crash_multiplier = models.FloatField(null=True, blank=True)
#    is_active = models.BooleanField(default=True)
#    ended_at = models.DateTimeField(null=True, blank=True)
#    delay_before_next = models.PositiveIntegerField(default=5)
#
#    def save(self, *args, **kwargs):
#        if not self.crash_multiplier:
#            from .models import CrashMultiplierSetting
#            settings_qs = CrashMultiplierSetting.objects.all()
#            if settings_qs.exists():
#                ranges = [(s.min_value, s.max_value) for s in settings_qs]
#                weights = [s.weight for s in settings_qs]
#                selected_range = random.choices(ranges, weights=weights, k=1)[0]
#                self.crash_multiplier = round(random.uniform(*selected_range), 2)
#            else:
#                # Fallback default
#                ranges = [(1.00, 3.00), (3.01, 10.00), (10.01, 30.00), (30.01, 1000.00)]
#                weights = [80, 12, 7, 1]
#                selected_range = random.choices(ranges, weights=weights, k=1)[0]
#                self.crash_multiplier = round(random.uniform(*selected_range), 2)
#
#        super().save(*args, **kwargs)
#
#    def __str__(self):
#        return f"Round {self.id} - Crash at {self.crash_multiplier}x"
#
#    def get_crash_color(self):
#        if self.crash_multiplier < 2:
#            return "red"
#        elif 2 <= self.crash_multiplier < 5:
#            return "yellow"
#        elif 5 <= self.crash_multiplier < 11:
#            return "green"
#        elif 11 <= self.crash_multiplier < 20:
#            return "blue"
#        else:
#            return "purple"
#
#    def should_start_new_round(self):
#        if self.ended_at:
#            return (timezone.now() - self.ended_at).total_seconds() >= self.delay_before_next
#        return False
#
#
#class AviatorBet(models.Model):
#    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='aviator_bets')
#    round = models.ForeignKey(AviatorRound, on_delete=models.CASCADE, related_name='bets')
#    amount = models.DecimalField(max_digits=10, decimal_places=2)
#    cash_out_multiplier = models.FloatField(null=True, blank=True)
#    final_multiplier = models.FloatField(null=True, blank=True)
#    time_placed = models.DateTimeField(default=timezone.now)
#    is_winner = models.BooleanField(default=False)
#    created_at = models.DateTimeField(auto_now_add=True)
#    auto_cashout = models.FloatField(null=True, blank=True)
#
#    def __str__(self):
#        return f"{self.user.username} - Bet: {self.amount} on Round {self.round.id}"
#
#    def is_win(self):
#        """Check if this bet is a winning bet"""
#        if self.cash_out_multiplier is not None:
#            return self.cash_out_multiplier < self.round.crash_multiplier
#        return False
#
#    def win_amount(self):
#        """Calculate the win amount for this bet"""
#        if self.is_win() and self.cash_out_multiplier:
#            return round(float(self.amount) * self.cash_out_multiplier, 2)
#        return 0.0
#
#    @classmethod
#    def get_top_winners_today(cls, limit=10):
#        """
#        🔧 NEW: Get top winners for today with proper calculation
#        """
#        today = timezone.now().date()
#        
#        # Get all winning bets from today
#        winning_bets = cls.objects.filter(
#            created_at__date=today,
#            is_winner=True,
#            cash_out_multiplier__isnull=False
#        ).select_related('user', 'round')
#        
#        # Calculate win amounts and create list
#        winners_data = []
#        for bet in winning_bets:
#            win_amount = bet.win_amount()
#            if win_amount > 0:
#                winners_data.append({
#                    'id': bet.id,
#                    'username': bet.user.username,
#                    'amount': float(bet.amount),
#                    'win_amount': win_amount,
#                    'multiplier': float(bet.cash_out_multiplier),
#                    'cashout_multiplier': float(bet.cash_out_multiplier),
#                    'timestamp': int(bet.created_at.timestamp()),
#                    'is_bot': getattr(bet.user, 'is_bot', False),
#                    'round_id': bet.round.id
#                })
#        
#        # Sort by win amount and return top winners
#        winners_data.sort(key=lambda x: x['win_amount'], reverse=True)
#        return winners_data[:limit]
#
#    @classmethod
#    def top_winners_today(cls):
#        """Legacy method for backward compatibility"""
#        return cls.get_top_winners_today()
#
#
#class SureOdd(models.Model):
#    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sure_odds')
#    odd = models.DecimalField(max_digits=5, decimal_places=2)
#    is_used = models.BooleanField(default=False)
#    verified_by_admin = models.BooleanField(default=False)
#    created_at = models.DateTimeField(auto_now_add=True)
#
#    def __str__(self):
#        return f"{self.user.username} - {self.odd} - Verified: {self.verified_by_admin}"
#
#
#class SureOddPurchase(models.Model):
#    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sure_odd_purchases')
#    odd_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
#    is_active = models.BooleanField(default=True)
#    used = models.BooleanField(default=False)
#    created_at = models.DateTimeField(auto_now_add=True)
#
#    def status(self):
#        if self.used:
#            return "Used"
#        if self.is_active:
#            return "Active"
#        return "Expired"
#
#    def __str__(self):
#        return f"{self.user.username} - {self.odd_value or 'Pending'}"
#
#
#class TransactionLog(models.Model):
#    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transaction_logs')
#    amount = models.DecimalField(max_digits=10, decimal_places=2)
#    reason = models.CharField(max_length=255)
#    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
#    created_at = models.DateTimeField(auto_now_add=True)
#
#    def __str__(self):
#        return f"{self.user.username} - {self.reason} - {self.amount}"
#
#
#class CrashMultiplierSetting(models.Model):
#    min_value = models.FloatField()
#    max_value = models.FloatField()
#    weight = models.PositiveIntegerField(help_text="Relative weight for this range (e.g. 80 = 80%)")
#
#    class Meta:
#        verbose_name = "Crash Multiplier Setting"
#        verbose_name_plural = "Crash Multiplier Settings"
#
#    def __str__(self):
#        return f"{self.min_value:.2f}x - {self.max_value:.2f}x ({self.weight}%)"
#

from django.db import models
from django.utils import timezone
from django.conf import settings
import random

class AviatorRound(models.Model):
    start_time = models.DateTimeField(default=timezone.now)
    crash_multiplier = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    delay_before_next = models.PositiveIntegerField(default=5)

    def save(self, *args, **kwargs):
        if not self.crash_multiplier:
            from .models import CrashMultiplierSetting
            settings_qs = CrashMultiplierSetting.objects.all()
            if settings_qs.exists():
                ranges = [(s.min_value, s.max_value) for s in settings_qs]
                weights = [s.weight for s in settings_qs]
                selected_range = random.choices(ranges, weights=weights, k=1)[0]
                self.crash_multiplier = round(random.uniform(*selected_range), 2)
            else:
                # Fallback default
                ranges = [(1.00, 3.00), (3.01, 10.00), (10.01, 30.00), (30.01, 1000.00)]
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

    class Meta:
        indexes = [
            models.Index(fields=['round', 'auto_cashout', 'cash_out_multiplier']),
            models.Index(fields=['round', 'cash_out_multiplier']),
        ]

    def __str__(self):
        return f"{self.user.username} - Bet: {self.amount} on Round {self.round.id}"

    def is_win(self):
        """Check if this bet is a winning bet"""
        if self.cash_out_multiplier is not None:
            return self.cash_out_multiplier < self.round.crash_multiplier
        return False

    def win_amount(self):
        """Calculate the win amount for this bet"""
        if self.is_win() and self.cash_out_multiplier:
            return round(float(self.amount) * self.cash_out_multiplier, 2)
        return 0.0

    @classmethod
    def get_top_winners_today(cls, limit=10):
        """
        Get top winners for today with proper calculation
        """
        today = timezone.now().date()
        
        # Get all winning bets from today
        winning_bets = cls.objects.filter(
            created_at__date=today,
            is_winner=True,
            cash_out_multiplier__isnull=False
        ).select_related('user', 'round')
        
        # Calculate win amounts and create list
        winners_data = []
        for bet in winning_bets:
            win_amount = bet.win_amount()
            if win_amount > 0:
                winners_data.append({
                    'id': bet.id,
                    'username': bet.user.username,
                    'amount': float(bet.amount),
                    'win_amount': win_amount,
                    'multiplier': float(bet.cash_out_multiplier),
                    'cashout_multiplier': float(bet.cash_out_multiplier),
                    'timestamp': int(bet.created_at.timestamp()),
                    'is_bot': getattr(bet.user, 'is_bot', False),
                    'round_id': bet.round.id
                })
        
        # Sort by win amount and return top winners
        winners_data.sort(key=lambda x: x['win_amount'], reverse=True)
        return winners_data[:limit]

    @classmethod
    def top_winners_today(cls):
        """Legacy method for backward compatibility"""
        return cls.get_top_winners_today()


class SureOdd(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sure_odds')
    odd = models.DecimalField(max_digits=5, decimal_places=2)
    is_used = models.BooleanField(default=False)
    verified_by_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.odd} - Verified: {self.verified_by_admin}"


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


class TransactionLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transaction_logs')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.reason} - {self.amount}"


class CrashMultiplierSetting(models.Model):
    min_value = models.FloatField()
    max_value = models.FloatField()
    weight = models.PositiveIntegerField(help_text="Relative weight for this range (e.g. 80 = 80%)")

    class Meta:
        verbose_name = "Crash Multiplier Setting"
        verbose_name_plural = "Crash Multiplier Settings"

    def __str__(self):
        return f"{self.min_value:.2f}x - {self.max_value:.2f}x ({self.weight}%)"
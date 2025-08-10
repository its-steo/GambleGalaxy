from django.db import models
from django.conf import settings
from django.utils import timezone
from betting.models import Bet

class UserStats(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_bets = models.IntegerField(default=0)
    total_winnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_losses = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    win_rate = models.FloatField(default=0.0)
    active_bets = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - Stats"
    
    def calculate_win_rate(self):
        wins = Bet.objects.filter(user=self.user, status='won').count()
        total_bets = self.total_bets
        self.win_rate = (wins / total_bets * 100) if total_bets > 0 else 0.0
        self.save()
        return self.win_rate

class RecentActivity(models.Model):
    ACTIVITY_TYPES = [
        ('bet', 'Bet Placed'),
        ('win', 'Win'),
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('cashout', 'Cashout'),
    ]
    GAME_TYPES = [
        ('aviator', 'Aviator'),
        ('sports_betting', 'Sports Betting'),
        ('sure_odds', 'Sure Odds'),
    ]
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    game_type = models.CharField(max_length=20, choices=GAME_TYPES, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    multiplier = models.FloatField(null=True, blank=True)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Recent Activities"
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_type} - {self.amount}"

class TopWinner(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    game_type = models.CharField(max_length=20)
    multiplier = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-amount', '-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.game_type}"
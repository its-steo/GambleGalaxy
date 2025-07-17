from django.db import models
from django.conf import settings
import uuid


# -------------------
# MATCH MODEL
# -------------------
class Match(models.Model):
    home_team = models.CharField(max_length=100)
    away_team = models.CharField(max_length=100)
    match_time = models.DateTimeField()

    odds_home_win = models.DecimalField(max_digits=5, decimal_places=2)
    odds_draw = models.DecimalField(max_digits=5, decimal_places=2)
    odds_away_win = models.DecimalField(max_digits=5, decimal_places=2)

    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('first_half', 'First Half'),
        ('halftime', 'Half Time'),
        ('second_half', 'Second Half'),
        ('fulltime', 'Full Time'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='upcoming'
    )

    score_home = models.IntegerField(default=0)
    score_away = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.home_team} vs {self.away_team}"


# -------------------
# BET SLIP (MULTIPLE MATCHES)
# -------------------
class Bet(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('won', 'Won'),
        ('lost', 'Lost'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_odds = models.DecimalField(max_digits=6, decimal_places=2, default=1.00)
    expected_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    placed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - Bet ID #{self.id} - {self.status}"


# -------------------
# INDIVIDUAL MATCH SELECTION IN A MULTIBET
# -------------------
class BetSelection(models.Model):
    BET_CHOICES = [
        ('home_win', 'Home Win'),
        ('draw', 'Draw'),
        ('away_win', 'Away Win'),
    ]

    bet = models.ForeignKey(Bet, related_name='selections', on_delete=models.CASCADE)
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=10, choices=BET_CHOICES)

    is_correct = models.BooleanField(
        null=True, blank=True,
        help_text="Set to True if the prediction was correct, False if not, None if pending."
    )

    def __str__(self):
        return f"Bet #{self.bet.id} - {self.match} - {self.selected_option}"


class SureOddSlip(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    matches = models.ManyToManyField('Match')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=10000.00)
    has_paid = models.BooleanField(default=False)
    shown_to_user_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    revealed_predictions = models.BooleanField(default=False)  # <- NEW

    def __str__(self):
        return f"{self.user.username} - Sure Slip {self.code}"

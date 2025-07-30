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

    # Standard 1X2 odds
    odds_home_win = models.DecimalField(max_digits=5, decimal_places=2)
    odds_draw = models.DecimalField(max_digits=5, decimal_places=2)
    odds_away_win = models.DecimalField(max_digits=5, decimal_places=2)

    # Goals
    odds_over_2_5 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_under_2_5 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Both Teams To Score
    odds_btts_yes = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_btts_no = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Double Chance
    odds_home_or_draw = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_draw_or_away = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_home_or_away = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Half Time / Full Time
    odds_ht_ft_home_home = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_ht_ft_draw_draw = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_ht_ft_away_away = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Correct Score (Example only - more can be added)
    odds_score_1_0 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_score_2_1 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_score_0_0 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    odds_score_1_1 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('first_half', 'First Half'),
        ('halftime', 'Half Time'),
        ('second_half', 'Second Half'),
        ('fulltime', 'Full Time'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')

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
    match = models.ForeignKey(Match, on_delete=models.CASCADE, null=True, blank=True)

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
        # Standard 1X2
        ('home_win', 'Home Win'),
        ('draw', 'Draw'),
        ('away_win', 'Away Win'),
        # Goals
        ('over_2.5', 'Over 2.5 Goals'),
        ('under_2.5', 'Under 2.5 Goals'),
        # BTTS
        ('btts_yes', 'Both Teams to Score - Yes'),
        ('btts_no', 'Both Teams to Score - No'),
        # Double Chance
        ('home_or_draw', 'Home or Draw'),
        ('draw_or_away', 'Draw or Away'),
        ('home_or_away', 'Home or Away'),
        # Half Time / Full Time
        ('ht_ft_home_home', 'HT/FT Home/Home'),
        ('ht_ft_draw_draw', 'HT/FT Draw/Draw'),
        ('ht_ft_away_away', 'HT/FT Away/Away'),
        # Correct Score
        ('score_1_0', 'Correct Score 1-0'),
        ('score_2_1', 'Correct Score 2-1'),
        ('score_0_0', 'Correct Score 0-0'),
        ('score_1_1', 'Correct Score 1-1'),
    ]

    bet = models.ForeignKey('Bet', related_name='selections', on_delete=models.CASCADE)
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=30, choices=BET_CHOICES)
    odds = models.FloatField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)

    def __str__(self):
        return f"Bet #{self.bet.id} - {self.match} - {self.selected_option}"

# -------------------
# SURE ODDS PREDICTION
# -------------------
class SureOddPrediction(models.Model):
    slip = models.ForeignKey('SureOddSlip', related_name='predictions', on_delete=models.CASCADE)
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    predicted_option = models.CharField(max_length=50, choices=BetSelection.BET_CHOICES)

    def __str__(self):
        return f"S slip #{self.slip.code} - {self.match} - {self.predicted_option}"

# -------------------
# SURE ODDS SLIP
# -------------------
class SureOddSlip(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    matches = models.ManyToManyField('Match')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=10000.00)
    has_paid = models.BooleanField(default=False)
    shown_to_user_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    revealed_predictions = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - Sure Slip {self.code}"
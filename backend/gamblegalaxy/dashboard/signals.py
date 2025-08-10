from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import UserStats, RecentActivity, TopWinner
from wallet.models import Transaction
from betting.models import Bet
from games.models import AviatorBet

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_stats(sender, instance, created, **kwargs):
    if created:
        UserStats.objects.create(user=instance)

@receiver(post_save, sender=Transaction)
def create_activity_from_transaction(sender, instance, created, **kwargs):
    if created:
        activity_type = instance.transaction_type
        RecentActivity.objects.create(
            user=instance.user,
            activity_type=activity_type,
            amount=instance.amount,
            description=f"{activity_type.title()} of KES {instance.amount}",
            status='completed'
        )

@receiver(post_save, sender=Bet)
def create_activity_from_bet(sender, instance, created, **kwargs):
    if created:
        # Check if selections exist before accessing them
        first_selection = instance.selections.first()
        if first_selection:
            description = "Bet placed on multiple matches" if instance.selections.count() > 1 else f"Bet placed on {first_selection.match}"
        else:
            # Fallback description when selections haven't been created yet
            description = f"Sports bet placed - Amount: KES {instance.amount}"
        
        RecentActivity.objects.create(
            user=instance.user,
            activity_type='bet',
            game_type='sports_betting',
            amount=instance.amount,
            description=description,
            status='pending'
        )
    
    # Handle bet wins
    if instance.status == 'won' and instance.expected_payout:
        first_selection = instance.selections.first()
        if first_selection:
            description = "Won bet on multiple matches" if instance.selections.count() > 1 else f"Won bet on {first_selection.match}"
        else:
            description = f"Won sports bet - Payout: KES {instance.expected_payout}"
        
        RecentActivity.objects.create(
            user=instance.user,
            activity_type='win',
            game_type='sports_betting',
            amount=instance.expected_payout,
            description=description,
            status='completed'
        )
        
        # Create top winner entry for big wins
        if instance.expected_payout >= 1000:
            TopWinner.objects.create(
                user=instance.user,
                amount=instance.expected_payout,
                game_type='sports_betting'
            )

@receiver(post_save, sender=AviatorBet)
def create_activity_from_aviator_bet(sender, instance, created, **kwargs):
    if created:
        RecentActivity.objects.create(
            user=instance.user,
            activity_type='bet',
            game_type='aviator',
            amount=instance.amount,
            description=f"Aviator bet of KES {instance.amount}",
            status='pending'
        )
    
    # Handle aviator wins
    if instance.is_winner and instance.cash_out_multiplier:
        win_amount = instance.win_amount()
        RecentActivity.objects.create(
            user=instance.user,
            activity_type='cashout',
            game_type='aviator',
            amount=win_amount,
            multiplier=instance.cash_out_multiplier,
            description=f"Aviator cashout at {instance.cash_out_multiplier}x",
            status='completed'
        )
        
        # Create top winner entry for big wins
        if win_amount >= 1000:
            TopWinner.objects.create(
                user=instance.user,
                amount=win_amount,
                game_type='aviator',
                multiplier=instance.cash_out_multiplier
            )
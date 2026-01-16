from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import UserStats, RecentActivity, TopWinner
from wallet.models import Transaction
from betting.models import Bet
from games.models import AviatorBet
from decimal import Decimal


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
    user_stats, _ = UserStats.objects.get_or_create(user=instance.user)
    
    if created:
        first_selection = instance.selections.first()
        if first_selection:
            description = "Bet placed on multiple matches" if instance.selections.count() > 1 else f"Bet placed on {first_selection.match}"
        else:
            description = f"Sports bet placed - Amount: KES {instance.amount}"
        
        RecentActivity.objects.create(
            user=instance.user,
            activity_type='bet',
            game_type='sports_betting',
            amount=instance.amount,
            description=description,
            status='pending'
        )
        # Update UserStats for bet
        user_stats.total_bets += 1
        user_stats.active_bets += 1
    
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
        # Update UserStats for win
        user_stats.total_winnings += instance.expected_payout
        user_stats.active_bets = max(0, user_stats.active_bets - 1)
        
        if instance.expected_payout >= 1000:
            TopWinner.objects.create(
                user=instance.user,
                amount=instance.expected_payout,
                game_type='sports_betting'
            )
    
    if instance.status == 'lost':
        RecentActivity.objects.create(
            user=instance.user,
            activity_type='lost',
            game_type='sports_betting',
            amount=instance.amount,
            description=f"Lost bet - Amount: KES {instance.amount}",
            status='completed'
        )
        # Update UserStats for loss
        user_stats.total_losses += instance.amount
        user_stats.active_bets = max(0, user_stats.active_bets - 1)
    
    user_stats.calculate_win_rate()
    user_stats.save()

@receiver(post_save, sender=AviatorBet)
def create_activity_from_aviator_bet(sender, instance, created, **kwargs):
    user_stats, _ = UserStats.objects.get_or_create(user=instance.user)
    
    if created:
        RecentActivity.objects.create(
            user=instance.user,
            activity_type='bet',
            game_type='aviator',
            amount=instance.amount,
            description=f"Aviator bet of KES {instance.amount}",
            status='pending'
        )
        # Update UserStats for bet
        user_stats.total_bets += 1
        user_stats.active_bets += 1
    
    if instance.is_winner and instance.cash_out_multiplier:
        win_amount = Decimal(str(instance.win_amount()))  # Convert to Decimal
        RecentActivity.objects.create(
            user=instance.user,
            activity_type='cashout',
            game_type='aviator',
            amount=win_amount,
            multiplier=instance.cash_out_multiplier,
            description=f"Aviator cashout at {instance.cash_out_multiplier}x",
            status='completed'
        )
        # Update UserStats for cashout
        user_stats.total_winnings += win_amount  # Now both are Decimal
        user_stats.active_bets = max(0, user_stats.active_bets - 1)
        
        if win_amount >= 1000:
            TopWinner.objects.create(
                user=instance.user,
                amount=win_amount,
                game_type='aviator',
                multiplier=instance.cash_out_multiplier
            )
    
    user_stats.calculate_win_rate()
    try:
        user_stats.save()
        print(f"Updated UserStats: {user_stats.__dict__}")
    except Exception as e:
        print(f"Error saving UserStats: {e}")
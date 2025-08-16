from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Bet, SureOddSlip, Match
from wallet.models import Wallet, Transaction
from django.contrib.auth import get_user_model
import logging
from django.utils import timezone

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Bet)
def payout_on_win(sender, instance, **kwargs):
    if instance.status == 'won' and not hasattr(instance, '_already_paid'):
        # Prevent multiple payouts
        instance._already_paid = True
        logger.info(f"Processing payout for bet {instance.id} for user {instance.user}")

        winnings = instance.amount * instance.total_odds
        wallet, created = Wallet.objects.get_or_create(user=instance.user)
        wallet.balance += winnings
        wallet.save()

        # Record transaction
        Transaction.objects.create(
            user=instance.user,
            amount=winnings,
            transaction_type='winning',
            description=f'Winnings from bet #{instance.id}'
        )
        logger.info(f"Payout of {winnings} processed for bet {instance.id}")

@receiver(post_save, sender=Match)
def create_sure_odd_slips(sender, instance, created, **kwargs):
    if created:
        users = User.objects.filter(is_active=True)
        for user in users:
            if not SureOddSlip.objects.filter(user=user, is_used=False).exists():
                matches = Match.objects.filter(match_time__gt=timezone.now()).order_by('?')[:3]
                if matches.exists():
                    slip = SureOddSlip.objects.create(user=user, amount_paid=10000)
                    slip.matches.set(matches)
                    slip.save()
                    logger.info(f"Created sure odds slip {slip.code} for user {user} with {matches.count()} matches")
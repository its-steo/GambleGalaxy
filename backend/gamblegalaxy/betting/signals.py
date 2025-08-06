from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Bet, SureOddSlip, Match
from wallet.models import Wallet, Transaction
from django.contrib.auth import get_user_model
User = get_user_model()


@receiver(post_save, sender=Bet)
def payout_on_win(sender, instance, **kwargs):
    if instance.status == 'won' and not hasattr(instance, '_already_paid'):
        # Prevent multiple payouts
        instance._already_paid = True

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


@receiver(post_save, sender=Match)
def create_sure_odd_slips(sender, instance, created, **kwargs):
    if created:
        users = User.objects.filter(is_active=True)
        for user in users:
            if not SureOddSlip.objects.filter(user=user, is_used=False).exists():
                slip = SureOddSlip.objects.create(user=user, amount_paid=10000)
                # Randomly select 3 matches (change as needed)
                matches = Match.objects.order_by('?')[:3]
                slip.matches.set(matches)
                slip.save()

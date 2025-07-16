from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Bet
from wallet.models import Wallet, Transaction

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
            transaction_type='deposit'
        )



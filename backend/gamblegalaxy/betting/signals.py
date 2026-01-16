from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Bet, SureOddSlip, Match
from wallet.models import Wallet, Transaction
from django.contrib.auth import get_user_model
import logging
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from decimal import Decimal

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Bet)
def handle_bet_updates(sender, instance, created, **kwargs):
    if created and instance.status == 'pending':
        # Send email on successful bet placement
        send_bet_placement_email(instance)
    
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
    
    # Send outcome email when status changes to won or lost
    if instance.status in ('won', 'lost') and not hasattr(instance, '_outcome_email_sent'):
        instance._outcome_email_sent = True
        send_bet_outcome_email(instance)

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

def send_bet_placement_email(bet):
    user = bet.user
    if not user.email:
        logger.warning(f"No email address for user {user.username}. Skipping bet placement email for bet {bet.id}.")
        return

    selections_details = [
        {
            'match': f"{selection.match.home_team} vs {selection.match.away_team}",
            'option': selection.get_selected_option_display(),
            'odds': selection.odds if selection.odds is not None else Decimal('0.00')  # Explicit None check
        }
        for selection in bet.selections.all()
    ]
    expected_payout = bet.amount * bet.total_odds

    context = {
        'username': user.username,
        'bet_id': bet.id,
        'amount': bet.amount,
        'total_odds': bet.total_odds,
        'expected_payout': expected_payout.quantize(Decimal("0.01")),
        'selections': selections_details,
    }

    # Log the selections details to debug
    logger.debug(f"Bet placement email context selections: {selections_details}")

    # Render HTML and plain text versions
    html_message = render_to_string('emails/bet_placement_email.html', context)
    plain_message = f"""
Dear {user.username},

Thank you for placing your bet with us!

Bet Details:
- Bet ID: #{bet.id}
- Amount: {bet.amount}
- Total Odds: {bet.total_odds}
- Potential Win: {expected_payout.quantize(Decimal("0.01"))}

Selections:
{'\n'.join([f"- {sel['match']}: {sel['option']} @ {sel['odds'] if sel['odds'] else 'N/A'}" for sel in selections_details])}

We wish you the best of luck!

Best regards,
Your Betting Team
"""

    subject = "Your Bet has been Placed Successfully!"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]

    try:
        send_mail(
            subject,
            plain_message,
            from_email,
            recipient_list,
            html_message=html_message,
        )
        logger.info(f"Bet placement email sent to {user.email} for bet {bet.id}")
    except Exception as e:
        logger.error(f"Failed to send bet placement email to {user.email} for bet {bet.id}: {e}")

def send_bet_outcome_email(bet):
    user = bet.user
    if not user.email:
        logger.warning(f"No email address for user {user.username}. Skipping bet outcome email for bet {bet.id}.")
        return

    context = {
        'username': user.username,
        'bet_id': bet.id,
        'amount': bet.amount,
        'total_odds': bet.total_odds,
    }

    if bet.status == 'won':
        winnings = bet.amount * bet.total_odds
        context['status'] = 'won'
        context['winnings'] = winnings.quantize(Decimal("0.01"))
        subject = "Congratulations! Your Bet Won!"
        plain_message = f"""
Dear {user.username},

Great news! Your bet #{bet.id} has won!

- Amount Bet: {bet.amount}
- Total Odds: {bet.total_odds}
- Winnings: {winnings.quantize(Decimal("0.01"))}

Your winnings have been added to your wallet.

Thank you for betting with us!

Best regards,
Your Betting Team
"""
    else:  # lost
        context['status'] = 'lost'
        subject = "Your Bet Result"
        plain_message = f"""
Dear {user.username},

Unfortunately, your bet #{bet.id} did not win this time.

- Amount Bet: {bet.amount}
- Total Odds: {bet.total_odds}

Better luck next time!

Best regards,
Your Betting Team
"""

    html_message = render_to_string('emails/bet_outcome_email.html', context)
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]

    try:
        send_mail(
            subject,
            plain_message,
            from_email,
            recipient_list,
            html_message=html_message,
        )
        logger.info(f"Bet outcome email sent to {user.email} for bet {bet.id} (status: {bet.status})")
    except Exception as e:
        logger.error(f"Failed to send bet outcome email to {user.email} for bet {bet.id}: {e}")
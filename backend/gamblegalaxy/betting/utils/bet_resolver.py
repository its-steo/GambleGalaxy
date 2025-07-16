from betting.models import Bet
from django.db.models import Q

def resolve_bets():
    bets = Bet.objects.filter(status='pending')

    for bet in bets:
        selections = bet.selections.all()

        if not all(sel.is_correct is not None for sel in selections):
            continue  # Some matches are still pending

        if any(sel.is_correct is False for sel in selections):
            bet.status = 'lost'
        else:
            bet.status = 'won'
            # Optional: payout logic here

        bet.save()

from django.core.management.base import BaseCommand
from betting.utils.match_status_updater import update_match_statuses
from betting.utils.bet_resolver import resolve_bets
from betting.models import SureOddSlip
from django.utils import timezone

class Command(BaseCommand):
    help = 'Updates match statuses and resolves bets'

    def handle(self, *args, **kwargs):
        update_match_statuses()
        resolve_bets()
        self.stdout.write(self.style.SUCCESS('✅ Match statuses updated and bets resolved!'))


def cleanup_sure_odds():
    slips = SureOddSlip.objects.filter(is_used=False)
    for slip in slips:
        first_match = slip.matches.order_by('match_time').first()
        if first_match and timezone.now() > first_match.match_time:
            slip.is_used = True
            slip.save()

# Example: Retrieve the bet object before using it
from betting.models import Bet

bet = Bet.objects.first()  # Replace with appropriate query to get the bet you want to process
user = bet.user  

if bet.is_sure_odd:
    if user.is_verified:
        bet.status = "won"
    else:
        bet.status = "lost"
    bet.save()


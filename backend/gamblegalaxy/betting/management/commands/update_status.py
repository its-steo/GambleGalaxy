from django.core.management.base import BaseCommand
from betting.utils.bet_resolver import resolve_bets
from betting.models import SureOddSlip
from django.utils import timezone

class Command(BaseCommand):
    help = 'Resolves bets and cleans up sure odds'

    def handle(self, *args, **kwargs):
        resolve_bets()
        self.cleanup_sure_odds()
        self.stdout.write(self.style.SUCCESS('✅ Bets resolved and sure odds cleaned up!'))

    def cleanup_sure_odds(self):
        slips = SureOddSlip.objects.filter(is_used=False)
        for slip in slips:
            first_match = slip.matches.order_by('match_time').first()
            if first_match and timezone.now() > first_match.match_time:
                slip.is_used = True
                slip.save()
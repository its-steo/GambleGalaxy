from django.core.management.base import BaseCommand
from django.utils import timezone
from betting.models import Match, BetSelection, Bet

import random
from datetime import timedelta

class Command(BaseCommand):
    help = "Simulates match progress and resolves finished matches"

    def handle(self, *args, **kwargs):
        now = timezone.now()

        for match in Match.objects.all():
            # ⏱ Update match status based on time
            if match.status == 'upcoming' and now >= match.match_time:
                match.status = 'first_half'
                self.stdout.write(f"🏁 {match} has started: FIRST HALF")

            elif match.status == 'first_half' and now >= match.match_time + timedelta(minutes=45):
                match.status = 'halftime'
                self.stdout.write(f"⏸️ {match} is now at HALF TIME")

            elif match.status == 'halftime' and now >= match.match_time + timedelta(minutes=60):
                match.status = 'second_half'
                self.stdout.write(f"🔁 {match} has started SECOND HALF")

            elif match.status == 'second_half' and now >= match.match_time + timedelta(minutes=90):
                match.status = 'fulltime'
                # Simulate score (optional, for now)
                match.score_home = random.randint(0, 5)
                match.score_away = random.randint(0, 5)
                self.stdout.write(f"✅ {match} is now FULL TIME - Final Score: {match.score_home}-{match.score_away}")
                self.resolve_bets(match)

            match.save()

    def resolve_bets(self, match):
        selections = BetSelection.objects.filter(match=match, is_correct__isnull=True)
        for sel in selections:
            result = None
            if match.score_home > match.score_away:
                result = 'home_win'
            elif match.score_home < match.score_away:
                result = 'away_win'
            else:
                result = 'draw'

            sel.is_correct = (sel.selected_option == result)
            sel.save()

        # Check if full bets are complete
        for bet in Bet.objects.filter(status='pending'):
            selections = bet.selections.all()
            if all(s.is_correct is not None for s in selections):
                if all(s.is_correct for s in selections):
                    bet.status = 'won'
                else:
                    bet.status = 'lost'
                bet.save()

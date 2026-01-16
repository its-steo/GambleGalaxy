from betting.models import Bet, BetSelection
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)


def resolve_bets(self, match):
    try:
        selections = BetSelection.objects.filter(match=match, is_correct__isnull=True)
        for sel in selections:
            ft_home = match.score_home
            ft_away = match.score_away
            ht_home = match.ht_score_home or 0
            ht_away = match.ht_score_away or 0
            total_goals = ft_home + ft_away
            btts = (ft_home > 0 and ft_away > 0)

            ft_winner = 'home' if ft_home > ft_away else 'away' if ft_away > ft_home else 'draw'
            ht_winner = 'home' if ht_home > ht_away else 'away' if ht_away > ht_home else 'draw'

            is_correct = False

            if sel.selected_option == 'home_win':
                is_correct = (ft_winner == 'home')
            elif sel.selected_option == 'away_win':
                is_correct = (ft_winner == 'away')
            elif sel.selected_option == 'draw':
                is_correct = (ft_winner == 'draw')
            elif sel.selected_option == 'over_2.5':
                is_correct = (total_goals > 2.5)
            elif sel.selected_option == 'under_2.5':
                is_correct = (total_goals <= 2.5)
            elif sel.selected_option == 'btts_yes':
                is_correct = btts
            elif sel.selected_option == 'btts_no':
                is_correct = not btts
            elif sel.selected_option == 'home_or_draw':
                is_correct = (ft_winner != 'away')
            elif sel.selected_option == 'draw_or_away':
                is_correct = (ft_winner != 'home')
            elif sel.selected_option == 'home_or_away':
                is_correct = (ft_winner != 'draw')
            elif sel.selected_option == 'ht_ft_home_home':
                is_correct = (ht_winner == 'home' and ft_winner == 'home')
            elif sel.selected_option == 'ht_ft_draw_draw':
                is_correct = (ht_winner == 'draw' and ft_winner == 'draw')
            elif sel.selected_option == 'ht_ft_away_away':
                is_correct = (ht_winner == 'away' and ft_winner == 'away')
            elif sel.selected_option == 'score_1_0':
                is_correct = (ft_home == 1 and ft_away == 0)
            elif sel.selected_option == 'score_2_1':
                is_correct = (ft_home == 2 and ft_away == 1)
            elif sel.selected_option == 'score_0_0':
                is_correct = (ft_home == 0 and ft_away == 0)
            elif sel.selected_option == 'score_1_1':
                is_correct = (ft_home == 1 and ft_away == 1)

            sel.is_correct = is_correct
            sel.save()
            logger.info(f"Resolved selection for match {match.api_match_id}: {sel.selected_option} -> {sel.is_correct}")

        # Resolve bets where all selections are now evaluated
        pending_bets = Bet.objects.filter(status='pending', selections__match=match).distinct()
        for bet in pending_bets:
            selections = bet.selections.all()
            if all(s.is_correct is not None for s in selections):
                bet.status = 'won' if all(s.is_correct for s in selections) else 'lost'
                bet.save()
                logger.info(f"Resolved bet {bet.id}: {bet.status}")

    except Exception as e:
        self.stdout.write(self.style.ERROR(f"Error resolving bets for match {match.api_match_id}: {e}"))
        logger.error(f"Error resolving bets for match {match.api_match_id}: {e}")
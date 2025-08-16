from django.core.management.base import BaseCommand
from django.utils import timezone
import requests
from datetime import datetime
import pytz
from django.conf import settings
from betting.models import Match, BetSelection, Bet
from decimal import Decimal
import time
import logging
import json

# Set up logging
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Fetches match data and odds from Football API for the 2025-2026 season and updates matches in the database"

    def handle(self, *args, **kwargs):
        API_KEY = getattr(settings, 'FOOTBALL_API_KEY', None)
        if not API_KEY:
            self.stdout.write(self.style.ERROR("FOOTBALL_API_KEY is not set in settings.py"))
            logger.error("FOOTBALL_API_KEY is not set in settings.py")
            return

        self.stdout.write(f"Using API key: {API_KEY[:4]}...{API_KEY[-4:]}")
        API_BASE_URL = 'https://v3.football.api-sports.io'
        headers = {
            'x-apisports-key': API_KEY.strip()
        }

        # Test API status
        try:
            status_response = requests.get(f'{API_BASE_URL}/status', headers=headers)
            status_response.raise_for_status()
            status_data = status_response.json()
            self.stdout.write(f"Status response: {status_data}")
            if status_data.get('errors') and isinstance(status_data['errors'], dict) and status_data['errors'].get('token'):
                self.stdout.write(self.style.ERROR(f"API authentication failed: {status_data['errors']['token']}"))
                logger.error(f"API authentication failed: {status_data['errors']['token']}")
                return
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Status check failed: {e}"))
            logger.error(f"Status check failed: {e}")
            if hasattr(e, 'response') and e.response:
                self.stdout.write(self.style.ERROR(f"Status response details: {e.response.text}"))
                logger.error(f"Status response details: {e.response.text}")
            return

        # Define active leagues for 2025-2026
        leagues = [
            {'id': 39, 'name': 'Premier League'},
            {'id': 140, 'name': 'La Liga'},
            {'id': 78, 'name': 'Bundesliga'},
            {'id': 135, 'name': 'Serie A'},
            {'id': 61, 'name': 'Ligue 1'},
        ]
        self.stdout.write(self.style.SUCCESS(f"Fetching leagues: {[l['name'] for l in leagues]}"))

        # Fetch available seasons
        try:
            seasons_response = requests.get(f'{API_BASE_URL}/leagues/seasons', headers=headers)
            seasons_response.raise_for_status()
            seasons_data = seasons_response.json()
            self.stdout.write(f"Available seasons: {seasons_data.get('response', [])}")
            seasons = seasons_data.get('response', [])
            season = 2025 if 2025 in seasons else max([s for s in seasons if s <= 2025], default=2025)
            self.stdout.write(self.style.SUCCESS(f"Using season: {season}"))
            if season != 2025:
                self.stdout.write(self.style.WARNING(f"Season 2025 not available, falling back to {season}. Upgrade to a paid plan for 2025 data."))
                logger.warning(f"Season 2025 not available, falling back to {season}.")
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Failed to fetch seasons: {e}"))
            logger.error(f"Failed to fetch seasons: {e}")
            season = 2025

        from_date = '2025-08-01'
        to_date = '2026-05-31'  # Covers 2025-2026 season
        self.stdout.write(f"Fetching fixtures from {from_date} to {to_date}")

        matches_fetched = False

        # Fetch fixtures for leagues
        for league in leagues:
            league_id = league['id']
            league_name = league['name']
            self.stdout.write(f"Fetching fixtures for {league_name} (ID: {league_id})...")
            params = {
                'league': league_id,
                'from': from_date,
                'to': to_date,
                'season': season,
                'timezone': 'UTC'
            }
            try:
                response = requests.get(f'{API_BASE_URL}/fixtures', headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                self.stdout.write(f"Fixtures response for {league_name}: results={data.get('results', 0)}")
                if data.get('errors'):
                    self.stdout.write(self.style.WARNING(f"API error for {league_name}: {data['errors']}"))
                    logger.warning(f"API error for {league_name}: {data['errors']}")
                    if 'plan' in data.get('errors', {}):
                        self.stdout.write(self.style.ERROR(f"Free plan does not support season {season} for {league_name}. Try seasons 2021-2023 or upgrade plan."))
                        logger.error(f"Free plan does not support season {season} for {league_name}.")
                    continue
            except requests.RequestException as e:
                self.stdout.write(self.style.ERROR(f"Failed to fetch fixtures for {league_name}: {e}"))
                logger.error(f"Failed to fetch fixtures for {league_name}: {e}")
                continue

            if not data.get('response'):
                self.stdout.write(self.style.WARNING(f"No matches found for {league_name}"))
                logger.warning(f"No matches found for {league_name}")
                continue

            matches_fetched = True
            for fixture in data['response']:
                self.process_fixture(fixture, headers, API_BASE_URL)
                time.sleep(1)  # Respect API rate limits

        if matches_fetched:
            self.stdout.write(self.style.SUCCESS("✅ Matches and odds fetched and updated successfully!"))
        else:
            self.stdout.write(self.style.WARNING("No matches were fetched. Check season availability or upgrade API plan."))
            logger.warning("No matches were fetched.")

    def process_fixture(self, fixture, headers, API_BASE_URL):
        try:
            home_team = fixture['teams']['home']['name']
            away_team = fixture['teams']['away']['name']
            match_time = datetime.strptime(fixture['fixture']['date'], '%Y-%m-%dT%H:%M:%S%z')
            api_match_id = str(fixture['fixture']['id'])
            status = self.map_api_status(fixture['fixture']['status']['short'])
            elapsed = fixture['fixture']['status'].get('elapsed', None)
            score_home = fixture['goals']['home'] or 0
            score_away = fixture['goals']['away'] or 0
            ht_score_home = fixture.get('score', {}).get('halftime', {}).get('home', None)
            ht_score_away = fixture.get('score', {}).get('halftime', {}).get('away', None)

            # Validate required fields
            if not all([api_match_id, home_team, away_team, match_time]):
                self.stdout.write(self.style.WARNING(f"Missing required fields for match {api_match_id}"))
                logger.warning(f"Missing required fields for match {api_match_id}")
                return

            odds = self.fetch_odds(api_match_id, headers, API_BASE_URL)

            # Ensure match_time is timezone-aware
            if not timezone.is_aware(match_time):
                match_time = timezone.make_aware(match_time, timezone=pytz.UTC)
                logger.debug(f"Made match_time aware for match {api_match_id}: {match_time}")

            # Update or create match
            match, created = Match.objects.update_or_create(
                api_match_id=api_match_id,
                defaults={
                    'home_team': home_team,
                    'away_team': away_team,
                    'match_time': match_time,
                    'status': status,
                    'score_home': score_home,
                    'score_away': score_away,
                    'ht_score_home': ht_score_home,
                    'ht_score_away': ht_score_away,
                    'elapsed_minutes': elapsed,
                    'odds_home_win': odds.get('home_win'),
                    'odds_draw': odds.get('draw'),
                    'odds_away_win': odds.get('away_win'),
                    'odds_over_2_5': odds.get('over_2.5'),
                    'odds_under_2_5': odds.get('under_2.5'),
                    'odds_btts_yes': odds.get('btts_yes'),
                    'odds_btts_no': odds.get('btts_no'),
                    'odds_home_or_draw': odds.get('home_or_draw'),
                    'odds_draw_or_away': odds.get('draw_or_away'),
                    'odds_home_or_away': odds.get('home_or_away'),
                    'odds_ht_ft_home_home': odds.get('ht_ft_home_home'),
                    'odds_ht_ft_draw_draw': odds.get('ht_ft_draw_draw'),
                    'odds_ht_ft_away_away': odds.get('ht_ft_away_away'),
                    'odds_score_1_0': odds.get('score_1_0'),
                    'odds_score_2_1': odds.get('score_2_1'),
                    'odds_score_0_0': odds.get('score_0_0'),
                    'odds_score_1_1': odds.get('score_1_1'),
                }
            )
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} match: {home_team} vs {away_team}"))
            logger.info(f"{'Created' if created else 'Updated'} match: {home_team} vs {away_team} with odds: {odds}")

            if match.status == 'fulltime':
                self.resolve_bets(match)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error processing match {api_match_id}: {e}"))
            logger.error(f"Error processing match {api_match_id}: {e}")

    def fetch_odds(self, fixture_id, headers, API_BASE_URL):
        try:
            response = requests.get(
                f'{API_BASE_URL}/odds',
                headers=headers,
                params={'fixture': fixture_id}
            )
            response.raise_for_status()
            odds_data = response.json()
            self.stdout.write(f"Odds response for fixture {fixture_id}: results={odds_data.get('results', 0)}")
            logger.debug(f"Raw odds response for fixture {fixture_id}:\n{json.dumps(odds_data, indent=2, ensure_ascii=False)}")

            if odds_data.get('errors'):
                self.stdout.write(self.style.WARNING(f"API error for odds {fixture_id}: {odds_data['errors']}"))
                logger.warning(f"API error for odds {fixture_id}: {odds_data['errors']}")
                return {}

            if not odds_data.get('response'):
                self.stdout.write(self.style.WARNING(f"No odds data returned for fixture {fixture_id}"))
                logger.warning(f"No odds data returned for fixture {fixture_id}")
                return {}

            odds = {}
            # API response is array of fixture odds objects
            for fixture_odds in odds_data.get('response', []):
                bookmakers = fixture_odds.get('bookmakers', [])
                if not bookmakers:
                    logger.debug(f"No bookmakers found for fixture {fixture_id}")
                    continue

                # Use the first bookmaker with valid bets
                for bookmaker in bookmakers:
                    bookmaker_name = bookmaker.get('name', 'Unknown')
                    bets = bookmaker.get('bets', [])
                    if not bets:
                        logger.debug(f"No bets found for bookmaker {bookmaker_name} in fixture {fixture_id}")
                        continue

                    for bet in bets:
                        bet_name = bet.get('name', '').lower().strip()
                        values = bet.get('values', [])
                        if not values:
                            logger.debug(f"No values for bet '{bet_name}' in fixture {fixture_id}")
                            continue

                        # Map bet types to odds keys
                        bet_mappings = {
                            'match winner': [
                                ('home', 'home_win'),
                                ('draw', 'draw'),
                                ('away', 'away_win')
                            ],
                            'over/under': [
                                ('over 2.5', 'over_2.5'),
                                ('under 2.5', 'under_2.5')
                            ],
                            'both teams to score': [
                                ('yes', 'btts_yes'),
                                ('no', 'btts_no')
                            ],
                            'double chance': [
                                ('home or draw', 'home_or_draw'),
                                ('draw or away', 'draw_or_away'),
                                ('home or away', 'home_or_away')
                            ],
                            'half time/full time': [
                                ('home/home', 'ht_ft_home_home'),
                                ('draw/draw', 'ht_ft_draw_draw'),
                                ('away/away', 'ht_ft_away_away')
                            ],
                            'correct score': [
                                ('1:0', 'score_1_0'),
                                ('2:1', 'score_2_1'),
                                ('0:0', 'score_0_0'),
                                ('1:1', 'score_1_1')
                            ],
                            'exact score': [  # Alternative name for correct score
                                ('1:0', 'score_1_0'),
                                ('2:1', 'score_1_1'),
                                ('0:0', 'score_0_0'),
                                ('1:1', 'score_1_1')
                            ]
                        }

                        for api_bet_name, mappings in bet_mappings.items():
                            if api_bet_name in bet_name:
                                for value in values:
                                    odd_value = value.get('value', '').lower().strip()
                                    odd = value.get('odd') or value.get('odds')  # Support both 'odd' and 'odds'
                                    if odd is None:
                                        logger.debug(f"No odd value for {odd_value} in bet '{bet_name}' for fixture {fixture_id}")
                                        continue
                                    try:
                                        odd_decimal = Decimal(str(odd))
                                        if odd_decimal <= 0:
                                            logger.warning(f"Invalid odd value {odd} for {odd_value} in fixture {fixture_id}")
                                            continue
                                        for api_value, model_key in mappings:
                                            if api_value in odd_value:
                                                odds[model_key] = odd_decimal
                                                logger.debug(f"Parsed {model_key} = {odd_decimal} for fixture {fixture_id}")
                                    except (ValueError, TypeError):
                                        logger.warning(f"Invalid odd format for {odd_value} in fixture {fixture_id}: {odd}")
                                        continue
                                break  # Stop if bet type is matched

            if not odds:
                self.stdout.write(self.style.WARNING(f"No valid odds parsed for fixture {fixture_id}"))
                logger.warning(f"No valid odds parsed for fixture {fixture_id}")
            else:
                logger.info(f"Parsed odds for fixture {fixture_id}: {odds}")
            return odds

        except requests.RequestException as e:
            self.stdout.write(self.style.WARNING(f"Failed to fetch odds for fixture {fixture_id}: {e}"))
            logger.warning(f"Failed to fetch odds for fixture {fixture_id}: {e}")
            return {}

    def map_api_status(self, api_status):
        status_map = {
            'TBD': 'upcoming',
            'NS': 'upcoming',
            '1H': 'first_half',
            'HT': 'halftime',
            '2H': 'second_half',
            'FT': 'fulltime',
            'AET': 'fulltime',
            'PEN': 'fulltime',
            'CANC': 'fulltime',
            'PST': 'upcoming',
        }
        return status_map.get(api_status, 'upcoming')

    def resolve_bets(self, match):
        try:
            selections = BetSelection.objects.filter(match=match, is_correct__isnull=True)
            for sel in selections:
                result = None
                if sel.selected_option in ['home_win', 'home_or_draw', 'home_or_away', 'ht_ft_home_home', 'score_1_0', 'score_2_1']:
                    result = 'home_win' if match.score_home > match.score_away else None
                elif sel.selected_option in ['away_win', 'draw_or_away', 'home_or_away', 'ht_ft_away_away']:
                    result = 'away_win' if match.score_away > match.score_home else None
                elif sel.selected_option in ['draw', 'home_or_draw', 'draw_or_away', 'ht_ft_draw_draw', 'score_0_0', 'score_1_1']:
                    result = 'draw' if match.score_home == match.score_away else None
                elif sel.selected_option == 'over_2.5':
                    result = 'over_2.5' if (match.score_home + match.score_away) > 2.5 else None
                elif sel.selected_option == 'under_2.5':
                    result = 'under_2.5' if (match.score_home + match.score_away) <= 2.5 else None
                elif sel.selected_option == 'btts_yes':
                    result = 'btts_yes' if match.score_home > 0 and match.score_away > 0 else None
                elif sel.selected_option == 'btts_no':
                    result = 'btts_no' if match.score_home == 0 or match.score_away == 0 else None

                sel.is_correct = (sel.selected_option == result)
                sel.save()
                logger.info(f"Resolved selection for match {match.api_match_id}: {sel.selected_option} -> {sel.is_correct}")

            for bet in Bet.objects.filter(status='pending'):
                selections = bet.selections.all()
                if all(s.is_correct is not None for s in selections):
                    if all(s.is_correct for s in selections):
                        bet.status = 'won'
                    else:
                        bet.status = 'lost'
                    bet.save()
                    logger.info(f"Resolved bet {bet.id}: {bet.status}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error resolving bets for match {match.api_match_id}: {e}"))
            logger.error(f"Error resolving bets for match {match.api_match_id}: {e}")
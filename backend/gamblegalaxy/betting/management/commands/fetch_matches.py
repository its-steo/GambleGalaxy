from django.core.management.base import BaseCommand
from django.utils import timezone
import requests
from datetime import datetime
import pytz
from django.conf import settings
from betting.models import Match, BetSelection, Bet
from decimal import Decimal
import time

class Command(BaseCommand):
    help = "Fetches match data from Football API for the 2025-2026 season and updates matches in the database"

    def handle(self, *args, **kwargs):
        API_KEY = getattr(settings, 'FOOTBALL_API_KEY', None)
        if not API_KEY:
            self.stdout.write(self.style.ERROR("FOOTBALL_API_KEY is not set in settings.py"))
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
                return
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Status check failed: {e}"))
            if hasattr(e, 'response') and e.response:
                self.stdout.write(self.style.ERROR(f"Status response details: {e.response.text}"))
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
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Failed to fetch seasons: {e}"))
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
                    if 'plan' in data.get('errors', {}):
                        self.stdout.write(self.style.ERROR(f"Free plan does not support season {season} for {league_name}. Try seasons 2021-2023 or upgrade plan."))
                    continue
            except requests.RequestException as e:
                self.stdout.write(self.style.ERROR(f"Failed to fetch fixtures for {league_name}: {e}"))
                continue

            if not data.get('response'):
                self.stdout.write(self.style.WARNING(f"No matches found for {league_name}"))
                continue

            matches_fetched = True
            for fixture in data['response']:
                self.process_fixture(fixture)

        if matches_fetched:
            self.stdout.write(self.style.SUCCESS("✅ Matches fetched and updated successfully!"))
        else:
            self.stdout.write(self.style.WARNING("No matches were fetched. Check season availability or upgrade API plan."))

    def process_fixture(self, fixture):
        home_team = fixture['teams']['home']['name']
        away_team = fixture['teams']['away']['name']
        match_time = datetime.strptime(fixture['fixture']['date'], '%Y-%m-%dT%H:%M:%S%z')
        api_match_id = str(fixture['fixture']['id'])
        status = self.map_api_status(fixture['fixture']['status']['short'])

        odds = self.fetch_odds(fixture['fixture']['id'])

        defaults = {
            'status': status,
            'score_home': fixture['goals']['home'] or 0,
            'score_away': fixture['goals']['away'] or 0,
            'odds_home_win': odds.get('home_win', None),
            'odds_draw': odds.get('draw', None),
            'odds_away_win': odds.get('away_win', None),
            'odds_over_2_5': odds.get('over_2.5', None),
            'odds_under_2_5': odds.get('under_2.5', None),
            'odds_btts_yes': odds.get('btts_yes', None),
            'odds_btts_no': odds.get('btts_no', None),
            'odds_home_or_draw': odds.get('home_or_draw', None),
            'odds_draw_or_away': odds.get('draw_or_away', None),
            'odds_home_or_away': odds.get('home_or_away', None),
            'odds_ht_ft_home_home': odds.get('ht_ft_home_home', None),
            'odds_ht_ft_draw_draw': odds.get('ht_ft_draw_draw', None),
            'odds_ht_ft_away_away': odds.get('ht_ft_away_away', None),
            'odds_score_1_0': odds.get('score_1_0', None),
            'odds_score_2_1': odds.get('score_2_1', None),
            'odds_score_0_0': odds.get('score_0_0', None),
            'odds_score_1_1': odds.get('score_1_1', None),
        }

        match, created = Match.objects.update_or_create(
            api_match_id=api_match_id,
            defaults={
                'home_team': home_team,
                'away_team': away_team,
                'match_time': match_time,
                **defaults
            }
        )

        if created:
            self.stdout.write(f"🆕 Created match: {match}")
        else:
            self.stdout.write(f"🔄 Updated match: {match}")

        if status == 'fulltime':
            self.stdout.write(f"Resolving bets for {match}")
            self.resolve_bets(match)

    def fetch_odds(self, fixture_id):
        API_KEY = getattr(settings, 'FOOTBALL_API_KEY', None)
        API_BASE_URL = 'https://v3.football.api-sports.io'
        headers = {
            'x-apisports-key': API_KEY.strip() if API_KEY else ''
        }

        try:
            time.sleep(6)  # Respect 10 requests/minute limit
            response = requests.get(
                f'{API_BASE_URL}/odds',
                headers=headers,
                params={'fixture': fixture_id}
            )
            response.raise_for_status()
            odds_data = response.json()
            self.stdout.write(f"Odds response for fixture {fixture_id}: results={odds_data.get('results', 0)}")
            if odds_data.get('errors'):
                self.stdout.write(self.style.WARNING(f"API error for odds {fixture_id}: {odds_data['errors']}"))
                return {}
            odds = {}
            for bookmaker in odds_data.get('response', []):
                for bet in bookmaker.get('bets', []):
                    if bet['name'] == 'Match Winner':
                        for value in bet['values']:
                            if value['value'] == 'Home':
                                odds['home_win'] = Decimal(value['odd'])
                            elif value['value'] == 'Draw':
                                odds['draw'] = Decimal(value['odd'])
                            elif value['value'] == 'Away':
                                odds['away_win'] = Decimal(value['odd'])
                    elif bet['name'] == 'Over/Under':
                        for value in bet['values']:
                            if value['value'] == 'Over 2.5':
                                odds['over_2.5'] = Decimal(value['odd'])
                            elif value['value'] == 'Under 2.5':
                                odds['under_2.5'] = Decimal(value['odd'])
                    elif bet['name'] == 'Both Teams to Score':
                        for value in bet['values']:
                            if value['value'] == 'Yes':
                                odds['btts_yes'] = Decimal(value['odd'])
                            elif value['value'] == 'No':
                                odds['btts_no'] = Decimal(value['odd'])
                    elif bet['name'] == 'Double Chance':
                        for value in bet['values']:
                            if value['value'] == 'Home or Draw':
                                odds['home_or_draw'] = Decimal(value['odd'])
                            elif value['value'] == 'Draw or Away':
                                odds['draw_or_away'] = Decimal(value['odd'])
                            elif value['value'] == 'Home or Away':
                                odds['home_or_away'] = Decimal(value['odd'])
                    elif bet['name'] == 'Half Time/Full Time':
                        for value in bet['values']:
                            if value['value'] == 'Home/Home':
                                odds['ht_ft_home_home'] = Decimal(value['odd'])
                            elif value['value'] == 'Draw/Draw':
                                odds['ht_ft_draw_draw'] = Decimal(value['odd'])
                            elif value['value'] == 'Away/Away':
                                odds['ht_ft_away_away'] = Decimal(value['odd'])
                    elif bet['name'] == 'Correct Score':
                        for value in bet['values']:
                            if value['value'] == '1:0':
                                odds['score_1_0'] = Decimal(value['odd'])
                            elif value['value'] == '2:1':
                                odds['score_2_1'] = Decimal(value['odd'])
                            elif value['value'] == '0:0':
                                odds['score_0_0'] = Decimal(value['odd'])
                            elif value['value'] == '1:1':
                                odds['score_1_1'] = Decimal(value['odd'])
            return odds
        except requests.RequestException as e:
            self.stdout.write(self.style.WARNING(f"Failed to fetch odds for fixture {fixture_id}: {e}"))
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

        for bet in Bet.objects.filter(status='pending'):
            selections = bet.selections.all()
            if all(s.is_correct is not None for s in selections):
                if all(s.is_correct for s in selections):
                    bet.status = 'won'
                else:
                    bet.status = 'lost'
                bet.save()
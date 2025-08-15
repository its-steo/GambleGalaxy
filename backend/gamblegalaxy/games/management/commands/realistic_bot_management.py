from django.core.management.base import BaseCommand
from django.utils import timezone
from games.models import AviatorBet, AviatorRound
from wallet.models import Wallet, Transaction
from django.contrib.auth import get_user_model
import random
import time
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal
from .enhanced_bot_simulation import EnhancedBotSimulation

User = get_user_model()

class Command(BaseCommand):
    help = 'Enhanced realistic bot simulation - indistinguishable from real users'

    def __init__(self):
        super().__init__()
        self.bot_sim = EnhancedBotSimulation()
        self.bot_personalities = {}
        self.bot_sessions = {}

    def create_realistic_bots(self, target=30):
        """Create bots with realistic names and personalities"""
        existing_bots = User.objects.filter(is_bot=True).count()
        bots_to_create = max(0, target - existing_bots)

        for _ in range(bots_to_create):
            username = self.bot_sim.create_realistic_bot_name()
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                password='botpassword',
                is_bot=True
            )

            personality = self.bot_sim.assign_bot_personality()
            self.bot_personalities[user.id] = personality
            self.bot_sessions[user.id] = self.bot_sim.get_session_behavior()

            balance_ranges = {
                'conservative': (10000, 30000),  # Increased for testing
                'moderate': (20000, 50000),
                'aggressive': (30000, 80000),
                'high_roller': (50000, 200000)
            }
            min_bal, max_bal = balance_ranges[personality]
            starting_balance = random.randint(min_bal, max_bal)

            wallet, created = Wallet.objects.get_or_create(
                user=user,
                defaults={'balance': Decimal(str(starting_balance))}
            )
            if not created and wallet.balance < 1000:
                wallet.balance = Decimal(str(starting_balance))
                wallet.save()

            print(f"[REALISTIC BOT] {username} ({personality}) - Balance: KES {wallet.balance}")

    def place_realistic_bot_bet(self, bot, active_round, channel_layer):
        """Place realistic bot bet with human-like behavior"""
        try:
            personality = self.bot_personalities.get(bot.id, 'moderate')
            bot_wallet = Wallet.objects.get(user=bot)
            amount = self.bot_sim.get_realistic_bet_amount(personality, float(bot_wallet.balance))

            if bot_wallet.balance < Decimal(str(amount)):
                print(f"[BET SKIPPED] {bot.username} insufficient balance: KES {bot_wallet.balance}")
                return False

            auto_cashout = None
            if self.bot_sim.should_use_auto_cashout(personality):
                auto_cashout = self.bot_sim.get_auto_cashout_multiplier(personality)

            time.sleep(self.bot_sim.simulate_human_delay())

            bot_wallet.balance -= Decimal(str(amount))
            bot_wallet.save()

            Transaction.objects.create(
                user=bot,
                amount=-Decimal(str(amount)),
                transaction_type='withdraw',
                description='Aviator bet'
            )

            bet = AviatorBet.objects.create(
                user=bot,
                round=active_round,
                amount=amount,
                auto_cashout=auto_cashout
            )

            async_to_sync(channel_layer.group_send)(
                'aviator_room',
                {
                    'type': 'send_to_group',
                    'type_override': 'bot_bet',
                    'username': bot.username,
                    'amount': float(amount),
                    'auto_cashout': float(auto_cashout) if auto_cashout else None,
                    'round_id': active_round.id,
                    'is_bot': True,
                    'timestamp': int(time.time() * 1000),
                    'user_id': bot.id
                }
            )

            print(f"[REALISTIC BET] {bot.username} ({personality}) - KES {amount} (Auto: {auto_cashout or 'Manual'})")
            return True

        except Exception as e:
            print(f"❌ Error placing bot bet for {bot.username}: {e}")
            return False

    def handle_realistic_bot_cashouts(self, round_obj, current_multiplier, channel_layer):
        """Handle bot cashouts with human-like timing"""
        bets = AviatorBet.objects.filter(round=round_obj, cash_out_multiplier__isnull=True)

        for bet in bets:
            if not bet.user.is_bot:
                continue
            personality = self.bot_personalities.get(bet.user.id, 'moderate')

            if bet.auto_cashout and current_multiplier >= bet.auto_cashout:
                self.process_realistic_cashout(bet, bet.auto_cashout, round_obj, "auto", channel_layer)
                continue

            if not bet.auto_cashout:
                cashout_prob = self.bot_sim.calculate_human_like_cashout_probability(current_multiplier, personality)
                if random.random() < cashout_prob:
                    delay = self.bot_sim.simulate_human_delay()
                    time.sleep(min(delay, 0.5))
                    cashout_multiplier = round(current_multiplier, 2)
                    self.process_realistic_cashout(bet, cashout_multiplier, round_obj, "manual", channel_layer)

    def process_realistic_cashout(self, bet, cashout_multiplier, round_obj, cashout_type, channel_layer):
        """Process cashout with realistic behavior"""
        try:
            bet.cash_out_multiplier = cashout_multiplier
            bet.final_multiplier = round_obj.crash_multiplier
            bet.is_winner = cashout_multiplier < round_obj.crash_multiplier
            bet.save()

            win_amount = bet.amount * Decimal(str(cashout_multiplier))

            wallet = Wallet.objects.get(user=bet.user)
            wallet.balance += win_amount
            wallet.save()

            Transaction.objects.create(
                user=bet.user,
                amount=win_amount,
                transaction_type='winning',
                description=f'Aviator win at {cashout_multiplier}x'
            )

            async_to_sync(channel_layer.group_send)(
                'aviator_room',
                {
                    'type': 'send_to_group',
                    'type_override': 'bot_cashout',
                    'username': bet.user.username,
                    'multiplier': float(cashout_multiplier),
                    'amount': float(bet.amount),
                    'win_amount': float(win_amount),
                    'is_bot': True,
                    'cashout_type': cashout_type,
                    'timestamp': int(time.time() * 1000),
                    'user_id': bet.user.id
                }
            )

            personality = self.bot_personalities.get(bet.user.id, 'unknown')
            print(f"[REALISTIC CASHOUT] {bet.user.username} ({personality}) - {cashout_multiplier}x = KES {win_amount}")

        except Exception as e:
            print(f"❌ Error processing cashout for {bet.user.username}: {e}")

    def simulate_realistic_round(self, round_obj, channel_layer):
        """Simulate round with realistic multiplier growth and cashouts"""
        multiplier = 1.00
        step = 0.01
        start_time = timezone.now()

        async_to_sync(channel_layer.group_send)(
            'aviator_room',
            {
                'type': 'send_to_group',
                'type_override': 'round_started',
                'round_id': round_obj.id,
                'multiplier': multiplier,
                'crash_multiplier': float(round_obj.crash_multiplier),
                'server_time': int(timezone.now().timestamp() * 1000)
            }
        )

        while round_obj.is_active:
            time.sleep(random.uniform(0.15, 0.25))
            multiplier = round(multiplier + step, 2)
            elapsed_time = (timezone.now() - start_time).total_seconds()

            async_to_sync(channel_layer.group_send)(
                'aviator_room',
                {
                    'type': 'send_to_group',
                    'type_override': 'multiplier',
                    'multiplier': multiplier,
                    'server_time': int(timezone.now().timestamp() * 1000)
                }
            )

            self.handle_realistic_bot_cashouts(round_obj, multiplier, channel_layer)

            if multiplier >= round_obj.crash_multiplier or elapsed_time > 30:
                round_obj.is_active = False
                round_obj.ended_at = timezone.now()
                round_obj.save()
                async_to_sync(channel_layer.group_send)(
                    'aviator_room',
                    {
                        'type': 'send_to_group',
                        'type_override': 'crash',
                        'multiplier': float(round_obj.crash_multiplier),
                        'crashed': True,
                        'final': True,
                        'server_time': int(timezone.now().timestamp() * 1000)
                    }
                )
                print(f"[ROUND END] Crashed at {round_obj.crash_multiplier}x after {elapsed_time:.1f}s")
                break

    def handle(self, *args, **kwargs):
        print("🎭 Starting REALISTIC bot simulation - indistinguishable from real users")
        self.create_realistic_bots(target=30)
        channel_layer = get_channel_layer()

        while True:
            try:
                # Wait for betting phase from AviatorConsumer
                active_round = AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()
                if not active_round:
                    print("[WAITING] No active round, waiting for AviatorConsumer to start one...")
                    time.sleep(2)
                    continue

                print(f"[ROUND DETECTED] Round {active_round.id} active with crash at {active_round.crash_multiplier}x")

                bots = User.objects.filter(is_bot=True)
                available_bots = [bot for bot in bots if not AviatorBet.objects.filter(user=bot, round=active_round).exists()]
                if not available_bots:
                    print("[NO BOTS] No available bots to bet in this round")
                    time.sleep(2)
                    continue

                participation_rate = 1.0  # Force participation for testing
                num_bots_to_bet = max(1, int(len(available_bots) * participation_rate))
                selected_bots = random.sample(available_bots, num_bots_to_bet)
                random.shuffle(selected_bots)

                for bot in selected_bots:
                    if self.place_realistic_bot_bet(bot, active_round, channel_layer):
                        time.sleep(random.uniform(0.1, 1.0))

                # Simulate round only if not handled by AviatorConsumer
                if not hasattr(self, 'consumer_game_loop'):
                    self.simulate_realistic_round(active_round, channel_layer)
                else:
                    print("[ROUND SKIPPED] Letting AviatorConsumer handle round simulation")

                print("⏳ Waiting for next round...")
                time.sleep(random.uniform(2, 5))

            except Exception as e:
                print(f"❌ Error in realistic bot simulation: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(5)
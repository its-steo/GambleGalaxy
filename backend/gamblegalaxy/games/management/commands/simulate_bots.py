from django.core.management.base import BaseCommand
from django.utils import timezone
from games.models import AviatorBet, AviatorRound
from wallet.models import Wallet, Transaction
from django.contrib.auth import get_user_model
import random
import time
import string
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Simulate bot players placing bets and cashing out with live activity display'

    def create_random_bot_name(self):
        first_names = ['Speedy', 'Lucky', 'Blazer', 'Flash', 'Jumper', 'Zoomer', 'Racer', 'Turbo', 'Giga', 'Bot', 'Ace', 'Pro', 'Max', 'Neo', 'Jet']
        suffix = ''.join(random.choices(string.digits, k=4))
        return random.choice(first_names) + suffix

    def create_bots_if_needed(self, target=20):  # 🔧 INCREASED: More bots for realistic activity
        existing_bots = User.objects.filter(is_bot=True).count()
        bots_to_create = target - existing_bots

        for _ in range(bots_to_create):
            username = self.create_random_bot_name()
            while User.objects.filter(username=username).exists():
                username = self.create_random_bot_name()

            user = User.objects.create_user(
                username=username,
                password='botpassword',
                is_bot=True
            )
            # 🔧 IMPROVED: Give bots more varied starting balances
            starting_balance = random.choice([10000, 15000, 20000, 25000, 30000, 50000])
            Wallet.objects.get_or_create(user=user, defaults={'balance': starting_balance})
            print(f"[CREATE BOT] {username} with wallet balance {starting_balance}")

    def simulate_multiplier_growth(self, round_obj):
        multiplier = 1.00
        step = 0.01
        channel_layer = get_channel_layer()
        
        while round_obj.is_active:
            time.sleep(0.2)  # Simulate time between multiplier updates
            multiplier += step
            
            # 🔧 IMPROVED: Handle bot cashouts with live activity broadcasting
            self.handle_bot_cashouts(round_obj, multiplier)

            if multiplier >= round_obj.crash_multiplier:
                round_obj.is_active = False
                round_obj.ended_at = timezone.now()
                round_obj.save()
                print(f"[ROUND END] Crashed at {round_obj.crash_multiplier}x")
                
                # 🔧 NEW: Trigger global top winners refresh after round ends
                async_to_sync(channel_layer.group_send)(
                    'aviator_room',
                    {
                        'type': 'send_to_group',
                        'type_override': 'top_winners_updated',
                        'message': 'Round ended, global top winners updated',
                        'trigger_refresh': True
                    }
                )
                break

    def handle_bot_cashouts(self, round_obj, current_multiplier):
        channel_layer = get_channel_layer()
        bets = AviatorBet.objects.filter(round=round_obj, cash_out_multiplier__isnull=True)
        
        significant_wins = []  # Track significant wins for global top winners update
        
        for bet in bets:
            # 🔧 IMPROVED: Auto cashout handling with live broadcasting
            if bet.auto_cashout and current_multiplier >= bet.auto_cashout:
                self.process_bot_cashout(bet, bet.auto_cashout, round_obj, "AUTO", significant_wins)
                
            # 🔧 IMPROVED: Manual cashout with better probability and timing
            elif not bet.auto_cashout:
                # More realistic cashout probability based on multiplier
                cashout_probability = self.calculate_cashout_probability(current_multiplier, bet.user.is_bot)
                
                if random.random() < cashout_probability:
                    cashout_multiplier = round(current_multiplier, 2)
                    self.process_bot_cashout(bet, cashout_multiplier, round_obj, "MANUAL", significant_wins)
        
        # 🔧 NEW: If there were significant wins, trigger global top winners refresh
        if significant_wins:
            print(f"🏆 {len(significant_wins)} significant bot wins detected, triggering global top winners refresh")
            async_to_sync(channel_layer.group_send)(
                'aviator_room',
                {
                    'type': 'send_to_group',
                    'type_override': 'top_winners_updated',
                    'message': 'Significant wins detected',
                    'trigger_refresh': True,
                    'significant_wins': significant_wins
                }
            )

    def calculate_cashout_probability(self, multiplier, is_bot=True):
        """
        Calculate probability of bot cashing out based on current multiplier
        Bots have slightly different behavior than users
        """
        if is_bot:
            # Bots are more conservative and cash out earlier
            if multiplier < 1.3:
                return 0.02  # Very low chance
            elif multiplier < 1.8:
                return 0.08  # Low chance
            elif multiplier < 2.5:
                return 0.20  # Medium chance
            elif multiplier < 4.0:
                return 0.35  # Higher chance
            elif multiplier < 8.0:
                return 0.50  # High chance
            else:
                return 0.70  # Very high chance for big multipliers
        else:
            # Regular probability for users
            if multiplier < 1.5:
                return 0.01
            elif multiplier < 2.0:
                return 0.05
            elif multiplier < 3.0:
                return 0.15
            elif multiplier < 5.0:
                return 0.25
            elif multiplier < 10.0:
                return 0.35
            else:
                return 0.50

    def process_bot_cashout(self, bet, cashout_multiplier, round_obj, cashout_type, significant_wins):
        """
        Process a bot cashout with proper wallet updates, win tracking, and live broadcasting
        """
        channel_layer = get_channel_layer()
        
        # 🔧 CRITICAL: Update bet record properly
        bet.cash_out_multiplier = cashout_multiplier
        bet.final_multiplier = round_obj.crash_multiplier
        bet.is_winner = cashout_multiplier < round_obj.crash_multiplier
        bet.save()
        
        win_amount = bet.win_amount()  # Use model method
        
        # 🔧 IMPROVED: Update bot wallet balance
        try:
            wallet = Wallet.objects.get(user=bet.user)
            wallet.balance += Decimal(str(win_amount))
            wallet.save()
            
            # 🔧 NEW: Create transaction record for bot wins
            Transaction.objects.create(
                user=bet.user,
                amount=Decimal(str(win_amount)),
                transaction_type='winning',
                description=f'Bot Aviator win at {cashout_multiplier}x'
            )
            
            print(f"[{cashout_type} CASHOUT] {bet.user.username} cashed out at {cashout_multiplier}x for KES {win_amount}")
            
            # 🔧 NEW: Track significant wins for global top winners (lowered threshold)
            if win_amount >= 500:  # Lower threshold for more frequent updates
                significant_wins.append({
                    'username': bet.user.username,
                    'win_amount': win_amount,
                    'multiplier': cashout_multiplier,
                    'is_bot': True
                })
            
            # 🔧 IMPROVED: Send WebSocket message with complete data for live activity
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
                    'cashout_type': cashout_type.lower(),
                    'timestamp': int(time.time() * 1000),
                    'user_id': bet.user.id
                }
            )
            
        except Exception as e:
            print(f"❌ Error processing bot cashout for {bet.user.username}: {e}")

    def place_bot_bet(self, bot, active_round, channel_layer):
        """
        Place a bet for a bot with live activity broadcasting
        """
        try:
            # 🔧 IMPROVED: More varied and realistic bet amounts
            bet_amounts = [50, 100, 200, 500, 1000, 1500, 2000, 3000, 5000]
            weights = [25, 20, 15, 15, 10, 5, 5, 3, 2]  # Higher probability for smaller amounts
            amount = random.choices(bet_amounts, weights=weights, k=1)[0]
            
            # 🔧 IMPROVED: More realistic auto cashout behavior
            auto_cashout = None
            if random.random() < 0.65:  # 65% chance of auto cashout
                # More varied auto cashout multipliers with realistic distribution
                auto_multipliers = [1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0, 8.0, 10.0]
                auto_weights = [15, 20, 18, 15, 12, 8, 5, 4, 2, 1]
                auto_cashout = random.choices(auto_multipliers, weights=auto_weights, k=1)[0]

            # 🔧 IMPROVED: Check bot wallet balance
            bot_wallet = Wallet.objects.get(user=bot)
            if bot_wallet.balance >= amount:
                # Deduct bet amount from wallet
                bot_wallet.balance -= Decimal(str(amount))
                bot_wallet.save()
                
                # Create transaction record
                Transaction.objects.create(
                    user=bot,
                    amount=-Decimal(str(amount)),
                    transaction_type='withdraw',
                    description='Bot Aviator bet'
                )
                
                bet = AviatorBet.objects.create(
                    user=bot,
                    round=active_round,
                    amount=amount,
                    auto_cashout=auto_cashout
                )
                
                print(f"[BOT BET] {bot.username} placed KES {amount} bet, auto-cashout at {auto_cashout or 'manual'}")
                
                # 🔧 IMPROVED: Send WebSocket message for live activity display
                async_to_sync(channel_layer.group_send)(
                    'aviator_room',
                    {
                        'type': 'send_to_group',
                        'type_override': 'bot_bet',
                        'username': bot.username,
                        'amount': float(amount),
                        'auto_cashout': auto_cashout,
                        'round_id': active_round.id,
                        'is_bot': True,
                        'timestamp': int(time.time() * 1000),
                        'user_id': bot.id
                    }
                )
                
                return True
            else:
                print(f"[BOT] {bot.username} has insufficient balance: {bot_wallet.balance}")
                return False
                
        except Exception as e:
            print(f"❌ Error placing bot bet for {bot.username}: {e}")
            return False

    def handle(self, *args, **kwargs):
        print("🤖 Starting enhanced bot simulation with live activity...")
        self.create_bots_if_needed(target=20)  # Create more bots for realistic activity
        channel_layer = get_channel_layer()

        while True:
            try:
                bots = User.objects.filter(is_bot=True)
                active_round = AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()

                if not active_round:
                    print("No active round. Waiting...")
                    time.sleep(2)
                    continue

                # 🔧 IMPROVED: Staggered bot betting for more realistic activity
                available_bots = []
                for bot in bots:
                    if not AviatorBet.objects.filter(user=bot, round=active_round).exists():
                        available_bots.append(bot)

                # 🔧 NEW: Randomly select bots to bet (not all at once)
                if available_bots:
                    # Bet with 60-80% of available bots
                    num_bots_to_bet = random.randint(
                        int(len(available_bots) * 0.6), 
                        int(len(available_bots) * 0.8)
                    )
                    
                    selected_bots = random.sample(available_bots, min(num_bots_to_bet, len(available_bots)))
                    
                    for bot in selected_bots:
                        # 🔧 NEW: Add small random delays between bot bets for realism
                        if random.random() < 0.85:  # 85% chance each bot will bet
                            self.place_bot_bet(bot, active_round, channel_layer)
                            
                            # Small delay between bets for realism
                            time.sleep(random.uniform(0.1, 0.5))

                # 🔧 IMPROVED: Simulate the round with better tracking
                self.simulate_multiplier_growth(active_round)

                print("Waiting for next round...")
                time.sleep(3)
                
            except Exception as e:
                print(f"❌ Error in bot simulation: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(5)

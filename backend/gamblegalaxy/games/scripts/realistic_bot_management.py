"""
Enhanced Django management command for realistic bot simulation
Replace your existing command.py with this enhanced version
"""

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
    help = 'Enhanced realistic bot simulation - indistinguishable from real users'

    def __init__(self):
        super().__init__()
        from .enhanced_bot_simulation import EnhancedBotSimulation
        self.bot_sim = EnhancedBotSimulation()
        self.bot_personalities = {}  # Store bot personalities
        self.bot_sessions = {}  # Track bot session behavior

    def create_realistic_bots(self, target=30):
        """Create bots with realistic names and personalities"""
        existing_bots = User.objects.filter(is_bot=True).count()
        bots_to_create = target - existing_bots

        for _ in range(bots_to_create):
            username = self.bot_sim.create_realistic_bot_name()
            
            # Ensure unique username
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1

            # Create bot user
            user = User.objects.create_user(
                username=username,
                password='botpassword',
                is_bot=True
            )
            
            # Assign personality and session behavior
            personality = self.bot_sim.assign_bot_personality()
            self.bot_personalities[user.id] = personality
            self.bot_sessions[user.id] = self.bot_sim.get_session_behavior()
            
            # Create realistic starting balance based on personality
            balance_ranges = {
                'conservative': (5000, 15000),
                'moderate': (10000, 25000),
                'aggressive': (15000, 40000),
                'high_roller': (25000, 100000)
            }
            
            min_bal, max_bal = balance_ranges[personality]
            starting_balance = random.randint(min_bal, max_bal)
            
            Wallet.objects.get_or_create(
                user=user, 
                defaults={'balance': starting_balance}
            )
            
            print(f"[REALISTIC BOT] {username} ({personality}) - Balance: KES {starting_balance}")

    def place_realistic_bot_bet(self, bot, active_round, channel_layer):
        """Place realistic bot bet with human-like behavior"""
        try:
            # Get bot's personality
            personality = self.bot_personalities.get(bot.id, 'moderate')
            
            # Check if bot should participate this round
            if not self.bot_sim.should_bot_participate_this_round():
                return False
            
            # Get bot wallet
            bot_wallet = Wallet.objects.get(user=bot)
            
            # Get realistic bet amount
            amount = self.bot_sim.get_realistic_bet_amount(personality, float(bot_wallet.balance))
            
            if bot_wallet.balance < amount:
                return False
            
            # Determine auto cashout
            auto_cashout = None
            if self.bot_sim.should_use_auto_cashout(personality):
                auto_cashout = self.bot_sim.get_auto_cashout_multiplier(personality)
            
            # Add human-like delay
            delay = self.bot_sim.simulate_human_delay()
            time.sleep(delay)
            
            # Process bet
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
            
            # Send realistic WebSocket message
            async_to_sync(channel_layer.group_send)(
                'aviator_room',
                {
                    'type': 'send_to_group',
                    'type_override': 'bot_bet',
                    'username': bot.username,
                    'amount': float(amount),
                    'auto_cashout': auto_cashout,
                    'round_id': active_round.id,
                    'is_bot': False,  # Hide bot status
                    'timestamp': int(time.time() * 1000),
                    'user_id': bot.id,
                    'personality': personality  # For backend tracking only
                }
            )
            
            print(f"[REALISTIC BET] {bot.username} ({personality}) - KES {amount} (Auto: {auto_cashout or 'Manual'})")
            return True
            
        except Exception as e:
            print(f"❌ Error placing realistic bot bet: {e}")
            return False

    def handle_realistic_bot_cashouts(self, round_obj, current_multiplier):
        """Handle bot cashouts with human-like timing"""
        channel_layer = get_channel_layer()
        bets = AviatorBet.objects.filter(round=round_obj, cash_out_multiplier__isnull=True)
        
        for bet in bets:
            if not bet.user.is_bot:
                continue
                
            personality = self.bot_personalities.get(bet.user.id, 'moderate')
            
            # Auto cashout handling
            if bet.auto_cashout and current_multiplier >= bet.auto_cashout:
                self.process_realistic_cashout(bet, bet.auto_cashout, round_obj, "auto")
                continue
            
            # Manual cashout with human-like probability
            if not bet.auto_cashout:
                cashout_prob = self.bot_sim.calculate_human_like_cashout_probability(
                    current_multiplier, personality
                )
                
                if random.random() < cashout_prob:
                    # Add slight delay for realism
                    delay = self.bot_sim.simulate_human_delay()
                    if delay > 0.1:  # Only delay if significant
                        time.sleep(min(delay, 0.5))  # Cap delay during active round
                    
                    cashout_multiplier = round(current_multiplier, 2)
                    self.process_realistic_cashout(bet, cashout_multiplier, round_obj, "manual")

    def process_realistic_cashout(self, bet, cashout_multiplier, round_obj, cashout_type):
        """Process cashout with realistic behavior"""
        channel_layer = get_channel_layer()
        
        try:
            # Update bet
            bet.cash_out_multiplier = cashout_multiplier
            bet.final_multiplier = round_obj.crash_multiplier
            bet.is_winner = cashout_multiplier < round_obj.crash_multiplier
            bet.save()
            
            win_amount = bet.win_amount()
            
            # Update wallet
            wallet = Wallet.objects.get(user=bet.user)
            wallet.balance += Decimal(str(win_amount))
            wallet.save()
            
            # Create transaction
            Transaction.objects.create(
                user=bet.user,
                amount=Decimal(str(win_amount)),
                transaction_type='winning',
                description=f'Aviator win at {cashout_multiplier}x'
            )
            
            # Send WebSocket message (hide bot status)
            async_to_sync(channel_layer.group_send)(
                'aviator_room',
                {
                    'type': 'send_to_group',
                    'type_override': 'bot_cashout',
                    'username': bet.user.username,
                    'multiplier': float(cashout_multiplier),
                    'amount': float(bet.amount),
                    'win_amount': float(win_amount),
                    'is_bot': False,  # Hide bot status from frontend
                    'cashout_type': cashout_type,
                    'timestamp': int(time.time() * 1000),
                    'user_id': bet.user.id
                }
            )
            
            personality = self.bot_personalities.get(bet.user.id, 'unknown')
            print(f"[REALISTIC CASHOUT] {bet.user.username} ({personality}) - {cashout_multiplier}x = KES {win_amount}")
            
        except Exception as e:
            print(f"❌ Error processing realistic cashout: {e}")

    def handle(self, *args, **kwargs):
        print("🎭 Starting REALISTIC bot simulation - indistinguishable from real users")
        self.create_realistic_bots(target=30)
        channel_layer = get_channel_layer()

        while True:
            try:
                bots = User.objects.filter(is_bot=True)
                active_round = AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()

                if not active_round:
                    print("No active round. Waiting...")
                    time.sleep(2)
                    continue

                # Get available bots for this round
                available_bots = []
                for bot in bots:
                    if not AviatorBet.objects.filter(user=bot, round=active_round).exists():
                        available_bots.append(bot)

                # Realistic bot participation
                if available_bots:
                    # Stagger bot entries realistically
                    participation_rate = random.uniform(0.60, 0.80)
                    num_bots_to_bet = int(len(available_bots) * participation_rate)
                    
                    selected_bots = random.sample(available_bots, min(num_bots_to_bet, len(available_bots)))
                    
                    # Shuffle for random order
                    random.shuffle(selected_bots)
                    
                    for bot in selected_bots:
                        if self.place_realistic_bot_bet(bot, active_round, channel_layer):
                            # Random delay between bot bets (0.1 to 2 seconds)
                            delay = random.uniform(0.1, 2.0)
                            time.sleep(delay)

                # Simulate round with realistic cashouts
                self.simulate_realistic_round(active_round)
                
                print("⏳ Waiting for next round...")
                time.sleep(random.uniform(2, 5))  # Variable wait time
                
            except Exception as e:
                print(f"❌ Error in realistic bot simulation: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(5)

    def simulate_realistic_round(self, round_obj):
        """Simulate round with realistic multiplier growth and cashouts"""
        multiplier = 1.00
        step = 0.01
        
        while round_obj.is_active:
            time.sleep(random.uniform(0.15, 0.25))  # Slightly variable timing
            multiplier += step
            
            # Handle realistic bot cashouts
            self.handle_realistic_bot_cashouts(round_obj, multiplier)
            
            if multiplier >= round_obj.crash_multiplier:
                round_obj.is_active = False
                round_obj.ended_at = timezone.now()
                round_obj.save()
                print(f"[ROUND END] Crashed at {round_obj.crash_multiplier}x")
                break

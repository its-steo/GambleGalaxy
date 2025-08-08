from django.core.management.base import BaseCommand
from django.utils import timezone
from games.models import AviatorBet, AviatorRound
from wallet.models import Wallet
from django.contrib.auth import get_user_model
import random
import time
import string
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

class Command(BaseCommand):
    help = 'Simulate bot players placing bets and cashing out'

    def create_random_bot_name(self):
        first_names = ['Speedy', 'Lucky', 'Blazer', 'Flash', 'Jumper', 'Zoomer', 'Racer', 'Turbo', 'Giga', 'Bot']
        suffix = ''.join(random.choices(string.digits, k=4))
        return random.choice(first_names) + suffix

    def create_bots_if_needed(self, target=10):
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
            Wallet.objects.get_or_create(user=user, defaults={'balance': 10000})
            print(f"[CREATE BOT] {username} with wallet balance 10000")

    def simulate_multiplier_growth(self, round_obj):
        multiplier = 1.00
        step = 0.01
        while round_obj.is_active:
            time.sleep(0.2)  # Simulate time between multiplier updates
            multiplier += step
            self.handle_bot_cashouts(round_obj, multiplier)

            if multiplier >= round_obj.crash_multiplier:
                round_obj.is_active = False
                round_obj.ended_at = timezone.now()
                round_obj.save()
                print(f"[ROUND END] Crashed at {round_obj.crash_multiplier}x")
                break

    def handle_bot_cashouts(self, round_obj, current_multiplier):
        channel_layer = get_channel_layer()
        bets = AviatorBet.objects.filter(round=round_obj, cash_out_multiplier__isnull=True)
        for bet in bets:
            if bet.auto_cashout and current_multiplier >= bet.auto_cashout:
                bet.cash_out_multiplier = bet.auto_cashout
                bet.final_multiplier = round_obj.crash_multiplier
                bet.is_winner = bet.cash_out_multiplier < round_obj.crash_multiplier
                bet.save()
                win_amount = bet.win_amount()
                print(f"[AUTO CASHOUT] {bet.user.username} auto-cashed out at {bet.cash_out_multiplier}x")
                async_to_sync(channel_layer.group_send)(
                    'aviator_room',
                    {
                        'type': 'send_to_group',
                        'type_override': 'bot_cashout',
                        'username': bet.user.username,
                        'multiplier': float(bet.cash_out_multiplier),
                        'amount': float(bet.amount),
                        'win_amount': float(win_amount)
                    }
                )
            elif not bet.auto_cashout:
                if random.random() < 0.05 * current_multiplier:
                    cashout_multiplier = round(current_multiplier, 2)
                    bet.cash_out_multiplier = cashout_multiplier
                    bet.final_multiplier = round_obj.crash_multiplier
                    bet.is_winner = cashout_multiplier < round_obj.crash_multiplier
                    bet.save()
                    win_amount = bet.win_amount()
                    print(f"[MANUAL CASHOUT] {bet.user.username} cashed out at {cashout_multiplier}x")
                    async_to_sync(channel_layer.group_send)(
                        'aviator_room',
                        {
                            'type': 'send_to_group',
                            'type_override': 'bot_cashout',
                            'username': bet.user.username,
                            'multiplier': float(cashout_multiplier),
                            'amount': float(bet.amount),
                            'win_amount': float(win_amount)
                        }
                    )

    def handle(self, *args, **kwargs):
        self.create_bots_if_needed(target=10)
        channel_layer = get_channel_layer()

        while True:
            bots = User.objects.filter(is_bot=True)
            active_round = AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()

            if not active_round:
                print("No active round. Waiting...")
                time.sleep(2)
                continue

            for bot in bots:
                if not AviatorBet.objects.filter(user=bot, round=active_round).exists():
                    if random.random() < 0.5:
                        amount = random.choice([10, 20, 50])
                        auto_cashout = None if random.random() < 0.5 else round(random.uniform(1.5, 2.5), 2)

                        bet = AviatorBet.objects.create(
                            user=bot,
                            round=active_round,
                            amount=amount,
                            auto_cashout=auto_cashout
                        )
                        print(f"[BOT BET] {bot.username} placed {amount} bet, cashout at {auto_cashout or 'manual'}")
                        async_to_sync(channel_layer.group_send)(
                            'aviator_room',
                            {
                                'type': 'send_to_group',
                                'type_override': 'bot_bet',
                                'username': bot.username,
                                'amount': float(amount),
                                'auto_cashout': auto_cashout,
                                'round_id': active_round.id
                            }
                        )

            self.simulate_multiplier_growth(active_round)

            print("Waiting for next round...")
            time.sleep(3)
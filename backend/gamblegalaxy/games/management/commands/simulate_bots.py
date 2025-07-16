from django.core.management.base import BaseCommand
from django.utils import timezone
from games.models import AviatorBet, AviatorRound
from django.contrib.auth import get_user_model
import random
import time

User = get_user_model()

class Command(BaseCommand):
    help = 'Simulate bot players placing bets and cashing out'

    def handle(self, *args, **kwargs):
        while True:
            bots = User.objects.filter(is_bot=True)
            active_round = AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()

            if not active_round:
                print("No active round. Waiting...")
                time.sleep(2)
                continue

            for bot in bots:
                if random.random() < 0.5:
                    amount = random.choice([10, 20, 50])
                    # 50% chance to choose auto-cashout or go manual
                    auto_cashout = None if random.random() < 0.5 else round(random.uniform(1.5, 2.5), 2)
            
                    AviatorBet.objects.create(
                        user=bot,
                        round=active_round,
                        amount=amount,
                        auto_cashout=auto_cashout
                    )
                    print(f"[BOT] {bot.username} placed {amount} bet, cashout at {auto_cashout or 'manual'}")
            
            time.sleep(5)

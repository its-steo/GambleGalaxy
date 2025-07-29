import asyncio
import json
import random
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
from django.utils import timezone
from .models import AviatorRound, AviatorBet, SureOdd, CrashMultiplierSetting
from wallet.models import Wallet, Transaction

class AviatorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.room_group_name = 'aviator_room'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        if not hasattr(self.channel_layer, 'aviator_task'):
            self.channel_layer.aviator_task = asyncio.create_task(self.run_aviator_game())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "place_bet":
            await self.place_bet(data)
        elif action == "cashout":
            await self.cashout_bet(data)

    async def send_to_group(self, event):
        if "type_override" in event:
            event["type"] = event.pop("type_override")
        await self.send(text_data=json.dumps(event))

    async def run_aviator_game(self):
        while True:
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'send_to_group',
                'type_override': 'betting_open',
                'message': 'Place your bets now!',
                'countdown': 5
            })
            await asyncio.sleep(5)

            crash_multiplier = await self.generate_crash_multiplier()
            aviator_round = await database_sync_to_async(AviatorRound.objects.create)(
                crash_multiplier=crash_multiplier
            )

            multiplier = 1.00
            delay = 0.1

            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'send_to_group',
                'type_override': 'round_started',
                'multiplier': multiplier,
                'round_id': aviator_round.id,
            })

            while multiplier < crash_multiplier:
                await asyncio.sleep(delay)
                step = 0.05 if multiplier < 2 else 0.08 if multiplier < 5 else 0.12 if multiplier < 20 else 0.2
                delay = 0.1 if multiplier < 2 else 0.08 if multiplier < 5 else 0.06 if multiplier < 20 else 0.04
                multiplier = round(multiplier + step * random.uniform(0.95, 1.05), 2)

                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'send_to_group',
                    'type_override': 'multiplier',
                    'multiplier': multiplier,
                    'round_id': aviator_round.id,
                })

                await self.auto_cashout(multiplier, aviator_round)

            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'send_to_group',
                'type_override': 'crash',
                'multiplier': crash_multiplier,
                'round_id': aviator_round.id,
            })

            await self.end_round(aviator_round.id)

            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'send_to_group',
                'type_override': 'round_summary',
                'crash_multiplier': crash_multiplier,
                'message': 'Round complete. Preparing next...',
            })

            await asyncio.sleep(3)

    async def place_bet(self, data):
        user = self.scope["user"]
        round_id = data.get("round_id")
        amount = float(data.get("amount", 0))

        if amount <= 0:
            await self.send(json.dumps({"error": "Invalid amount."}))
            return

        try:
            aviator_round = await self.get_round(round_id)
        except AviatorRound.DoesNotExist:
            await self.send(json.dumps({"error": "Invalid round."}))
            return

        if not aviator_round.is_active:
            await self.send(json.dumps({"error": "Round is not active."}))
            return

        if await self.get_existing_bet(user, aviator_round):
            await self.send(json.dumps({"error": "You already placed a bet in this round."}))
            return

        success, wallet = await self.withdraw_wallet(user, amount)
        if not success:
            await self.send(json.dumps({"error": "Insufficient balance."}))
            return

        bet = await database_sync_to_async(AviatorBet.objects.create)(
            user=user,
            round=aviator_round,
            amount=amount,
            auto_cashout=data.get("auto_cashout")
        )

        await database_sync_to_async(Transaction.objects.create)(
            wallet=wallet,
            amount=-amount,
            transaction_type='bet',
            description='Placed bet on Aviator'
        )

        await self.send(json.dumps({
            "type": "bet_placed",
            "message": "Bet placed successfully",
            "round_id": round_id,
            "amount": amount,
            "bet_id": bet.id,
            "new_balance": wallet.balance  
        }))


    async def cashout_bet(self, data):
        user = self.scope["user"]
        bet_id = data.get("bet_id")
        multiplier = float(data.get("multiplier", 0))

        try:
            bet = await self.get_bet(bet_id)
        except AviatorBet.DoesNotExist:
            await self.send(json.dumps({"error": "Bet not found."}))
            return

        if bet.cash_out_multiplier is not None:
            await self.send(json.dumps({"error": "Already cashed out."}))
            return

        if multiplier >= bet.round.crash_multiplier:
            await self.send(json.dumps({"error": "Too late, crashed!"}))
            return

        win_amount = round(float(bet.amount) * multiplier, 2)

        bet.cash_out_multiplier = multiplier
        bet.final_multiplier = multiplier
        bet.is_winner = True
        await database_sync_to_async(bet.save)()

        wallet = await self.deposit_wallet(user, win_amount)

        await database_sync_to_async(Transaction.objects.create)(
            wallet=wallet,
            amount=win_amount,
            transaction_type='cashout',
            description='Cashed out from Aviator'
        )

        await self.send(json.dumps({
            "type": "cash_out_success",
            "message": "Cashout successful",
            "win_amount": win_amount,
            "multiplier": multiplier,
            "new_balance": wallet.balance  # 👈 Include updated wallet
        }))


    async def auto_cashout(self, current_multiplier, aviator_round):
        bets = await database_sync_to_async(list)(aviator_round.bets.filter(
            cash_out_multiplier__isnull=True,
            auto_cashout__lte=current_multiplier
        ))

        for bet in bets:
            win_amount = round(float(bet.amount) * bet.auto_cashout, 2)
            bet.cash_out_multiplier = bet.auto_cashout
            bet.final_multiplier = bet.auto_cashout
            bet.is_winner = True
            await database_sync_to_async(bet.save)()

            wallet = await self.deposit_wallet(bet.user, win_amount)

            await database_sync_to_async(Transaction.objects.create)(
                wallet=wallet,
                amount=win_amount,
                transaction_type='cashout',
                description='Auto-cashout on Aviator'
            )

    @database_sync_to_async
    def withdraw_wallet(self, user, amount):
        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            if wallet.balance >= amount:
                wallet.balance -= amount
                wallet.save()
                return True, wallet
            return False, wallet

    @database_sync_to_async
    def deposit_wallet(self, user, amount):
        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            wallet.balance += amount
            wallet.save()
            return wallet

    @database_sync_to_async
    def get_wallet(self, user):
        return Wallet.objects.get(user=user)

    @database_sync_to_async
    def end_round(self, round_id):
        try:
            aviator_round = AviatorRound.objects.select_related().get(id=round_id)
            aviator_round.is_active = False
            aviator_round.ended_at = timezone.now()
            aviator_round.save()

            for bet in aviator_round.bets.filter(cash_out_multiplier__isnull=True):
                bet.final_multiplier = aviator_round.crash_multiplier
                bet.is_winner = False
                bet.save()
        except AviatorRound.DoesNotExist:
            pass

    @database_sync_to_async
    def get_verified_sure_odd(self):
        odd = SureOdd.objects.filter(verified_by_admin=True, is_used=False).order_by('created_at').first()
        if odd:
            odd.is_used = True
            odd.save()
            return odd.odd
        return None

    @database_sync_to_async
    def get_round(self, round_id):
        return AviatorRound.objects.get(id=round_id)

    @database_sync_to_async
    def get_bet(self, bet_id):
        return AviatorBet.objects.get(id=bet_id)

    @database_sync_to_async
    def get_existing_bet(self, user, round):
        return AviatorBet.objects.filter(user=user, round=round).first()

    @database_sync_to_async
    def get_crash_multiplier_settings(self):
        return list(CrashMultiplierSetting.objects.all())

    async def generate_crash_multiplier(self):
        settings = await self.get_crash_multiplier_settings()
        if settings:
            selected_range = random.choices(
                settings,
                weights=[s.weight for s in settings],
                k=1
            )[0]
            min_val = selected_range.min_value
            max_val = selected_range.max_value
        else:
            min_val, max_val = 1.00, 2.00

        sure_odd = await self.get_verified_sure_odd()
        if sure_odd:
            return float(sure_odd)

        return round(random.uniform(min_val, max_val), 2)

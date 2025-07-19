import asyncio
import json
import random
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import AviatorRound, AviatorBet, SureOdd
from wallet.models import Wallet, Transaction

class AviatorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.room_group_name = 'aviator_room'

        # Join group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Start the background task if not already running
        if not hasattr(self.channel_layer, 'aviator_task'):
            self.channel_layer.aviator_task = asyncio.create_task(self.run_aviator_game())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "place_bet":
            await self.place_bet(data)
        elif action == "cashout":
            await self.cashout_bet(data)

    async def send_to_group(self, event):
        await self.send(text_data=json.dumps(event))

    async def run_aviator_game(self):
        while True:
            crash_multiplier = round(random.uniform(1.00, 50.00), 2)

            sure_odd = await self.get_verified_sure_odd()
            if sure_odd:
                crash_multiplier = float(sure_odd)

            aviator_round = await database_sync_to_async(AviatorRound.objects.create)(crash_multiplier=crash_multiplier)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_to_group',
                    'event': 'round_started',
                    'round_id': aviator_round.id,
                    'crash_multiplier': crash_multiplier,
                    'timestamp': timezone.now().strftime('%H:%M:%S')
                }
            )

            # Simulate flight progress
            multiplier = 1.00
            while multiplier < crash_multiplier:
                await asyncio.sleep(1)
                multiplier = round(multiplier + 0.5, 2)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'send_to_group',
                        'event': 'progress',
                        'multiplier': multiplier
                    }
                )

            # Crash event
            await self.end_round(aviator_round.id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_to_group',
                    'event': 'crashed',
                    'multiplier': crash_multiplier,
                    'round_id': aviator_round.id
                }
            )

            await asyncio.sleep(5)

    @database_sync_to_async
    def end_round(self, round_id):
        try:
            aviator_round = AviatorRound.objects.get(id=round_id)
            aviator_round.is_active = False
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
    def get_wallet(self, user):
        return Wallet.objects.get(user=user)

    @database_sync_to_async
    def get_round(self, round_id):
        return AviatorRound.objects.get(id=round_id)

    @database_sync_to_async
    def get_bet(self, bet_id):
        return AviatorBet.objects.get(id=bet_id)

    async def place_bet(self, data):
        user = self.scope["user"]
        round_id = data.get("round_id")
        amount = float(data.get("amount", 0))

        if amount <= 0:
            await self.send(json.dumps({"error": "Invalid amount."}))
            return

        try:
            aviator_round = await self.get_round(round_id)
            wallet = await self.get_wallet(user)
        except Exception:
            await self.send(json.dumps({"error": "Invalid round or wallet."}))
            return

        if not aviator_round.is_active:
            await self.send(json.dumps({"error": "Round is not active."}))
            return

        if wallet.balance < amount:
            await self.send(json.dumps({"error": "Insufficient balance."}))
            return

        await database_sync_to_async(wallet.withdraw)(amount)

        bet = await database_sync_to_async(AviatorBet.objects.create)(
            user=user,
            round=aviator_round,
            amount=amount
        )

        await database_sync_to_async(Transaction.objects.create)(
            user=user,
            amount=amount,
            transaction_type='withdraw',
            description='Aviator bet placed'
        )

        await self.send(json.dumps({
            "message": "Bet placed successfully",
            "round_id": round_id,
            "amount": amount,
            "bet_id": bet.id
        }))

    async def cashout_bet(self, data):
        user = self.scope["user"]
        bet_id = data.get("bet_id")
        multiplier = float(data.get("multiplier", 0))

        try:
            bet = await self.get_bet(bet_id)
            wallet = await self.get_wallet(user)
        except Exception:
            await self.send(json.dumps({"error": "Bet not found."}))
            return

        if bet.cash_out_multiplier:
            await self.send(json.dumps({"error": "Already cashed out."}))
            return

        crash = bet.round.crash_multiplier
        if multiplier >= crash:
            await self.send(json.dumps({"error": "Too late, crashed!"}))
            return

        win_amount = round(float(bet.amount) * multiplier, 2)

        bet.cash_out_multiplier = multiplier
        bet.final_multiplier = multiplier
        bet.is_winner = True
        await database_sync_to_async(bet.save)()

        wallet.balance += win_amount
        await database_sync_to_async(wallet.save)()

        await database_sync_to_async(Transaction.objects.create)(
            user=user,
            amount=win_amount,
            transaction_type='winning',
            description='Aviator win'
        )

        await self.send(json.dumps({
            "message": "Cashout successful",
            "win_amount": win_amount,
            "multiplier": multiplier
        }))
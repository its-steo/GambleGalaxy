import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import AviatorRound, SureOdd
import random
from datetime import datetime
from channels.db import database_sync_to_async

class AviatorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'aviator_game'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"[{datetime.now()}] WebSocket Connected")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"[{datetime.now()}] WebSocket Disconnected")

    async def receive(self, text_data):
     data = json.loads(text_data)
     action = data.get("action")
 
     if action == "start_round":
         await self.start_round()
 
     elif action == "manual_cashout":
         multiplier = data.get("multiplier")
         user_id = data.get("user_id")  # Pass from frontend since WebSocket has no request.user
         await self.manual_cashout(user_id, multiplier)
 

    async def start_round(self):
        user = self.scope["user"]
        sure_odd = None

        # Check if the user has a valid, unused, verified sure odd
        if user.is_authenticated:
            sure_odd = await asyncio.to_thread(
                lambda: SureOdd.objects.filter(user=user, verified_by_admin=True, is_used=False).first()
            )

        if sure_odd:
            crash_multiplier = float(sure_odd.odd)
            # Mark as used in a thread-safe way
            await asyncio.to_thread(self.mark_sure_odd_used, sure_odd)
            print(f"[{datetime.now()}] Using SURE ODD for {user.username}: {crash_multiplier}")
        else:
            crash_multiplier = round(random.uniform(1.5, 30.0), 2)
            print(f"[{datetime.now()}] Using RANDOM odd: {crash_multiplier}")

        # Save round in DB
        aviator_round = await asyncio.to_thread(
            AviatorRound.objects.create,
            crash_multiplier=crash_multiplier
        )

        # Start broadcast loop
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_multiplier",
                "round_id": aviator_round.id,
                "crash": crash_multiplier
            }
        )

    def mark_sure_odd_used(self, sure_odd):
        sure_odd.is_used = True
        sure_odd.save()

    from games.models import AviatorBet
from asgiref.sync import sync_to_async
import random

async def send_multiplier(self, event):
    round_id = event["round_id"]
    crash = event["crash"]

    multiplier = 1.0
    increment = 0.05
    delay = 0.1  # 100ms per tick

    while multiplier < crash:
        # ✅ Auto/manual cashout for bots
        bot_bets = await sync_to_async(list)(AviatorBet.objects.filter(
            round_id=round_id,
            user__is_bot=True,
            cashed_out_at__isnull=True
        ))

        for bet in bot_bets:
            if bet.auto_cashout is None and random.random() < 0.05:
                bet.cashed_out_at = round(multiplier, 2)
                bet.is_winner = True
                await sync_to_async(bet.save)()

            elif bet.auto_cashout and multiplier >= bet.auto_cashout:
                bet.cashed_out_at = bet.auto_cashout
                bet.is_winner = True
                await sync_to_async(bet.save)()

        # Send current multiplier to frontend
        await self.send(text_data=json.dumps({
            "type": "multiplier",
            "round_id": round_id,
            "multiplier": round(multiplier, 2)
        }))

        multiplier += increment
        await asyncio.sleep(delay)

    # Final crash message
    await self.send(text_data=json.dumps({
        "type": "crash",
        "round_id": round_id,
        "crash_multiplier": crash
    }))

    print(f"[{datetime.now()}] Round {round_id} crashed at {crash}")

async def manual_cashout(self, user_id, multiplier):
    from django.contrib.auth import get_user_model
    from .models import AviatorBet

    User = get_user_model()

    try:
        user = await database_sync_to_async(User.objects.get)(id=user_id)
        bet = await database_sync_to_async(AviatorBet.objects.filter(user=user, cashed_out_at__isnull=True).latest)('created_at')

        bet.cashed_out_at = multiplier
        bet.is_winner = True
        await database_sync_to_async(bet.save)()

        # TODO: Update user balance here
        # e.g., user.balance += bet.amount * multiplier

        await self.send(text_data=json.dumps({
            "type": "manual_cashout_success",
            "message": f"User {user.username} cashed out at {multiplier}x"
        }))
    except Exception as e:
        await self.send(text_data=json.dumps({
            "type": "manual_cashout_error",
            "error": str(e)
        }))

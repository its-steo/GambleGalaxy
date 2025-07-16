import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import AviatorRound
import random
from datetime import datetime

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

    async def start_round(self):
        crash_multiplier = round(random.uniform(1.5, 30.0), 2)
        aviator_round = AviatorRound.objects.create(crash_multiplier=crash_multiplier)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "send_multiplier", "round_id": aviator_round.id, "crash": crash_multiplier}
        )

    async def send_multiplier(self, event):
        round_id = event["round_id"]
        crash = event["crash"]

        multiplier = 1.0
        increment = 0.05
        delay = 0.1  # 100ms per tick

        while multiplier < crash:
            await self.send(text_data=json.dumps({
                "type": "multiplier",
                "round_id": round_id,
                "multiplier": round(multiplier, 2)
            }))
            multiplier += increment
            await asyncio.sleep(delay)

        await self.send(text_data=json.dumps({
            "type": "crash",
            "round_id": round_id,
            "crash_multiplier": crash
        }))

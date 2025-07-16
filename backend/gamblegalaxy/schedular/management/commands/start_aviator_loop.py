from django.core.management.base import BaseCommand
import asyncio
import channels.layers
from asgiref.sync import async_to_sync
import time
import random

class Command(BaseCommand):
    help = "Continuously start aviator rounds"

    def handle(self, *args, **kwargs):
        channel_layer = channels.layers.get_channel_layer()

        while True:
            async_to_sync(channel_layer.group_send)(
                'aviator_game',
                {
                    "type": "send_multiplier",
                    "round_id": 0,  # Dummy for now
                    "crash": round(random.uniform(1.5, 25), 2)
                }
            )
            time.sleep(10)  # New round every 10 seconds

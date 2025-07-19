# games/routing.py

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/aviator/$", consumers.AviatorConsumer.as_asgi()),
]

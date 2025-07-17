import os
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import games.routing  # or your app's routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gamblegalaxy.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            games.routing.websocket_urlpatterns
        )
    ),
})

from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()

class JwtAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]
        scope["user"] = AnonymousUser()
        if token:
            try:
                untoken = UntypedToken(token)
                user_id = untoken.payload["user_id"]
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                scope["user"] = user
            except Exception:
                pass
        return await self.inner(scope, receive, send)
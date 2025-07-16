import os
import django
from faker import Faker
from django.contrib.auth import get_user_model

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "gamblegalaxy.settings")
django.setup()

User = get_user_model()
faker = Faker()

BOT_AVATARS = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
    "https://i.pravatar.cc/150?img=4",
    "https://i.pravatar.cc/150?img=5",
]

for i in range(5):
    username = faker.user_name()
    avatar = BOT_AVATARS[i % len(BOT_AVATARS)]
    user = User.objects.create_user(
        username=username,
        password="botpass",
        is_bot=True,
        avatar=avatar,
        is_verified=True
    )
    print(f"Created bot: {username} with avatar {avatar}")

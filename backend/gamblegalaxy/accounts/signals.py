## accounts/signals.py
#from django.contrib.auth.signals import user_logged_in
#from django.dispatch import receiver
#from django.contrib.auth import get_user_model
#from django.utils import timezone
#
#User = get_user_model()
#
#@receiver(user_logged_in)
#def update_last_login(sender, user, request, **kwargs):
#    user.last_login = timezone.now()
#    user.save(update_fields=['last_login'])
from django.utils import timezone
from betting.models import Match
from datetime import timedelta

def update_match_statuses():
    now = timezone.now()
    matches = Match.objects.exclude(status='fulltime')  # only update active ones

    for match in matches:
        start = match.match_time
        elapsed = now - start

        if elapsed < timedelta(minutes=0):
            match.status = 'upcoming'
        elif elapsed < timedelta(minutes=45):
            match.status = 'first_half'
        elif elapsed < timedelta(minutes=60):
            match.status = 'halftime'
        elif elapsed < timedelta(minutes=90):
            match.status = 'second_half'
        else:
            match.status = 'fulltime'
        
        match.save()

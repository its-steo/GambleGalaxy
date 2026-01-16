from django.utils import timezone
from betting.models import Match
from datetime import timedelta

def update_match_statuses():
    now = timezone.now()
    matches = Match.objects.exclude(status='fulltime')  # Only update active matches

    for match in matches:
        start = match.match_time
        elapsed = now - start
        elapsed_minutes = int(elapsed.total_seconds() / 60) if elapsed.total_seconds() >= 0 else 0

        if elapsed < timedelta(minutes=0):
            match.status = 'upcoming'
            match.elapsed_minutes = None
        elif elapsed < timedelta(minutes=45):
            match.status = 'first_half'
            match.elapsed_minutes = min(elapsed_minutes, 45) if elapsed_minutes <= 80 else None
        elif elapsed < timedelta(minutes=60):
            match.status = 'halftime'
            match.elapsed_minutes = 45
        elif elapsed < timedelta(minutes=90):
            match.status = 'second_half'
            match.elapsed_minutes = min(elapsed_minutes, 80) if elapsed_minutes <= 80 else 80
        else:
            match.status = 'fulltime'
            match.elapsed_minutes = None

        match.save()
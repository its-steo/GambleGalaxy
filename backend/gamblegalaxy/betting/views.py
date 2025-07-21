from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from random import sample

from .models import Match, Bet, SureOddSlip
from .serializers import MatchSerializer, BetSerializer
from wallet.models import Wallet


# -------------------------
# MATCH LIST
# -------------------------
class MatchListView(generics.ListAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]


# -------------------------
# PLACE BET
# -------------------------
class PlaceBetView(generics.CreateAPIView):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]


# -------------------------
# BET HISTORY
# -------------------------
class MyBetHistoryView(generics.ListAPIView):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user).order_by('-placed_at')


# -------------------------
# AUTO GENERATE SURE ODDS
# -------------------------
def auto_generate_sure_odds_for_user(user):
    if SureOddSlip.objects.filter(user=user, is_used=False).exists():
        return  # Already has an active slip

    matches = Match.objects.filter(match_time__gt=timezone.now()).order_by('match_time')[:5]
    if matches.exists():
        slip = SureOddSlip.objects.create(user=user, amount_paid=100)
        slip.matches.set(matches)
        slip.save()


# -------------------------
# GET SURE ODDS
# -------------------------
class SureOddsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()

        # Auto-generate slip if not already created
        auto_generate_sure_odds_for_user(user)

        slip = SureOddSlip.objects.filter(user=user, is_used=False).order_by('-shown_to_user_at').first()
        if not slip:
            return Response({'detail': 'No Sure Odds slip found. Please pay to unlock one.'}, status=404)

        matches = slip.matches.order_by('match_time')
        if not matches.exists():
            return Response({'detail': 'Slip has no matches assigned.'}, status=404)

        # Time remaining
        time_to_first_game = matches.first().match_time - now

        # Control states
        allow_payment = False
        show_predictions = False
        dismiss = False

        # Allow payment only if game is starting soon and hasn't been paid yet
        if time_to_first_game <= timedelta(minutes=30) and not slip.has_paid:
            allow_payment = True

        # Automatically show predictions if paid
        if slip.has_paid:
            show_predictions = True
            slip.revealed_predictions = True
            slip.save()

        # Dismiss slip after first match has started
        if time_to_first_game.total_seconds() <= 0:
            dismiss = True
            slip.is_used = True
            slip.save()

        return Response({
            'code': str(slip.code),
            'matches': [
                {
                    'home_team': m.home_team,
                    'away_team': m.away_team,
                    'match_time': m.match_time,
                    'prediction': (
                        m.prediction if show_predictions else "LOCKED"
                    ),
                    'can_win': user.is_verified if slip.has_paid else False
                }
                for m in matches
            ],
            'paid': slip.has_paid,
            'allow_payment': allow_payment,
            'show_predictions': show_predictions,
            'dismiss': dismiss
        })


# -------------------------
# PAY FOR SURE ODDS
# -------------------------
class SureOddsPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        slip = SureOddSlip.objects.filter(user=user, is_used=False, has_paid=False).first()

        if not slip:
            return Response({'detail': 'No active unpaid sure odds slip found.'}, status=404)

        wallet = Wallet.objects.get(user=user)
        if wallet.balance < slip.amount_paid:
            return Response({'detail': 'Insufficient wallet balance.'}, status=400)

        # Deduct amount and unlock predictions
        wallet.balance -= slip.amount_paid
        wallet.save()

        slip.has_paid = True
        slip.save()

        return Response({'detail': 'Payment successful. Predictions unlocked!'})

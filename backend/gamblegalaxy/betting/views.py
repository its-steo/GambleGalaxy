from urllib import request
from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Match, Bet, SureOddSlip
from .serializers import MatchSerializer, BetSerializer
from wallet.models import Wallet
from datetime import timedelta
from django.utils import timezone


# -------------------------
# MATCH LIST
# -------------------------
class MatchListView(generics.ListAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]


# -------------------------
# PLACE BET (uses serializer logic)
# -------------------------
class PlaceBetView(generics.CreateAPIView):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]
    # No perform_create override needed


# -------------------------
# BET HISTORY
# -------------------------
class MyBetHistoryView(generics.ListAPIView):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user).order_by('-placed_at')


# -------------------------
# SURE ODDS VIEW
# -------------------------
def get_prediction_for_match(match):
    return match.prediction if hasattr(match, 'prediction') else None


class SureOddsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()

        slip = SureOddSlip.objects.filter(user=user, is_used=False).order_by('-shown_to_user_at').first()
        if not slip:
            return Response({'detail': 'No Sure Odds slip found. Please pay to unlock one.'}, status=404)

        matches = slip.matches.order_by('match_time')
        if not matches.exists():
            return Response({'detail': 'Slip has no matches assigned.'}, status=404)

        time_to_first_game = matches.first().match_time - now
        allow_payment = False
        show_predictions = False
        dismiss = False

        if time_to_first_game <= timedelta(minutes=30) and not slip.has_paid:
            allow_payment = True

        if slip.has_paid:
            show_predictions = True
            slip.revealed_predictions = True
            slip.save()

        if time_to_first_game.total_seconds() <= 0:
            dismiss = True
            slip.is_used = True
            slip.save()

        return Response({
            'code': str(slip.code),
            'matches': [{
                'home_team': m.home_team,
                'away_team': m.away_team,
                'match_time': m.match_time,
                'prediction': get_prediction_for_match(m) if show_predictions else None
            } for m in matches],
            'paid': slip.has_paid,
            'allow_payment': allow_payment,
            'show_predictions': show_predictions,
            'dismiss': dismiss
        })


# -------------------------
# SURE ODDS PAYMENT
# -------------------------
class SureOddsPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        slip = SureOddSlip.objects.filter(user=user, is_used=False, has_paid=False).first()

        if not slip:
            return Response({'detail': 'No active unpaid sure odds slip found.'}, status=404)

        wallet = user.wallet
        if wallet.balance < slip.amount_paid:
            return Response({'detail': 'Insufficient wallet balance.'}, status=400)

        wallet.balance -= slip.amount_paid
        wallet.save()

        slip.has_paid = True
        slip.save()

        return Response({'detail': 'Payment successful. Predictions unlocked!'})


# -------------------------
# FRONTEND INDEX PAGE
# -------------------------
def index_page(request):
    return render(request, 'frontend/index.html')

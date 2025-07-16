from django.shortcuts import render
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Match, Bet, SureOddSlip
from .serializers import MatchSerializer, BetSerializer
from wallet.models import Wallet
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

class MatchListView(generics.ListAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]


class PlaceBetView(generics.CreateAPIView):
    serializer_class = BetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        wallet = Wallet.objects.get(user=user)
        amount = serializer.validated_data['amount']
        match = serializer.validated_data['match']
        option = serializer.validated_data['selected_option']

        # Fetch odds based on selected option
        if option == 'home_win':
            odds = match.odds_home_win
        elif option == 'draw':
            odds = match.odds_draw
        else:
            odds = match.odds_away_win

        if wallet.balance < amount:
            raise serializers.ValidationError("Insufficient balance.")

        # Deduct balance
        wallet.balance -= amount
        wallet.save()

        # Save bet
        serializer.save(user=user, odds=odds)

class MyBetHistoryView(generics.ListAPIView):
    serializer_class = BetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user).order_by('-placed_at')



class SureOddsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()

        slip = SureOddSlip.objects.filter(user=user, is_used=False).order_by('-created_at').first()
        if not slip:
            return Response({'detail': 'No sure odds slip created. Pay to generate.'}, status=404)

        # Check time to game
        upcoming_matches = slip.matches.order_by('match_time')
        if not upcoming_matches.exists():
            return Response({'detail': 'No matches attached.'}, status=404)

        first_game_time = upcoming_matches.first().match_time
        time_diff = first_game_time - now

        show_prediction = False
        allow_payment = False
        dismiss = False

        if time_diff <= timedelta(minutes=30) and not slip.has_paid:
            allow_payment = True  # show pay prompt
        if slip.has_paid:
            show_prediction = True  # show prediction
        if time_diff.total_seconds() <= 0:
            dismiss = True  # game already started

        data = {
            'matches': [
                {
                    'home_team': m.home_team,
                    'away_team': m.away_team,
                    'match_time': m.match_time,
                    'odds_home_win': m.odds_home_win,
                    'odds_draw': m.odds_draw,
                    'odds_away_win': m.odds_away_win
                } for m in upcoming_matches
            ],
            'paid': slip.has_paid,
            'show_prediction': show_prediction,
            'allow_payment': allow_payment,
            'dismiss': dismiss
        }

        return Response(data)

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

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import AviatorRound, AviatorBet
from .serializers import AviatorRoundSerializer, AviatorBetSerializer
from decimal import Decimal
import random

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_aviator_round(request):
    crash = round(random.uniform(1.00, 50.00), 2)
    aviator_round = AviatorRound.objects.create(crash_multiplier=crash)
    serializer = AviatorRoundSerializer(aviator_round)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_aviator_bet(request):
    round_id = request.data.get('round_id')
    amount = request.data.get('amount')

    try:
        aviator_round = AviatorRound.objects.get(id=round_id, is_active=True)
    except AviatorRound.DoesNotExist:
        return Response({'error': 'Invalid or inactive round'}, status=400)

    bet = AviatorBet.objects.create(
        user=request.user,
        round=aviator_round,
        amount=Decimal(amount)
    )
    serializer = AviatorBetSerializer(bet)
    return Response(serializer.data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cashout_aviator_bet(request):
    bet_id = request.data.get('bet_id')
    multiplier = float(request.data.get('multiplier'))

    try:
        bet = AviatorBet.objects.get(id=bet_id, user=request.user)
        round_crash = bet.round.crash_multiplier
    except AviatorBet.DoesNotExist:
        return Response({'error': 'Bet not found'}, status=404)

    if multiplier < round_crash:
        bet.cash_out_multiplier = multiplier
        bet.save()
        return Response({
            'message': 'Cashout successful',
            'win_amount': float(bet.amount) * multiplier
        }, status=200)
    else:
        return Response({'message': 'Too late! Plane crashed.'}, status=400)

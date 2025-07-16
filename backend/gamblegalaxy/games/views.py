from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import AviatorRound, AviatorBet, SureOdd
from .serializers import AviatorRoundSerializer, AviatorBetSerializer, SureOddSerializer
from decimal import Decimal
import random

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import AviatorRound
from .serializers import TopWinnerSerializer

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


@api_view(['GET'])
def past_crashes(request):
    recent_rounds = AviatorRound.objects.order_by('-start_time')[:20]
    data = [
        {
            "id": r.id,
            "multiplier": r.crash_multiplier,
            "color": r.get_crash_color(),
            "timestamp": r.start_time.strftime("%H:%M:%S")
        }
        for r in recent_rounds
    ]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_sure_odds(request):
    odds = SureOdd.objects.filter(user=request.user).order_by('-created_at')
    serializer = SureOddSerializer(odds, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bet_history(request):
    bets = AviatorBet.objects.filter(user=request.user).order_by('-created_at')[:20]
    return Response(AviatorBetSerializer(bets, many=True).data)


@api_view(['GET'])
def top_winners_today(request):
    bets = AviatorBet.top_winners_today()
    serializer = TopWinnerSerializer(bets, many=True)
    return Response(serializer.data)
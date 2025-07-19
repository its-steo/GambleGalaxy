from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, InvalidOperation
import random
from django.utils import timezone

from .models import AviatorRound, AviatorBet, SureOdd
from .serializers import (
    AviatorRoundSerializer,
    AviatorBetSerializer,
    SureOddSerializer,
    TopWinnerSerializer,
)
from wallet.models import Wallet, Transaction


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_aviator_round(request):
    """
    Starts a new Aviator round with a random crash multiplier.
    """
    crash = round(random.uniform(1.00, 50.00), 2)
    aviator_round = AviatorRound.objects.create(crash_multiplier=crash)
    serializer = AviatorRoundSerializer(aviator_round)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_aviator_bet(request):
    """
    Place a bet if the round is active and user has enough wallet balance.
    """
    user = request.user
    data = request.data

    round_id = data.get('round_id')
    amount = data.get('amount')

    if not round_id or not amount:
        return Response({'error': 'Round ID and amount are required.'}, status=400)

    try:
        aviator_round = AviatorRound.objects.get(id=round_id, is_active=True)
    except AviatorRound.DoesNotExist:
        return Response({'error': 'Invalid or inactive round.'}, status=400)

    try:
        amount_decimal = Decimal(str(amount))
        if amount_decimal <= 0:
            raise ValueError
    except (InvalidOperation, ValueError):
        return Response({'error': 'Invalid amount format.'}, status=400)

    wallet, _ = Wallet.objects.get_or_create(user=user)

    if wallet.balance < amount_decimal:
        return Response({'error': 'Insufficient wallet balance.'}, status=400)

    # Deduct from wallet
    wallet.balance -= amount_decimal
    wallet.save()

    # Record transaction
    Transaction.objects.create(
        user=user,
        amount=amount_decimal,
        transaction_type='withdrawal',
        description='Aviator bet placed'
    )

    # Save bet
    bet = AviatorBet.objects.create(
        user=user,
        round=aviator_round,
        amount=amount_decimal
    )

    serializer = AviatorBetSerializer(bet)
    return Response(serializer.data, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cashout_aviator_bet(request):
    """
    Cash out a bet before the plane crashes.
    """
    bet_id = request.data.get('bet_id')
    multiplier = request.data.get('multiplier')

    if not bet_id or not multiplier:
        return Response({'error': 'Bet ID and multiplier are required.'}, status=400)

    try:
        multiplier = float(multiplier)
    except:
        return Response({'error': 'Invalid multiplier.'}, status=400)

    try:
        bet = AviatorBet.objects.get(id=bet_id, user=request.user)
    except AviatorBet.DoesNotExist:
        return Response({'error': 'Bet not found.'}, status=404)

    if bet.cash_out_multiplier is not None:
        return Response({'message': 'Bet already cashed out.'}, status=400)

    crash_multiplier = bet.round.crash_multiplier

    if multiplier < crash_multiplier:
        win_amount = float(bet.amount) * multiplier

        bet.cash_out_multiplier = multiplier
        bet.final_multiplier = multiplier
        bet.is_winner = True
        bet.save()

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        wallet.balance += Decimal(win_amount)
        wallet.save()

        Transaction.objects.create(
            user=request.user,
            amount=Decimal(win_amount),
            transaction_type='deposit',
            description='Aviator Bet Cashout'
        )

        return Response({
            'message': 'Cashout successful',
            'win_amount': win_amount
        }, status=200)

    return Response({'message': 'Too late! Plane crashed.'}, status=400)


@api_view(['GET'])
def past_crashes(request):
    """
    Returns the last 20 crash multipliers with color coding.
    """
    recent_rounds = AviatorRound.objects.order_by('-start_time')[:20]
    data = [
        {
            "id": r.id,
            "multiplier": r.crash_multiplier,
            "color": r.get_crash_color(),
            "timestamp": r.start_time.strftime("%H:%M:%S"),
        }
        for r in recent_rounds
    ]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_sure_odds(request):
    """
    Returns sure odds submitted by the logged-in user.
    """
    odds = SureOdd.objects.filter(user=request.user).order_by('-created_at')
    serializer = SureOddSerializer(odds, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bet_history(request):
    """
    Returns the last 20 bets placed by the user.
    """
    bets = AviatorBet.objects.filter(user=request.user).order_by('-created_at')[:20]
    serializer = AviatorBetSerializer(bets, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def top_winners_today(request):
    """
    Returns the top 10 winners of the day based on cashout winnings.
    """
    today = timezone.now().date()
    bets = AviatorBet.objects.filter(
        created_at__date=today,
        is_winner=True,
        cash_out_multiplier__isnull=False
    )

    sorted_bets = sorted(bets, key=lambda b: b.win_amount(), reverse=True)[:10]

    leaderboard = [
        {
            "user": bet.user.username,
            "amount": float(bet.amount),
            "cash_out_multiplier": float(bet.cash_out_multiplier),
            "win_amount": float(bet.win_amount())
        }
        for bet in sorted_bets
    ]

    return Response(leaderboard)

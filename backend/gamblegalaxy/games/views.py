from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, InvalidOperation
import random
from django.utils import timezone
from django.db import transaction
import logging

from .models import AviatorRound, AviatorBet, SureOdd, SureOddPurchase
from .serializers import (
    AviatorRoundSerializer,
    AviatorBetSerializer,
    SureOddSerializer,
    TopWinnerSerializer,
)
from wallet.models import Wallet, Transaction

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_aviator_round(request):
    ranges = [
        (1.00, 2.00),    # Most frequent
        (3.01, 10.00),   # Less frequent
        (10.01, 30.00),  # Rare
        (30.01, 1000.00) # Very rare
    ]
    weights = [80, 12, 7, 1]

    selected_range = random.choices(ranges, weights=weights, k=1)[0]
    crash = round(random.uniform(*selected_range), 2)
    aviator_round = AviatorRound.objects.create(crash_multiplier=crash)
    serializer = AviatorRoundSerializer(aviator_round)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_aviator_bet(request):
    try:
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

        with transaction.atomic():
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
            except Wallet.DoesNotExist:
                return Response({'error': 'Wallet not found.'}, status=400)

            if wallet.balance < amount_decimal:
                return Response({'error': 'Insufficient wallet balance.'}, status=400)

            wallet.balance -= amount_decimal
            wallet.save()

            print(f"Transaction model fields: {list(Transaction._meta.get_fields())}")
            print(f"Creating transaction for user: {user.username}, amount: {-amount_decimal}, type: withdraw")

            try:
                Transaction.objects.create(
                    user=user,
                    amount=-amount_decimal,
                    transaction_type='withdraw',
                    description='Aviator bet placed'
                )
            except Exception as e:
                logger.exception("Error creating transaction")
                return Response({'error': f'Failed to create transaction: {str(e)}'}, status=500)

            bet = AviatorBet.objects.create(
                user=user,
                round=aviator_round,
                amount=amount_decimal,
                auto_cashout=data.get('auto_cashout')
            )

            print(f"AviatorBetSerializer fields: {AviatorBetSerializer().get_fields().keys()}")

            serializer = AviatorBetSerializer(bet)
            return Response({
                'bet': serializer.data,
                'new_balance': float(wallet.balance)
            }, status=201)

    except Exception as e:
        logger.exception("Error placing Aviator bet")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cashout_aviator_bet(request):
    print(f"cashout_aviator_bet request.data: {request.data}")

    bet_id = request.data.get('bet_id')
    multiplier = request.data.get('multiplier')

    if not bet_id or not multiplier:
        return Response({'error': f'Bet ID and multiplier are required. Received: bet_id={bet_id}, multiplier={multiplier}'}, status=400)

    try:
        bet_id = int(bet_id)
    except (ValueError, TypeError):
        return Response({'error': f'Invalid bet_id format: {bet_id}'}, status=400)

    try:
        multiplier = float(multiplier)
        if multiplier <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({'error': f'Invalid multiplier format: {multiplier}'}, status=400)

    try:
        bet = AviatorBet.objects.get(id=bet_id, user=request.user)
    except AviatorBet.DoesNotExist:
        return Response({'error': 'Bet not found.'}, status=404)

    if bet.cash_out_multiplier is not None:
        return Response({'error': 'Bet already cashed out.'}, status=400)

    if not bet.round.is_active:
        logger.warning(f"[Cashout] Round not active: {bet.round.id}, crash_multiplier: {bet.round.crash_multiplier}")
        return Response({'error': 'Too late! Plane crashed.'}, status=400)

    if multiplier >= bet.round.crash_multiplier:
        logger.warning(f"[Cashout] Multiplier too high: {multiplier} >= {bet.round.crash_multiplier} for round {bet.round.id}")
        return Response({'error': 'Too late! Plane crashed.'}, status=400)

    with transaction.atomic():
        win_amount = round(float(bet.amount) * multiplier, 2)
        bet.cash_out_multiplier = multiplier
        bet.final_multiplier = multiplier
        bet.is_winner = True
        bet.save()

        try:
            wallet = Wallet.objects.select_for_update().get(user=request.user)
        except Wallet.DoesNotExist:
            return Response({'error': 'Wallet not found.'}, status=400)

        wallet.balance += Decimal(str(win_amount))
        wallet.save()

        print(f"Transaction model fields: {list(Transaction._meta.get_fields())}")
        print(f"Creating transaction for user: {request.user.username}, amount: {win_amount}, type: winning")

        try:
            Transaction.objects.create(
                user=request.user,
                amount=Decimal(str(win_amount)),
                transaction_type='winning',
                description=f'Aviator Bet Cashout at {multiplier}x'
            )
        except Exception as e:
            logger.exception("Error creating transaction")
            return Response({'error': f'Failed to create transaction: {str(e)}'}, status=500)

    return Response({
        'message': 'Cashout successful',
        'win_amount': win_amount,
        'new_balance': float(wallet.balance)
    }, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_round_status(request, round_id):
    try:
        round = AviatorRound.objects.get(id=round_id)
        return Response({
            'is_active': round.is_active,
            'crash_multiplier': round.crash_multiplier,
            'start_time': round.start_time
        })
    except AviatorRound.DoesNotExist:
        return Response({'error': 'Round not found'}, status=404)

@api_view(['GET'])
def past_crashes(request):
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
    odds = SureOdd.objects.filter(user=request.user).order_by('-created_at')
    serializer = SureOddSerializer(odds, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bet_history(request):
    bets = AviatorBet.objects.filter(user=request.user).order_by('-created_at')[:20]
    serializer = AviatorBetSerializer(bets, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def top_winners_today(request):
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_sure_odd(request):
    user = request.user
    amount = 10000  # KES

    with transaction.atomic():
        try:
            wallet = Wallet.objects.select_for_update().get(user=user)
            if wallet.balance < amount:
                return Response({'detail': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)

            wallet.balance -= amount
            wallet.save()

            print(f"Transaction model fields: {list(Transaction._meta.get_fields())}")
            print(f"Creating transaction for user: {user.username}, amount: {-amount}, type: withdraw")

            try:
                Transaction.objects.create(
                    user=user,
                    amount=-amount,
                    transaction_type='withdraw',
                    description='Sure Odd purchase'
                )
            except Exception as e:
                logger.exception("Error creating transaction")
                return Response({'error': f'Failed to create transaction: {str(e)}'}, status=500)

            SureOddPurchase.objects.create(user=user)
            return Response({'detail': 'Sure Odd purchase successful'}, status=status.HTTP_200_OK)

        except Wallet.DoesNotExist:
            return Response({'detail': 'Wallet not found'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sure_odd(request):
    user = request.user
    try:
        purchase = SureOddPurchase.objects.filter(user=user, odd_value__isnull=False, used=False, is_active=True).latest('created_at')
        return Response({'odd_value': float(purchase.odd_value)}, status=200)
    except SureOddPurchase.DoesNotExist:
        return Response({'odd_value': None}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sure_odd_status(request):
    user = request.user
    active = SureOddPurchase.objects.filter(user=user, is_active=True, used=False).exists()
    return Response({'has_pending': active})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sure_odd_history(request):
    user = request.user
    history = SureOddPurchase.objects.filter(user=user).order_by('-created_at').values('odd_value', 'created_at', 'used')
    return Response({'history': list(history)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    try:
        wallet = Wallet.objects.get(user=request.user)
        return Response({"balance": float(wallet.balance)})
    except Wallet.DoesNotExist:
        return Response({"error": "Wallet not found"}, status=404)
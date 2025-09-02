# games/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, InvalidOperation
import random
import asyncio
import time
from django.utils import timezone
from django.db import transaction
from django.db.models import F, Q
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import AviatorRound, AviatorBet, SureOdd, SureOddPurchase, PredictorPackage, PredictorPurchase, CrashMultiplierSetting
from .serializers import (
    AviatorRoundSerializer,
    AviatorBetSerializer,
    SureOddSerializer,
    TopWinnerSerializer,
    PredictorPackageSerializer,
    PredictorPurchaseSerializer,
)
from wallet.models import Wallet, Transaction
from .consumers import AviatorConsumer

logger = logging.getLogger(__name__)

def get_current_round_state_sync():
    """Fallback implementation for getting current round state"""
    try:
        loop = asyncio.get_event_loop()
        state = loop.run_until_complete(AviatorConsumer.get_current_round_state())
        return state
    except Exception as e:
        logger.warning(f"Could not get current round state: {e}")
        try:
            current_round = AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()
            if current_round:
                return {
                    'round_id': current_round.id,
                    'crash_multiplier': float(current_round.crash_multiplier),
                    'is_active': current_round.is_active,
                    'crashed': False,
                    'current_multiplier': 1.0,
                    'is_betting': False
                }
        except Exception as fallback_error:
            logger.error(f"Fallback error: {fallback_error}")
        return None

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_aviator_round(request):
    settings = CrashMultiplierSetting.objects.all()
    sure_odd = SureOdd.objects.filter(verified_by_admin=True, is_used=False).order_by('created_at').first()
    if sure_odd:
        crash = float(sure_odd.odd)
        sure_odd.is_used = True
        sure_odd.save()
    else:
        if settings:
            selected_range = random.choices(
                settings,
                weights=[s.weight for s in settings],
                k=1
            )[0]
            min_val = selected_range.min_value
            max_val = selected_range.max_value
        else:
            min_val, max_val = 1.00, 2.00
        crash = round(random.uniform(min_val, max_val), 2)

    aviator_round = AviatorRound.objects.create(
        crash_multiplier=crash,
        is_active=True
    )
    logger.info(f"[API] Created round {aviator_round.id} with crash {crash}x - Active: {aviator_round.is_active}")
    
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
        auto_cashout = data.get('auto_cashout')

        logger.info(f"[API BET] User: {user.username}, Round: {round_id}, Amount: {amount}, Auto Cashout: {auto_cashout}")

        if not round_id or not amount:
            return Response({'error': 'Round ID and amount are required.'}, status=400)

        current_state = get_current_round_state_sync()
        if not current_state or not current_state.get('round_id'):
            logger.warning("[API BET] No active round in global state, checking database")
            aviator_round = AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()
            if not aviator_round:
                logger.info("[API BET] No active rounds found, creating new one")
                crash = round(random.uniform(1.5, 3.0), 2)
                aviator_round = AviatorRound.objects.create(
                    crash_multiplier=crash,
                    is_active=True
                )
                logger.info(f"[API BET] Created new round {aviator_round.id}")
        else:
            try:
                aviator_round = AviatorRound.objects.get(id=current_state['round_id'], is_active=True)
                logger.info(f"[API BET] Using current active round {aviator_round.id} from global state")
            except AviatorRound.DoesNotExist:
                logger.warning(f"[API BET] Current round {current_state['round_id']} not found")
                aviator_round = None

        if not aviator_round:
            return Response({'error': 'No active round available.'}, status=400)

        if aviator_round.id != int(round_id):
            return Response({'error': 'Invalid round ID.'}, status=400)

        existing_bet = AviatorBet.objects.filter(user=user, round=aviator_round).first()
        if existing_bet:
            return Response({'error': 'You already have a bet in this round.'}, status=400)

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
                auto_cashout=auto_cashout
            )

            serializer = AviatorBetSerializer(bet)
            logger.info(f"[API BET] SUCCESS: Created bet {bet.id} for user {user.username} in round {aviator_round.id}")

            return Response({
                'bet': serializer.data,
                'new_balance': float(wallet.balance),
                'round_id': aviator_round.id
            }, status=201)

    except Exception as e:
        logger.exception("Error placing Aviator bet")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cashout_aviator_bet(request):
    try:
        user = request.user
        bet_id = request.data.get('bet_id')
        multiplier = request.data.get('multiplier')

        logger.info(f"[API CASHOUT] User: {user.username}, Bet ID: {bet_id}, Multiplier: {multiplier}")

        if not bet_id or not multiplier:
            return Response({'error': 'Bet ID and multiplier are required.'}, status=400)

        try:
            bet = AviatorBet.objects.select_related('round').get(id=bet_id, user=user)
        except AviatorBet.DoesNotExist:
            return Response({'error': 'Bet not found or not yours.'}, status=404)

        if bet.cash_out_multiplier is not None:
            return Response({'error': 'Bet already cashed out.'}, status=400)

        current_state = get_current_round_state_sync()
        if not current_state or not current_state['is_active'] or current_state['crashed']:
            return Response({'error': 'Round has ended or crashed.'}, status=400)

        if bet.round.id != current_state['round_id']:
            return Response({'error': 'Bet is from a different round.'}, status=400)

        if multiplier >= current_state['crash_multiplier']:
            return Response({'error': f"Too late! Plane crashed at {current_state['crash_multiplier']}x"}, status=400)

        win_amount = round(float(bet.amount) * multiplier, 2)

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            wallet.balance += Decimal(str(win_amount))
            wallet.save()

            bet.cash_out_multiplier = multiplier
            bet.final_multiplier = multiplier
            bet.is_winner = True
            bet.save()

            Transaction.objects.create(
                user=user,
                amount=win_amount,
                transaction_type='winning',
                description=f'Aviator cashout at {multiplier}x'
            )

        serializer = AviatorBetSerializer(bet)
        logger.info(f"[API CASHOUT] SUCCESS: {user.username} cashed out at {multiplier}x for {win_amount}")

        if win_amount >= 500:
            logger.info(f"🏆 Significant win detected: {win_amount}, triggering top winners update")
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    'aviator_room',
                    {
                        'type': 'send_to_group',
                        'type_override': 'top_winners_updated',
                        'message': 'Global top winners updated',
                        'trigger_refresh': True
                    }
                )

        return Response({
            'message': 'Cashout successful',
            'win_amount': win_amount,
            'multiplier': multiplier,
            'new_balance': float(wallet.balance),
            'user_id': user.id,
            'server_time': int(time.time() * 1000),
            'updated_top_winners': win_amount >= 500
        }, status=200)

    except Exception as e:
        logger.exception("Error cashing out bet")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def top_winners_today(request):
    try:
        winning_bets = AviatorBet.objects.filter(
            is_winner=True,
            cash_out_multiplier__isnull=False
        ).select_related('user', 'round').order_by('-created_at')[:100]

        logger.info(f"🏆 Found {winning_bets.count()} winning bets (all-time)")

        winners_data = []
        for bet in winning_bets:
            try:
                win_amount = bet.win_amount()
                if win_amount > 0:
                    winners_data.append({
                        'id': bet.id,
                        'username': bet.user.username,
                        'amount': float(bet.amount),
                        'win_amount': win_amount,
                        'multiplier': float(bet.cash_out_multiplier),
                        'cashout_multiplier': float(bet.cash_out_multiplier),
                        'timestamp': int(bet.created_at.timestamp()),
                        'is_bot': getattr(bet.user, 'is_bot', False),
                        'round_id': bet.round.id,
                        'date': bet.created_at.strftime('%Y-%m-%d'),
                        'time': bet.created_at.strftime('%H:%M:%S')
                    })
            except Exception as e:
                logger.error(f"Error processing bet {bet.id}: {e}")
                continue

        winners_data.sort(key=lambda x: x['win_amount'], reverse=True)
        top_winners = winners_data[:15]

        logger.info(f"🏆 Returning {len(top_winners)} global top winners")
        for i, winner in enumerate(top_winners[:5]):
            logger.info(f"  {i+1}. {winner['username']}: KES {winner['win_amount']:.2f} at {winner['multiplier']}x")

        return Response(top_winners, status=200)

    except Exception as e:
        logger.exception("Error fetching global top winners")
        return Response([], status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_sure_odd(request):
    user = request.user
    amount = 10000

    with transaction.atomic():
        try:
            wallet = Wallet.objects.select_for_update().get(user=user)
            if wallet.balance < amount:
                return Response({'detail': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)

            wallet.balance -= amount
            wallet.save()

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_round_status(request, round_id):
    try:
        round = AviatorRound.objects.get(id=round_id)
        serializer = AviatorRoundSerializer(round)
        return Response(serializer.data, status=200)
    except AviatorRound.DoesNotExist:
        return Response({'error': 'Round not found'}, status=404)

@api_view(['GET'])
def past_crashes(request):
    past_rounds = AviatorRound.objects.filter(is_active=False).order_by('-ended_at')[:12]
    serializer = AviatorRoundSerializer(past_rounds, many=True)
    return Response(serializer.data, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_sure_odds(request):
    sure_odds = SureOdd.objects.filter(user=request.user).order_by('-created_at')
    serializer = SureOddSerializer(sure_odds, many=True)
    return Response(serializer.data, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_wallet_balance(request):
    try:
        user = request.user
        amount = request.data.get('amount')
        transaction_type = request.data.get('transaction_type')

        if not amount or not transaction_type:
            return Response({'error': 'Amount and transaction type are required.'}, status=400)

        try:
            amount_decimal = Decimal(str(amount))
        except (InvalidOperation, ValueError):
            return Response({'error': 'Invalid amount format.'}, status=400)

        with transaction.atomic():
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
            except Wallet.DoesNotExist:
                return Response({'error': 'Wallet not found.'}, status=400)

            if transaction_type == 'deposit':
                wallet.balance += amount_decimal
                description = f'Deposit of {amount_decimal}'
            elif transaction_type == 'withdraw':
                if wallet.balance < amount_decimal:
                    return Response({'error': 'Insufficient wallet balance.'}, status=400)
                wallet.balance -= amount_decimal
                description = f'Withdrawal of {amount_decimal}'
            else:
                return Response({'error': 'Invalid transaction type.'}, status=400)

            wallet.save()

            Transaction.objects.create(
                user=user,
                amount=amount_decimal if transaction_type == 'deposit' else -amount_decimal,
                transaction_type=transaction_type,
                description=description
            )

        return Response({'balance': float(wallet.balance)}, status=200)

    except Exception as e:
        logger.exception("Error updating wallet balance")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def list_predictor_packages(request):
    """List all available predictor packages"""
    packages = PredictorPackage.objects.all()
    serializer = PredictorPackageSerializer(packages, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_predictor_package(request):
    """Purchase a predictor package"""
    try:
        package_id = request.data.get('predictor_package_id')
        if not package_id:
            return Response({'error': 'Package ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            predictor_package = PredictorPackage.objects.get(id=package_id)
        except PredictorPackage.DoesNotExist:
            return Response({'error': 'Predictor package not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check for existing active purchase
        if PredictorPurchase.objects.filter(
            user=request.user,
            predictor_package_id=package_id,
            expiry_date__gte=timezone.now()
        ).exists():
            return Response({'error': 'You already have an active purchase for this package.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PredictorPurchaseSerializer(data={
            'user': request.user.id,
            'predictor_package_id': predictor_package.id
        }, context={'request': request})
        if serializer.is_valid():
            purchase = serializer.save()
            return Response({
                'purchase': PredictorPurchaseSerializer(purchase, context={'request': request}).data,
                'new_balance': float(purchase.user.wallet.balance)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.exception("Error purchasing predictor package")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_predictor_purchases(request):
    """List user's active predictor purchases"""
    purchases = PredictorPurchase.objects.filter(user=request.user, expiry_date__gte=timezone.now())
    serializer = PredictorPurchaseSerializer(purchases, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_prediction(request):
    """Generate a prediction using a purchased predictor package"""
    try:
        purchase_id = request.data.get('purchase_id')
        if not purchase_id:
            return Response({'error': 'Purchase ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Use filter().first() instead of get() to avoid MultipleObjectsReturned
        purchase = PredictorPurchase.objects.filter(
            user=request.user,
            id=purchase_id,
            expiry_date__gte=timezone.now()
        ).order_by('-purchase_date').first()

        if not purchase:
            return Response({'error': 'Active predictor purchase not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not purchase.can_predict():
            return Response({'error': 'Daily prediction limit reached or package expired.'}, status=status.HTTP_400_BAD_REQUEST)

        settings = CrashMultiplierSetting.objects.all()
        if settings.exists():
            selected_range = random.choices(
                settings,
                weights=[s.weight for s in settings],
                k=1
            )[0]
            min_val = selected_range.min_value
            max_val = selected_range.max_value
        else:
            min_val, max_val = 1.00, 2.00
        prediction = round(random.uniform(min_val, max_val), 2)

        if request.user.is_nesty:
            SureOdd.objects.create(
                user=request.user,
                odd=prediction,
                verified_by_admin=True,
                is_used=False
            )

        purchase.predictions_used_today += 1
        purchase.save()

        return Response({
            'prediction': prediction,
            'is_nesty': request.user.is_nesty,
            'message': 'Prediction will set next round multiplier' if request.user.is_nesty else 'Prediction generated (no effect on round)'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.exception("Error generating prediction")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_prediction(request):
    """Retrieve the user's current prediction (from SureOdd or recent PredictorPurchase)"""
    try:
        user = request.user

        # Check for an active PredictorPurchase for all users
        purchase = PredictorPurchase.objects.filter(
            user=user,
            expiry_date__gte=timezone.now()
        ).order_by('-purchase_date').first()

        if purchase:
            # Calculate remaining predictions
            today = timezone.now().date()
            if purchase.last_reset_date < today:
                predictions_remaining = purchase.predictor_package.predictions_per_day
            else:
                predictions_remaining = purchase.predictor_package.predictions_per_day - purchase.predictions_used_today

            # Check for a recent prediction (SureOdd) for the current day
            prediction = SureOdd.objects.filter(
                user=user,
                created_at__gte=timezone.now().date(),
                verified_by_admin=True
            ).order_by('-created_at').first()

            if prediction:
                return Response({
                    'prediction': float(prediction.odd),
                    'is_nesty': user.is_nesty,
                    'message': 'Latest prediction from your purchase',
                    'predictions_remaining': max(predictions_remaining, 0),
                    'daily_limit': purchase.predictor_package.predictions_per_day,
                    'confidence_level': 80  # Default confidence level, adjust as needed
                }, status=status.HTTP_200_OK)
            
            return Response({
                'prediction': None,
                'is_nesty': user.is_nesty,
                'message': 'No prediction available for today',
                'predictions_remaining': max(predictions_remaining, 0),
                'daily_limit': purchase.predictor_package.predictions_per_day,
                'confidence_level': None
            }, status=status.HTTP_200_OK)

        return Response({
            'error': 'No active predictor purchase found',
            'predictions_remaining': 0,
            'daily_limit': 0,
            'confidence_level': None
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.exception("Error fetching current prediction")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
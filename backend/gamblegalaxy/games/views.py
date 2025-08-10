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

from .models import AviatorRound, AviatorBet, SureOdd, SureOddPurchase
from .serializers import (
    AviatorRoundSerializer,
    AviatorBetSerializer,
    SureOddSerializer,
    TopWinnerSerializer,
)
from wallet.models import Wallet, Transaction
from .consumers import AviatorConsumer

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
    
    aviator_round = AviatorRound.objects.create(
        crash_multiplier=crash,
        is_active=True
    )
    
    print(f"[API] Created round {aviator_round.id} with crash {crash}x - Active: {aviator_round.is_active}")
    
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

        print(f"[API BET] User: {user.username}, Round: {round_id}, Amount: {amount}")

        if not round_id or not amount:
            return Response({'error': 'Round ID and amount are required.'}, status=400)

        aviator_round = None
        
        try:
            aviator_round = AviatorRound.objects.get(id=round_id, is_active=True)
            print(f"[API BET] Found requested round {aviator_round.id}")
        except AviatorRound.DoesNotExist:
            print(f"[API BET] Requested round {round_id} not found or inactive")
            
            current_state = get_current_round_state_sync()
            if current_state and current_state.get('round_id'):
                try:
                    aviator_round = AviatorRound.objects.get(id=current_state['round_id'], is_active=True)
                    print(f"[API BET] Using current active round {aviator_round.id} from global state")
                except AviatorRound.DoesNotExist:
                    print(f"[API BET] Current round {current_state['round_id']} also not found")
            
            if not aviator_round:
                aviator_round = AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()
                if aviator_round:
                    print(f"[API BET] Using latest active round {aviator_round.id}")
                else:
                    print(f"[API BET] No active rounds found, creating new one")
                    crash = round(random.uniform(1.5, 3.0), 2)
                    aviator_round = AviatorRound.objects.create(
                        crash_multiplier=crash,
                        is_active=True
                    )
                    print(f"[API BET] Created new round {aviator_round.id}")

        if not aviator_round:
            return Response({'error': 'No active round available.'}, status=400)

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
                auto_cashout=data.get('auto_cashout')
            )

            serializer = AviatorBetSerializer(bet)
            
            print(f"[API BET] SUCCESS: Created bet {bet.id} for user {user.username} in round {aviator_round.id}")
            
            return Response({
                'bet': serializer.data,
                'new_balance': float(wallet.balance),
                'round_id': aviator_round.id
            }, status=201)

    except Exception as e:
        logger.exception("Error placing Aviator bet")
        print(f"[API BET] ERROR: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_wallet_balance(request):
    try:
        user = request.user
        data = request.data
        
        amount = data.get('amount')
        transaction_type = data.get('transaction_type', 'winning')
        description = data.get('description', 'Wallet update')
        bet_id = data.get('bet_id')
        
        if not amount:
            return Response({'error': 'Amount is required.'}, status=400)
            
        try:
            amount_decimal = Decimal(str(amount))
        except (InvalidOperation, ValueError):
            return Response({'error': 'Invalid amount format.'}, status=400)
            
        with transaction.atomic():
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
            except Wallet.DoesNotExist:
                return Response({'error': 'Wallet not found.'}, status=400)
                
            wallet.balance += amount_decimal
            wallet.save()
            
            try:
                Transaction.objects.create(
                    user=user,
                    amount=amount_decimal,
                    transaction_type=transaction_type,
                    description=description
                )
            except Exception as e:
                logger.exception("Error creating transaction")
                print(f"Transaction record failed but wallet updated: {e}")
                
            if bet_id:
                try:
                    bet = AviatorBet.objects.get(id=bet_id, user=user)
                    if not bet.cash_out_multiplier:
                        current_multiplier = amount_decimal / bet.amount
                        bet.cash_out_multiplier = current_multiplier
                        bet.final_multiplier = current_multiplier
                        bet.is_winner = True
                        bet.save()
                        print(f"Updated bet {bet_id} with cashout multiplier {current_multiplier}")
                        
                        # 🔧 NEW: Check if this should update global top winners
                        win_amount = float(amount_decimal)
                        if win_amount >= 500:  # Lower threshold for more frequent updates
                            print(f"🏆 Significant win detected: {win_amount}, refreshing global top winners")
                            from channels.layers import get_channel_layer
                            from asgiref.sync import async_to_sync
                            
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
                        
                except AviatorBet.DoesNotExist:
                    print(f"Bet {bet_id} not found for user {user.id}")
                except Exception as e:
                    print(f"Error updating bet record: {e}")
            
            return Response({
                'message': 'Wallet updated successfully',
                'new_balance': float(wallet.balance),
                'amount_added': float(amount_decimal)
            }, status=200)
            
    except Exception as e:
        logger.exception("Error updating wallet balance")
        return Response({'error': str(e)}, status=500)

def get_current_round_state_sync():
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        current_state = loop.run_until_complete(AviatorConsumer.get_current_round_state())
        loop.close()
        return current_state
    except Exception as e:
        print(f"[REST API] Error getting current state: {e}")
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
            print(f"[REST API] Fallback error: {fallback_error}")
        
        return None

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cashout_aviator_bet(request):
    print(f"[REST API Cashout] cashout_aviator_bet request.data: {request.data}")

    bet_id = request.data.get('bet_id')
    multiplier = request.data.get('multiplier')

    if not bet_id or not multiplier:
        return Response({
            'error': f'Bet ID and multiplier are required. Received: bet_id={bet_id}, multiplier={multiplier}'
        }, status=400)

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

    current_state = get_current_round_state_sync()
    
    if not current_state:
        print(f"[REST API Cashout] Unable to get current game state")
        return Response({'error': 'Unable to validate current game state'}, status=500)

    print(f"[REST API Cashout] Current state: {current_state}")
    print(f"[REST API Cashout] Bet round: {bet.round.id}, Current round: {current_state['round_id']}")

    current_round_id = current_state.get('round_id')
    bet_round_id = bet.round.id
    
    if current_state.get('crashed', False):
        print(f"[REST API Cashout] Round already crashed at {current_state['crash_multiplier']}x")
        return Response({
            'error': f"Too late, round crashed at {current_state['crash_multiplier']}x!"
        }, status=400)

    if bet_round_id != current_round_id:
        try:
            bet_round = AviatorRound.objects.get(id=bet_round_id)
            if bet_round.is_active:
                print(f"[REST API Cashout] Bet round {bet_round_id} is still active, allowing cashout")
            else:
                if multiplier >= bet_round.crash_multiplier:
                    print(f"[REST API Cashout] Bet round {bet_round_id} crashed at {bet_round.crash_multiplier}x, multiplier {multiplier}x too high")
                    return Response({
                        'error': f"Too late, round {bet_round_id} crashed at {bet_round.crash_multiplier}x!"
                    }, status=400)
                else:
                    print(f"[REST API Cashout] Allowing late cashout for round {bet_round_id} at {multiplier}x (crashed at {bet_round.crash_multiplier}x)")
        except AviatorRound.DoesNotExist:
            return Response({'error': 'Bet round not found'}, status=400)
    else:
        if not current_state.get('is_active', False):
            print(f"[REST API Cashout] Current round not active")
            return Response({'error': 'Round is not active'}, status=400)

        current_crash_multiplier = current_state.get('crash_multiplier')
        if current_crash_multiplier and multiplier >= (current_crash_multiplier - 0.01):
            print(f"[REST API Cashout] Multiplier too high: {multiplier} >= {current_crash_multiplier} for current round {current_round_id}")
            return Response({
                'error': f"Too late, will crash at {current_crash_multiplier}x!"
            }, status=400)

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

        try:
            Transaction.objects.create(
                user=request.user,
                amount=Decimal(str(win_amount)),
                transaction_type='winning',
                description=f'Aviator Bet Cashout at {multiplier}x'
            )
        except Exception as e:
            logger.exception("Error creating transaction")
            print(f"[REST API Cashout] Transaction record failed but cashout succeeded: {e}")

    print(f"[REST API Cashout] SUCCESS: {request.user.username} cashed out at {multiplier}x for {win_amount} from round {bet_round_id}")

    # 🔧 NEW: Check if this should update global top winners
    if win_amount >= 500:  # Lower threshold for more frequent updates
        print(f"🏆 Significant win detected: {win_amount}, triggering global top winners refresh")
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
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
        'user_id': request.user.id,
        'server_time': int(time.time() * 1000),
        'updated_top_winners': win_amount >= 500
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

# 🔧 COMPLETELY REWRITTEN: Global top winners (all-time)
@api_view(['GET'])
def top_winners_today(request):
    """
    🔧 CHANGED: Get GLOBAL top winners (all-time) instead of just today
    """
    try:
        # 🔧 GLOBAL: Get all winning bets from all time, not just today
        winning_bets = AviatorBet.objects.filter(
            is_winner=True,
            cash_out_multiplier__isnull=False
        ).select_related('user', 'round').order_by('-created_at')[:100]  # Get more for better sorting
        
        print(f"🏆 Found {winning_bets.count()} winning bets (all-time)")
        
        # Calculate win amounts and create leaderboard
        winners_data = []
        for bet in winning_bets:
            try:
                win_amount = bet.win_amount()
                if win_amount > 0:
                    winner_data = {
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
                    }
                    winners_data.append(winner_data)
            except Exception as e:
                print(f"Error processing bet {bet.id}: {e}")
                continue
        
        # 🔧 GLOBAL: Sort by win amount and take top 15 for better display
        winners_data.sort(key=lambda x: x['win_amount'], reverse=True)
        top_winners = winners_data[:15]
        
        print(f"🏆 Returning {len(top_winners)} global top winners")
        for i, winner in enumerate(top_winners[:5]):  # Log top 5
            print(f"  {i+1}. {winner['username']}: KES {winner['win_amount']:.2f} at {winner['multiplier']}x")
        
        return Response(top_winners, status=200)
        
    except Exception as e:
        logger.exception("Error fetching global top winners")
        print(f"❌ Error in top_winners_today: {e}")
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

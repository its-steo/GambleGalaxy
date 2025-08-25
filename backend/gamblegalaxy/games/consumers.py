
#import asyncio
#from decimal import Decimal
#import json
#import random
#import time
#import math
#from channels.generic.websocket import AsyncWebsocketConsumer
#from channels.db import database_sync_to_async
#from django.db import transaction
#from django.utils import timezone
#from .models import AviatorRound, AviatorBet, SureOdd, CrashMultiplierSetting
#from wallet.models import Wallet, Transaction
#
#_game_loop_task = None
#_game_loop_lock = asyncio.Lock()
#
#_current_round_state = {
#    'round_id': None,
#    'crash_multiplier': None,
#    'current_multiplier': 1.0,
#    'is_active': False,
#    'is_betting': False,
#    'crashed': False,
#    'last_update': 0,
#    'round_start_time': None
#}
#_round_state_lock = asyncio.Lock()
#
#class AviatorConsumer(AsyncWebsocketConsumer):
#    async def connect(self):
#        await self.accept()
#        self.room_group_name = 'aviator_room'
#        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#        await self.ensure_single_game_loop()
#        await self.send_game_state()
#        await self.send_user_bet()  # Send user's active bet if any
#        await self.send_past_crashes()  # Send past crashes on connect
#
#    async def send_past_crashes(self):
#        past_rounds = await database_sync_to_async(list)(
#            AviatorRound.objects.filter(is_active=False).order_by('-ended_at')[:12].values('crash_multiplier')
#        )
#        await self.send(json.dumps({
#            "type": "past_crashes",
#            "crashes": [float(r['crash_multiplier']) for r in past_rounds]
#        }))
#
#    async def disconnect(self, close_code):
#        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
#
#    async def ensure_single_game_loop(self):
#        global _game_loop_task, _game_loop_lock
#        async with _game_loop_lock:
#            if _game_loop_task is None or _game_loop_task.done():
#                _game_loop_task = asyncio.create_task(self.run_aviator_game())
#
#    @staticmethod
#    async def get_current_round_state():
#        global _current_round_state, _round_state_lock
#        async with _round_state_lock:
#            return _current_round_state.copy()
#
#    @staticmethod
#    async def update_round_state(**kwargs):
#        global _current_round_state, _round_state_lock
#        async with _round_state_lock:
#            _current_round_state.update(kwargs)
#            _current_round_state['last_update'] = int(time.time() * 1000)
#
#    async def receive(self, text_data):
#        try:
#            data = json.loads(text_data)
#            action = data.get("action")
#            if action == "bet":
#                await self.handle_bet(data)
#            elif action == "cashout":
#                await self.handle_cashout(data)
#            elif action == "ping":
#                await self.send(json.dumps({"type": "pong", "server_time": int(time.time() * 1000)}))
#        except json.JSONDecodeError:
#            await self.send(json.dumps({"error": "Invalid message format"}))
#
#    async def send_to_group(self, event):
#        if "type_override" in event:
#            event["type"] = event.pop("type_override")
#        try:
#            await self.send(text_data=json.dumps(event))
#        except Exception as e:
#            pass
#
#    async def send_game_state(self):
#        state = await self.get_current_round_state()
#        try:
#            await self.send(json.dumps({
#                "type": "game_state_sync",
#                "round_id": state['round_id'],
#                "is_active": state['is_active'],
#                "is_betting": state['is_betting'],
#                "current_multiplier": state['current_multiplier'],
#                "crashed": state['crashed'],
#                "server_time": int(time.time() * 1000),
#                "round_start_time": state.get('round_start_time')
#            }))
#        except Exception:
#            pass
#
#    async def send_user_bet(self):
#        user = self.scope['user']
#        if not user.is_authenticated:
#            return
#        state = await self.get_current_round_state()
#        if state['round_id'] and state['is_active']:
#            existing_bet = await self.get_existing_bet(user, await self.get_round(state['round_id']))
#            if existing_bet:
#                await self.send(json.dumps({
#                    "type": "your_bet",
#                    "bet_id": existing_bet.id,
#                    "amount": float(existing_bet.amount),
#                    "auto_cashout": existing_bet.auto_cashout,
#                    "user_id": user.id,
#                    "round_id": state['round_id']
#                }))
#
#    async def run_aviator_game(self):
#        while True:
#            try:
#                # PHASE 0: CREATE ROUND BEFORE BETTING
#                crash_multiplier = await self.generate_crash_multiplier()
#                aviator_round = await database_sync_to_async(AviatorRound.objects.create)(
#                    crash_multiplier=crash_multiplier,
#                    is_active=True
#                )
#                await self.update_round_state(
#                    round_id=aviator_round.id,
#                    crash_multiplier=crash_multiplier,
#                    is_betting=True,
#                    is_active=False,
#                    crashed=False,
#                    current_multiplier=1.0,
#                    round_start_time=None
#                )
#
#                # PHASE 1: BETTING
#                await self.channel_layer.group_send(self.room_group_name, {
#                    'type': 'send_to_group',
#                    'type_override': 'betting_open',
#                    'message': 'Place your bets now!',
#                    'countdown': 5,
#                    'server_time': int(time.time() * 1000),
#                    'round_id': aviator_round.id
#                })
#                await asyncio.sleep(5)
#
#                # PHASE 2: START ROUND
#                round_start_time = int(time.time() * 1000)
#                await self.update_round_state(
#                    is_betting=False,
#                    is_active=True,
#                    round_start_time=round_start_time
#                )
#
#                # PHASE 3: ROUND START
#                multiplier = 1.00
#                sequence_number = 0
#                await self.channel_layer.group_send(self.room_group_name, {
#                    'type': 'send_to_group',
#                    'type_override': 'round_started',
#                    'round_id': aviator_round.id,
#                    'server_time': int(time.time() * 1000),
#                    'start_time': round_start_time
#                })
#
#                # PHASE 3: MULTIPLIER LOOP
#                while multiplier < crash_multiplier:
#                    # Fixed step progression based on current multiplier
#                    if multiplier < 2:
#                        step = 0.01
#                        delay = 0.1
#                    elif multiplier < 5:
#                        step = 0.02
#                        delay = 0.08
#                    elif multiplier < 20:
#                        step = 0.05
#                        delay = 0.06
#                    else:
#                        step = 0.1
#                        delay = 0.04
#
#                    # Increment multiplier
#                    new_multiplier = round(multiplier + step, 2)
#                    if new_multiplier >= crash_multiplier:
#                        multiplier = crash_multiplier
#                    else:
#                        multiplier = new_multiplier
#
#                    await self.update_round_state(current_multiplier=multiplier)
#                    if sequence_number % 10 == 0:  # Check every ~10 updates
#                        await self.auto_cashout(multiplier, aviator_round)
#                    await self.channel_layer.group_send(self.room_group_name, {
#                        'type': 'send_to_group',
#                        'type_override': 'multiplier_update',
#                        'multiplier': multiplier,
#                        'sequence': sequence_number,
#                        'server_time': int(time.time() * 1000),
#                        'elapsed': (time.time() - (round_start_time / 1000))
#                    })
#                    await asyncio.sleep(delay)
#                    if multiplier >= crash_multiplier:
#                        break
#                    sequence_number += 1
#
#                # PHASE 4: CRASH
#                await self.update_round_state(
#                    crashed=True,
#                    is_active=False,
#                    current_multiplier=crash_multiplier
#                )
#                await self.channel_layer.group_send(self.room_group_name, {
#                    'type': 'send_to_group',
#                    'type_override': 'round_crashed',
#                    'multiplier': crash_multiplier,
#                    'server_time': int(time.time() * 1000)
#                })
#                await self.end_round(aviator_round.id)
#                await asyncio.sleep(5)
#
#            except Exception as e:
#                await asyncio.sleep(5)
#
#    async def handle_bet(self, data):
#        user = self.scope['user']
#        if not user.is_authenticated:
#            await self.send(json.dumps({"error": "Authentication required"}))
#            return
#        amount = data.get('amount')
#        auto_cashout = data.get('auto_cashout')
#        current_state = await self.get_current_round_state()
#        if not current_state['is_betting']:
#            await self.send(json.dumps({"error": "Betting is closed"}))
#            return
#        try:
#            amount_decimal = Decimal(str(amount))
#            if amount_decimal <= 0:
#                raise ValueError
#        except (ValueError, TypeError):
#            await self.send(json.dumps({"error": "Invalid bet amount"}))
#            return
#        aviator_round = await self.get_round(current_state['round_id'])
#        existing_bet = await self.get_existing_bet(user, aviator_round)
#        if existing_bet:
#            await self.send(json.dumps({"error": "Bet has already been placed in this round"}))
#            return
#        success, wallet = await self.withdraw_wallet(user, amount_decimal)
#        if not success:
#            await self.send(json.dumps({"error": "Insufficient balance"}))
#            return
#        bet = await database_sync_to_async(AviatorBet.objects.create)(
#            user=user,
#            round=aviator_round,
#            amount=amount_decimal,
#            auto_cashout=auto_cashout
#        )
#        await database_sync_to_async(Transaction.objects.create)(
#            user=user,
#            amount=-amount_decimal,
#            transaction_type='withdraw',
#            description=f'Aviator bet of {amount_decimal}'
#        )
#        await self.send(json.dumps({
#            "type": "bet_success",
#            "bet_id": bet.id,
#            "amount": float(amount_decimal),
#            "new_balance": float(wallet.balance),
#            "round_id": aviator_round.id,
#            "user_id": user.id
#        }))
#        await self.channel_layer.group_send(self.room_group_name, {
#            'type': 'send_to_group',
#            'type_override': 'bet_placed',
#            'username': user.username,
#            'amount': float(amount_decimal),
#            'server_time': int(time.time() * 1000),
#            'user_id': user.id,
#            'bet_id': bet.id
#        })
#
#    async def handle_cashout(self, data):
#        bet_id = data.get('bet_id')
#        multiplier = data.get('multiplier')
#        user = self.scope['user']
#        request_id = data.get('request_id')
#        if not user.is_authenticated:
#            await self.send(json.dumps({"error": "Authentication required", "request_id": request_id}))
#            return
#        bet = await self.get_bet(bet_id)
#        if not bet or bet.user != user:
#            await self.send(json.dumps({"error": "Invalid bet", "request_id": request_id}))
#            return
#        current_state = await self.get_current_round_state()
#        if bet.round.id != current_state['round_id']:
#            await self.send(json.dumps({"error": "Bet is from a different round", "request_id": request_id}))
#            return
#        if multiplier >= current_state['crash_multiplier']:
#            await self.send(json.dumps({"error": "Too late! Plane crashed", "request_id": request_id}))
#            return
#        win_amount = round(float(bet.amount) * multiplier, 2)
#        bet.cash_out_multiplier = multiplier
#        bet.final_multiplier = multiplier
#        bet.is_winner = True
#        await database_sync_to_async(bet.save)()
#        wallet = await self.deposit_wallet(user, win_amount)
#        try:
#            await database_sync_to_async(Transaction.objects.create)(
#                user=user,
#                amount=win_amount,
#                transaction_type='winning',
#                description=f'Cashed out from Aviator at {multiplier}x'
#            )
#        except Exception as e:
#            await self.send(json.dumps({"error": f"Failed to create transaction: {str(e)}", "request_id": request_id}))
#            return
#        await self.channel_layer.group_send(self.room_group_name, {
#            'type': 'send_to_group',
#            'type_override': 'cash_out',
#            'username': user.username,
#            'multiplier': multiplier,
#            'amount': float(bet.amount),
#            'win_amount': win_amount,
#            'server_time': int(time.time() * 1000),
#            'user_id': user.id
#        })
#        await self.send(json.dumps({
#            "type": "cash_out_success",
#            "message": "Cashout successful",
#            "win_amount": win_amount,
#            "multiplier": multiplier,
#            "new_balance": float(wallet.balance),
#            "user_id": user.id,
#            "request_id": request_id,
#            "server_time": int(time.time() * 1000)
#        }))
#
#    async def auto_cashout(self, current_multiplier, aviator_round):
#        bets = await database_sync_to_async(list)(aviator_round.bets.filter(
#            cash_out_multiplier__isnull=True,
#            auto_cashout__lte=current_multiplier
#        ))
#        if not bets:
#            return
#        @database_sync_to_async
#        def process_batch():
#            with transaction.atomic():
#                for bet in bets:
#                    win_amount = round(float(bet.amount) * bet.auto_cashout, 2)
#                    bet.cash_out_multiplier = bet.auto_cashout
#                    bet.final_multiplier = bet.auto_cashout
#                    bet.is_winner = True
#                    bet.save()
#                    wallet = Wallet.objects.select_for_update().get(user=bet.user)
#                    wallet.balance += Decimal(str(win_amount))
#                    wallet.save()
#                    Transaction.objects.create(
#                        user=bet.user,
#                        amount=win_amount,
#                        transaction_type='winning',
#                        description=f'Auto-cashout on Aviator at {bet.auto_cashout}x'
#                    )
#        await process_batch()
#        batch_cashouts = []
#        for bet in bets:
#            win_amount = round(float(bet.amount) * bet.auto_cashout, 2)
#            batch_cashouts.append({
#                'username': bet.user.username,
#                'multiplier': bet.auto_cashout,
#                'amount': float(bet.amount),
#                'win_amount': win_amount,
#                'server_time': int(time.time() * 1000),
#                'user_id': bet.user.id
#            })
#        if batch_cashouts:
#            await self.channel_layer.group_send(self.room_group_name, {
#                'type': 'send_to_group',
#                'type_override': 'batch_cash_outs',
#                'cashouts': batch_cashouts
#            })
#
#    @database_sync_to_async
#    def withdraw_wallet(self, user, amount):
#        with transaction.atomic():
#            try:
#                wallet = Wallet.objects.select_for_update().get(user=user)
#                if wallet.balance >= Decimal(str(amount)):
#                    wallet.balance -= Decimal(str(amount))
#                    wallet.save()
#                    return True, wallet
#                return False, wallet
#            except Wallet.DoesNotExist:
#                return False, None
#
#    @database_sync_to_async
#    def deposit_wallet(self, user, amount):
#        with transaction.atomic():
#            try:
#                wallet = Wallet.objects.select_for_update().get(user=user)
#                wallet.balance += Decimal(str(amount))
#                wallet.save()
#                return wallet
#            except Wallet.DoesNotExist:
#                raise Exception("Wallet not found")
#
#    @database_sync_to_async
#    def get_wallet(self, user):
#        return Wallet.objects.get(user=user)
#
#    @database_sync_to_async
#    def end_round(self, round_id):
#        try:
#            aviator_round = AviatorRound.objects.select_related().get(id=round_id)
#            aviator_round.is_active = False
#            aviator_round.ended_at = timezone.now()
#            aviator_round.save()
#            for bet in aviator_round.bets.filter(cash_out_multiplier__isnull=True):
#                bet.final_multiplier = aviator_round.crash_multiplier
#                bet.is_winner = False
#                bet.save()
#        except AviatorRound.DoesNotExist:
#            pass
#
#    @database_sync_to_async
#    def get_verified_sure_odd(self):
#        odd = SureOdd.objects.filter(verified_by_admin=True, is_used=False).order_by('created_at').first()
#        if odd:
#            odd.is_used = True
#            odd.save()
#            return odd.odd
#        return None
#
#    @database_sync_to_async
#    def get_round(self, round_id):
#        return AviatorRound.objects.get(id=round_id)
#
#    @database_sync_to_async
#    def get_bet(self, bet_id):
#        return AviatorBet.objects.get(id=bet_id)
#
#    @database_sync_to_async
#    def get_existing_bet(self, user, round):
#        return AviatorBet.objects.filter(user=user, round=round).first()
#
#    @database_sync_to_async
#    def get_crash_multiplier_settings(self):
#        return list(CrashMultiplierSetting.objects.all())
#
#    @database_sync_to_async
#    def get_latest_round(self):
#        return AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()
#
#    async def generate_crash_multiplier(self):
#        settings = await self.get_crash_multiplier_settings()
#        if settings:
#            selected_range = random.choices(
#                settings,
#                weights=[s.weight for s in settings],
#                k=1
#            )[0]
#            min_val = selected_range.min_value
#            max_val = selected_range.max_value
#        else:
#            min_val, max_val = 1.00, 2.00
#        sure_odd = await self.get_verified_sure_odd()
#        if sure_odd:
#            return float(sure_odd)
#        return round(random.uniform(min_val, max_val), 2)

import asyncio
from decimal import Decimal
import json
import random
import time
import math
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
from django.utils import timezone
from .models import AviatorRound, AviatorBet, SureOdd, CrashMultiplierSetting
from wallet.models import Wallet, Transaction

_game_loop_task = None
_game_loop_lock = asyncio.Lock()

_current_round_state = {
    'round_id': None,
    'crash_multiplier': None,
    'current_multiplier': 1.0,
    'is_active': False,
    'is_betting': False,
    'crashed': False,
    'last_update': 0,
    'round_start_time': None
}
_round_state_lock = asyncio.Lock()

class AviatorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.room_group_name = 'aviator_room'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.ensure_single_game_loop()
        await self.send_game_state()
        await self.send_user_bet()
        await self.send_past_crashes()

    async def send_past_crashes(self):
        past_rounds = await database_sync_to_async(list)(
            AviatorRound.objects.filter(is_active=False, ended_at__isnull=False)
            .order_by('-ended_at')[:12].values('crash_multiplier')
        )
        await self.send(json.dumps({
            "type": "past_crashes",
            "crashes": [float(r['crash_multiplier']) for r in past_rounds]
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def ensure_single_game_loop(self):
        global _game_loop_task, _game_loop_lock
        async with _game_loop_lock:
            if _game_loop_task is None or _game_loop_task.done():
                _game_loop_task = asyncio.create_task(self.run_aviator_game())

    @staticmethod
    async def get_current_round_state():
        global _current_round_state, _round_state_lock
        async with _round_state_lock:
            return _current_round_state.copy()

    @staticmethod
    async def update_round_state(**kwargs):
        global _current_round_state, _round_state_lock
        async with _round_state_lock:
            _current_round_state.update(kwargs)
            _current_round_state['last_update'] = int(time.time() * 1000)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")
            if action == "bet":
                await self.handle_bet(data)
            elif action == "cashout":
                await self.handle_cashout(data)
            elif action == "ping":
                await self.send(json.dumps({"type": "pong", "server_time": int(time.time() * 1000)}))
        except json.JSONDecodeError:
            await self.send(json.dumps({"error": "Invalid message format"}))

    async def send_to_group(self, event):
        if "type_override" in event:
            event["type"] = event.pop("type_override")
        try:
            await self.send(text_data=json.dumps(event))
        except Exception as e:
            pass

    async def send_game_state(self):
        state = await self.get_current_round_state()
        try:
            await self.send(json.dumps({
                "type": "game_state_sync",
                "round_id": state['round_id'],
                "is_active": state['is_active'],
                "is_betting": state['is_betting'],
                "current_multiplier": state['current_multiplier'],
                "crashed": state['crashed'],
                "server_time": int(time.time() * 1000),
                "round_start_time": state.get('round_start_time')
            }))
        except Exception:
            pass

    async def send_user_bet(self):
        user = self.scope['user']
        if not user.is_authenticated:
            return
        state = await self.get_current_round_state()
        if state['round_id'] and state['is_active']:
            existing_bet = await self.get_existing_bet(user, await self.get_round(state['round_id']))
            if existing_bet:
                await self.send(json.dumps({
                    "type": "your_bet",
                    "bet_id": existing_bet.id,
                    "amount": float(existing_bet.amount),
                    "auto_cashout": existing_bet.auto_cashout,
                    "user_id": user.id,
                    "round_id": state['round_id']
                }))

    async def run_aviator_game(self):
        while True:
            try:
                # PHASE 0: CREATE ROUND BEFORE BETTING
                crash_multiplier = await self.generate_crash_multiplier()
                aviator_round = await database_sync_to_async(AviatorRound.objects.create)(
                    crash_multiplier=crash_multiplier,
                    is_active=True
                )
                await self.update_round_state(
                    round_id=aviator_round.id,
                    crash_multiplier=crash_multiplier,
                    is_betting=True,
                    is_active=False,
                    crashed=False,
                    current_multiplier=1.0,
                    round_start_time=None
                )

                # PHASE 1: BETTING
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'send_to_group',
                    'type_override': 'betting_open',
                    'message': 'Place your bets now!',
                    'countdown': 5,
                    'server_time': int(time.time() * 1000),
                    'round_id': aviator_round.id
                })
                await asyncio.sleep(5)

                # PHASE 2: START ROUND
                round_start_time = int(time.time() * 1000)
                await self.update_round_state(
                    is_betting=False,
                    is_active=True,
                    round_start_time=round_start_time
                )

                # PHASE 3: ROUND START
                multiplier = 1.00
                sequence_number = 0
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'send_to_group',
                    'type_override': 'round_started',
                    'round_id': aviator_round.id,
                    'server_time': int(time.time() * 1000),
                    'start_time': round_start_time
                })

                # PHASE 3: MULTIPLIER LOOP
                while multiplier < crash_multiplier:
                    # Fixed step progression based on current multiplier
                    if multiplier < 2:
                        step = 0.01
                        delay = 0.1
                    elif multiplier < 5:
                        step = 0.02
                        delay = 0.08
                    elif multiplier < 20:
                        step = 0.05
                        delay = 0.08
                    else:
                        step = 0.1
                        delay = 0.1

                    # Increment multiplier
                    new_multiplier = round(multiplier + step, 2)
                    if new_multiplier >= crash_multiplier:
                        multiplier = crash_multiplier
                    else:
                        multiplier = new_multiplier

                    await self.update_round_state(current_multiplier=multiplier)
                    if sequence_number % 10 == 0:  # Check every ~10 updates
                        await self.auto_cashout(multiplier, aviator_round)
                    start_time = time.time()
                    await self.channel_layer.group_send(self.room_group_name, {
                        'type': 'send_to_group',
                        'type_override': 'multiplier_update',
                        'multiplier': multiplier,
                        'sequence': sequence_number,
                        'server_time': int(time.time() * 1000),
                        'elapsed': (time.time() - (round_start_time / 1000))
                    })
                    print(f"[DEBUG] Sent multiplier_update {multiplier}x, took {(time.time() - start_time)*1000:.2f}ms")
                    await asyncio.sleep(delay)
                    if multiplier >= crash_multiplier:
                        break
                    sequence_number += 1

                # PHASE 4: CRASH
                await self.update_round_state(
                    crashed=True,
                    is_active=False,
                    current_multiplier=crash_multiplier
                )
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'send_to_group',
                    'type_override': 'round_crashed',
                    'multiplier': crash_multiplier,
                    'server_time': int(time.time() * 1000)
                })
                await self.end_round(aviator_round.id)
                await asyncio.sleep(5)

            except Exception as e:
                print(f"[ERROR] Game loop error: {e}")
                await asyncio.sleep(5)

    async def handle_bet(self, data):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.send(json.dumps({"error": "Authentication required"}))
            return
        amount = data.get('amount')
        auto_cashout = data.get('auto_cashout')
        current_state = await self.get_current_round_state()
        if not current_state['is_betting']:
            await self.send(json.dumps({"error": "Betting is closed"}))
            return
        try:
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= 0:
                raise ValueError
        except (ValueError, TypeError):
            await self.send(json.dumps({"error": "Invalid bet amount"}))
            return
        aviator_round = await self.get_round(current_state['round_id'])
        existing_bet = await self.get_existing_bet(user, aviator_round)
        if existing_bet:
            await self.send(json.dumps({"error": "Bet has already been placed in this round"}))
            return
        success, wallet = await self.withdraw_wallet(user, amount_decimal)
        if not success:
            await self.send(json.dumps({"error": "Insufficient balance"}))
            return
        bet = await database_sync_to_async(AviatorBet.objects.create)(
            user=user,
            round=aviator_round,
            amount=amount_decimal,
            auto_cashout=auto_cashout
        )
        await database_sync_to_async(Transaction.objects.create)(
            user=user,
            amount=-amount_decimal,
            transaction_type='withdraw',
            description=f'Aviator bet of {amount_decimal}'
        )
        await self.send(json.dumps({
            "type": "bet_success",
            "bet_id": bet.id,
            "amount": float(amount_decimal),
            "new_balance": float(wallet.balance),
            "round_id": aviator_round.id,
            "user_id": user.id
        }))
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'send_to_group',
            'type_override': 'bet_placed',
            'username': user.username,
            'amount': float(amount_decimal),
            'server_time': int(time.time() * 1000),
            'user_id': user.id,
            'bet_id': bet.id
        })

    async def handle_cashout(self, data):
        bet_id = data.get('bet_id')
        multiplier = data.get('multiplier')
        user = self.scope['user']
        request_id = data.get('request_id')
        if not user.is_authenticated:
            await self.send(json.dumps({"error": "Authentication required", "request_id": request_id}))
            return
        bet = await self.get_bet(bet_id)
        if not bet or bet.user != user:
            await self.send(json.dumps({"error": "Invalid bet", "request_id": request_id}))
            return
        current_state = await self.get_current_round_state()
        if bet.round.id != current_state['round_id']:
            await self.send(json.dumps({"error": "Bet is from a different round", "request_id": request_id}))
            return
        if multiplier >= current_state['crash_multiplier']:
            await self.send(json.dumps({"error": "Too late! Plane crashed", "request_id": request_id}))
            return
        win_amount = round(float(bet.amount) * multiplier, 2)
        bet.cash_out_multiplier = multiplier
        bet.final_multiplier = multiplier
        bet.is_winner = True
        await database_sync_to_async(bet.save)()
        wallet = await self.deposit_wallet(user, win_amount)
        try:
            await database_sync_to_async(Transaction.objects.create)(
                user=user,
                amount=win_amount,
                transaction_type='winning',
                description=f'Cashed out from Aviator at {multiplier}x'
            )
        except Exception as e:
            await self.send(json.dumps({"error": f"Failed to create transaction: {str(e)}", "request_id": request_id}))
            return
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'send_to_group',
            'type_override': 'cash_out',
            'username': user.username,
            'multiplier': multiplier,
            'amount': float(bet.amount),
            'win_amount': win_amount,
            'server_time': int(time.time() * 1000),
            'user_id': user.id
        })
        await self.send(json.dumps({
            "type": "cash_out_success",
            "message": "Cashout successful",
            "win_amount": win_amount,
            "multiplier": multiplier,
            "new_balance": float(wallet.balance),
            "user_id": user.id,
            "request_id": request_id,
            "server_time": int(time.time() * 1000)
        }))

    async def auto_cashout(self, current_multiplier, aviator_round):
        bets = await database_sync_to_async(list)(aviator_round.bets.filter(
            cash_out_multiplier__isnull=True,
            auto_cashout__lte=current_multiplier
        ))
        if not bets:
            return
        @database_sync_to_async
        def process_batch():
            with transaction.atomic():
                for bet in bets:
                    win_amount = round(float(bet.amount) * bet.auto_cashout, 2)
                    bet.cash_out_multiplier = bet.auto_cashout
                    bet.final_multiplier = bet.auto_cashout
                    bet.is_winner = True
                    bet.save()
                    wallet = Wallet.objects.select_for_update().get(user=bet.user)
                    wallet.balance += Decimal(str(win_amount))
                    wallet.save()
                    Transaction.objects.create(
                        user=bet.user,
                        amount=win_amount,
                        transaction_type='winning',
                        description=f'Auto-cashout on Aviator at {bet.auto_cashout}x'
                    )
        await process_batch()
        batch_cashouts = []
        for bet in bets:
            win_amount = round(float(bet.amount) * bet.auto_cashout, 2)
            batch_cashouts.append({
                'username': bet.user.username,
                'multiplier': bet.auto_cashout,
                'amount': float(bet.amount),
                'win_amount': win_amount,
                'server_time': int(time.time() * 1000),
                'user_id': bet.user.id
            })
        if batch_cashouts:
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'send_to_group',
                'type_override': 'batch_cash_outs',
                'cashouts': batch_cashouts
            })

    @database_sync_to_async
    def withdraw_wallet(self, user, amount):
        with transaction.atomic():
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
                if wallet.balance >= Decimal(str(amount)):
                    wallet.balance -= Decimal(str(amount))
                    wallet.save()
                    return True, wallet
                return False, wallet
            except Wallet.DoesNotExist:
                return False, None

    @database_sync_to_async
    def deposit_wallet(self, user, amount):
        with transaction.atomic():
            try:
                wallet = Wallet.objects.select_for_update().get(user=user)
                wallet.balance += Decimal(str(amount))
                wallet.save()
                return wallet
            except Wallet.DoesNotExist:
                raise Exception("Wallet not found")

    @database_sync_to_async
    def get_wallet(self, user):
        return Wallet.objects.get(user=user)

    @database_sync_to_async
    def end_round(self, round_id):
        try:
            aviator_round = AviatorRound.objects.select_related().get(id=round_id)
            aviator_round.is_active = False
            aviator_round.ended_at = timezone.now()
            aviator_round.save()
            for bet in aviator_round.bets.filter(cash_out_multiplier__isnull=True):
                bet.final_multiplier = aviator_round.crash_multiplier
                bet.is_winner = False
                bet.save()
        except AviatorRound.DoesNotExist:
            pass

    @database_sync_to_async
    def get_verified_sure_odd(self):
        odd = SureOdd.objects.filter(verified_by_admin=True, is_used=False).order_by('created_at').first()
        if odd:
            odd.is_used = True
            odd.save()
            return odd.odd
        return None

    @database_sync_to_async
    def get_round(self, round_id):
        return AviatorRound.objects.get(id=round_id)

    @database_sync_to_async
    def get_bet(self, bet_id):
        return AviatorBet.objects.get(id=bet_id)

    @database_sync_to_async
    def get_existing_bet(self, user, round):
        return AviatorBet.objects.filter(user=user, round=round).first()

    @database_sync_to_async
    def get_crash_multiplier_settings(self):
        return list(CrashMultiplierSetting.objects.all())

    @database_sync_to_async
    def get_latest_round(self):
        return AviatorRound.objects.filter(is_active=True).order_by('-start_time').first()

    async def generate_crash_multiplier(self):
        settings = await self.get_crash_multiplier_settings()
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
        sure_odd = await self.get_verified_sure_odd()
        if sure_odd:
            return float(sure_odd)
        return round(random.uniform(min_val, max_val), 2)
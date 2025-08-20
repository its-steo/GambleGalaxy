#import uuid
#from django.db import transaction as db_transaction
#from rest_framework import generics, permissions, status
#from rest_framework.response import Response
#from rest_framework.exceptions import ValidationError
#from .models import Wallet, Transaction
#from .serializers import WalletSerializer, TransactionSerializer
#from .payment import PaymentClient
#import logging
#
#logger = logging.getLogger('wallet')
#
#class WalletView(generics.RetrieveAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = WalletSerializer
#
#    def get_object(self):
#        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
#        return wallet
#
#class DepositView(generics.CreateAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def create(self, request, *args, **kwargs):
#        logger.info(f"Received deposit request: {request.data}")
#        serializer = self.get_serializer(data=request.data)
#        serializer.is_valid(raise_exception=True)
#        
#        user = self.request.user
#        amount = serializer.validated_data['amount']
#        phone_number = request.data.get('phone_number')
#        
#        if not phone_number or not phone_number.startswith('254'):
#            logger.error(f"Invalid phone number: {phone_number}")
#            raise ValidationError("Valid phone number starting with '254' is required.")
#
#        # Generate unique transaction ID
#        transaction_id = f"TXN-{uuid.uuid4().hex[:10]}"
#
#        # Initialize PaymentClient
#        payment_client = PaymentClient(callback_url='https://gamblegalaxy.onrender.com/api/v1/wallet/callback/')
#        try:
#            # Initiate STK Push
#            response = payment_client.initiate_stk_push(phone_number, amount, transaction_id)
#            if response.get('ResponseCode') != '0':
#                error_msg = response.get('error', 'Failed to initiate STK Push.')
#                logger.error(f"STK Push initiation failed for user {user.id}: {error_msg}")
#                raise ValidationError(error_msg)
#
#            checkout_request_id = response.get('CheckoutRequestID')
#            if not checkout_request_id:
#                logger.error(f"No CheckoutRequestID in response for user {user.id}: {response}")
#                raise ValidationError("Failed to get CheckoutRequestID from payment service.")
#
#            # Save pending transaction
#            serializer.save(
#                user=user,
#                transaction_type='deposit',
#                payment_transaction_id=checkout_request_id
#            )
#            logger.info(f"STK Push initiated for user {user.id}: CheckoutRequestID={checkout_request_id}")
#            return Response({
#                'message': 'STK Push initiated. Please complete the payment on your phone.',
#                'checkout_request_id': checkout_request_id
#            }, status=status.HTTP_202_ACCEPTED)
#        except Exception as e:
#            logger.error(f"Error in DepositView for user {user.id}: {str(e)}")
#            raise ValidationError(f"Failed to process deposit: {str(e)}")
#
#class WithdrawView(generics.CreateAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def perform_create(self, serializer):
#        serializer.save(user=self.request.user, transaction_type='withdraw')
#
#class TransactionHistoryView(generics.ListAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def get_queryset(self):
#        return Transaction.objects.filter(user=self.request.user).order_by('-timestamp')
#
#class CallbackView(generics.GenericAPIView):
#    permission_classes = []  # No authentication required for payment callbacks
#
#    def post(self, request, *args, **kwargs):
#        try:
#            data = request.data.get('Body', {}).get('stkCallback', {})
#            logger.info(f"Callback received: {data}")
#
#            checkout_request_id = data.get('CheckoutRequestID')
#            result_code = data.get('ResultCode')
#            result_desc = data.get('ResultDesc')
#
#            if not checkout_request_id or not result_code:
#                logger.error(f"Invalid callback data: {data}")
#                return Response({'status': 'Invalid callback data'}, status=status.HTTP_400_BAD_REQUEST)
#
#            with db_transaction.atomic():
#                try:
#                    transaction = Transaction.objects.select_for_update().get(
#                        payment_transaction_id=checkout_request_id,
#                        transaction_type='deposit'
#                    )
#                except Transaction.DoesNotExist:
#                    logger.error(f"No transaction found for CheckoutRequestID: {checkout_request_id}")
#                    return Response({'status': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
#
#                if transaction.description == 'completed':
#                    logger.info(f"Transaction {checkout_request_id} already processed")
#                    return Response({'status': 'Transaction already processed'}, status=status.HTTP_200_OK)
#
#                if result_code == '0':  # Success
#                    callback_metadata = data.get('CallbackMetadata', {}).get('Item', [])
#                    payment_receipt = next((item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'), None)
#                    amount = next((float(item['Value']) for item in callback_metadata if item['Name'] == 'Amount'), None)
#                    phone_number = next((item['Value'] for item in callback_metadata if item['Name'] == 'PhoneNumber'), None)
#
#                    if not payment_receipt or not amount or not phone_number:
#                        logger.error(f"Incomplete callback metadata: {callback_metadata}")
#                        return Response({'status': 'Incomplete callback data'}, status=status.HTTP_400_BAD_REQUEST)
#
#                    if amount != float(transaction.amount):
#                        logger.error(f"Amount mismatch for {checkout_request_id}: Expected {transaction.amount}, Got {amount}")
#                        return Response({'status': 'Amount mismatch'}, status=status.HTTP_400_BAD_REQUEST)
#
#                    wallet = Wallet.objects.get(user=transaction.user)
#                    wallet.deposit(amount)
#
#                    transaction.description = 'completed'
#                    transaction.payment_transaction_id = payment_receipt
#                    transaction.save()
#
#                    logger.info(f"Deposit completed for user {transaction.user.id}: {payment_receipt}")
#                    return Response({'status': 'Deposit processed successfully'}, status=status.HTTP_200_OK)
#                else:
#                    transaction.description = f'failed: {result_desc}'
#                    transaction.save()
#                    logger.error(f"Deposit failed for {checkout_request_id}: {result_desc}")
#                    return Response({'status': f'Deposit failed: {result_desc}'}, status=status.HTTP_400_BAD_REQUEST)
#
#        except Exception as e:
#            logger.error(f"Error processing callback for {checkout_request_id}: {str(e)}")
#            return Response({'status': f'Error processing callback: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#import uuid
#from django.db import transaction as db_transaction
#from rest_framework import generics, permissions, status
#from rest_framework.response import Response
#from rest_framework.exceptions import ValidationError
#from .models import Wallet, Transaction
#from .serializers import WalletSerializer, TransactionSerializer
#from .payment import PaymentClient
#import logging
#
#logger = logging.getLogger('wallet')
#
#class WalletView(generics.RetrieveAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = WalletSerializer
#
#    def get_object(self):
#        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
#        return wallet
#
#class DepositView(generics.CreateAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def create(self, request, *args, **kwargs):
#        logger.info(f"Received deposit request: {request.data}")
#        serializer = self.get_serializer(data=request.data)
#        serializer.is_valid(raise_exception=True)
#        
#        user = self.request.user
#        amount = serializer.validated_data['amount']
#        phone_number = request.data.get('phone_number')
#        
#        if not phone_number or not phone_number.startswith('254'):
#            logger.error(f"Invalid phone number: {phone_number}")
#            raise ValidationError("Valid phone number starting with '254' is required.")
#
#        # Generate unique transaction ID
#        transaction_id = f"TXN-{uuid.uuid4().hex[:10]}"
#
#        # Initialize PaymentClient
#        payment_client = PaymentClient(callback_url='https://gamblegalaxy.onrender.com/api/v1/wallet/callback/')
#        try:
#            # Initiate STK Push
#            response = payment_client.initiate_stk_push(phone_number, amount, transaction_id)
#            if response.get('ResponseCode') != '0':
#                error_msg = response.get('error', 'Failed to initiate STK Push.')
#                logger.error(f"STK Push initiation failed for user {user.id}: {error_msg}")
#                raise ValidationError(error_msg)
#
#            checkout_request_id = response.get('CheckoutRequestID')
#            if not checkout_request_id:
#                logger.error(f"No CheckoutRequestID in response for user {user.id}: {response}")
#                raise ValidationError("Failed to get CheckoutRequestID from payment service.")
#
#            # Save pending transaction
#            serializer.save(
#                user=user,
#                transaction_type='deposit',
#                payment_transaction_id=checkout_request_id
#            )
#            logger.info(f"STK Push initiated for user {user.id}: CheckoutRequestID={checkout_request_id}")
#            return Response({
#                'message': 'STK Push initiated. Please complete the payment on your phone.',
#                'checkout_request_id': checkout_request_id
#            }, status=status.HTTP_202_ACCEPTED)
#        except Exception as e:
#            logger.error(f"Error in DepositView for user {user.id}: {str(e)}")
#            raise ValidationError(f"Failed to process deposit: {str(e)}")
#
#class WithdrawView(generics.CreateAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def create(self, request, *args, **kwargs):
#        logger.info(f"Received withdrawal request: {request.data}")
#        serializer = self.get_serializer(data=request.data)
#        serializer.is_valid(raise_exception=True)
#
#        user = self.request.user
#        amount = serializer.validated_data['amount']
#        withdrawal_method = request.data.get('withdrawalMethod')
#        account_details = request.data.get('phoneNumber') or request.data.get('accountNumber')
#
#        if withdrawal_method not in ['mpesa', 'bank']:
#            logger.error(f"Invalid withdrawal method: {withdrawal_method}")
#            raise ValidationError("Withdrawal method must be 'mpesa' or 'bank'.")
#
#        # Generate unique transaction ID
#        transaction_id = f"TXN-{uuid.uuid4().hex[:10]}"
#
#        with db_transaction.atomic():
#            wallet = Wallet.objects.get(user=user)
#            if not wallet.withdraw(amount):
#                logger.error(f"Insufficient balance for user {user.id}: {amount}")
#                raise ValidationError("Insufficient balance for withdrawal.")
#
#            # Save pending withdrawal transaction
#            transaction = serializer.save(
#                user=user,
#                transaction_type='withdraw',
#                payment_transaction_id=transaction_id,
#                account_details=account_details,
#                description='pending'  # Mark as pending for admin review
#            )
#
#            logger.info(f"Withdrawal request created for user {user.id}: {transaction_id}")
#            return Response({
#                'message': 'Withdrawal request submitted. Awaiting admin approval.',
#                'transaction_id': transaction_id
#            }, status=status.HTTP_202_ACCEPTED)
#
#class TransactionHistoryView(generics.ListAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def get_queryset(self):
#        return Transaction.objects.filter(user=self.request.user).order_by('-timestamp')
#
#class CallbackView(generics.GenericAPIView):
#    permission_classes = []  # No authentication required for payment callbacks
#
#    def post(self, request, *args, **kwargs):
#        try:
#            data = request.data.get('Body', {}).get('stkCallback', {})
#            logger.info(f"Callback received: {data}")
#
#            checkout_request_id = data.get('CheckoutRequestID')
#            result_code = data.get('ResultCode')
#            result_desc = data.get('ResultDesc')
#
#            if not checkout_request_id or not result_code:
#                logger.error(f"Invalid callback data: {data}")
#                return Response({'status': 'Invalid callback data'}, status=status.HTTP_400_BAD_REQUEST)
#
#            with db_transaction.atomic():
#                try:
#                    transaction = Transaction.objects.select_for_update().get(
#                        payment_transaction_id=checkout_request_id
#                    )
#                except Transaction.DoesNotExist:
#                    logger.error(f"No transaction found for CheckoutRequestID: {checkout_request_id}")
#                    return Response({'status': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
#
#                if transaction.description == 'completed':
#                    logger.info(f"Transaction {checkout_request_id} already processed")
#                    return Response({'status': 'Transaction already processed'}, status=status.HTTP_200_OK)
#
#                if result_code == '0':  # Success
#                    callback_metadata = data.get('CallbackMetadata', {}).get('Item', [])
#                    payment_receipt = next((item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'), None)
#                    amount = next((float(item['Value']) for item in callback_metadata if item['Name'] == 'Amount'), None)
#                    account_details = next((item['Value'] for item in callback_metadata if item['Name'] == 'PhoneNumber'), None)
#
#                    if not payment_receipt or not amount or not account_details:
#                        logger.error(f"Incomplete callback metadata: {callback_metadata}")
#                        return Response({'status': 'Incomplete callback data'}, status=status.HTTP_400_BAD_REQUEST)
#
#                    if amount != float(transaction.amount):
#                        logger.error(f"Amount mismatch for {checkout_request_id}: Expected {transaction.amount}, Got {amount}")
#                        return Response({'status': 'Amount mismatch'}, status=status.HTTP_400_BAD_REQUEST)
#
#                    if transaction.transaction_type == 'deposit':
#                        wallet = Wallet.objects.get(user=transaction.user)
#                        wallet.deposit(amount)
#                    # For withdrawals, balance is already deducted, so just update status
#                    transaction.description = 'completed'
#                    transaction.payment_transaction_id = payment_receipt
#                    transaction.account_details = account_details
#                    transaction.save()
#
#                    logger.info(f"Transaction completed for user {transaction.user.id}: {payment_receipt}")
#                    return Response({'status': 'Transaction processed successfully'}, status=status.HTTP_200_OK)
#                else:
#                    if transaction.transaction_type == 'deposit':
#                        transaction.description = f'failed: {result_desc}'
#                        transaction.save()
#                    else:  # For failed withdrawals, refund the amount to the wallet
#                        wallet = Wallet.objects.get(user=transaction.user)
#                        wallet.deposit(transaction.amount)
#                        transaction.description = f'failed: {result_desc}'
#                        transaction.save()
#                    logger.error(f"Transaction failed for {checkout_request_id}: {result_desc}")
#                    return Response({'status': f'Transaction failed: {result_desc}'}, status=status.HTTP_400_BAD_REQUEST)
#
#        except Exception as e:
#            logger.error(f"Error processing callback for {checkout_request_id}: {str(e)}")
#            return Response({'status': f'Error processing callback: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#import uuid
#from django.db import transaction as db_transaction
#from rest_framework import generics, permissions, status
#from rest_framework.response import Response
#from rest_framework.exceptions import ValidationError
#from .models import Wallet, Transaction
#from .serializers import WalletSerializer, TransactionSerializer
#from .payment import PaymentClient
#from django.core.mail import send_mail
#from django.template.loader import render_to_string
#from django.utils.html import strip_tags
#from django.conf import settings
#import logging
#
#logger = logging.getLogger('wallet')
#
#class WalletView(generics.RetrieveAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = WalletSerializer
#
#    def get_object(self):
#        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
#        return wallet
#
#class DepositView(generics.CreateAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def create(self, request, *args, **kwargs):
#        logger.info(f"Received deposit request: {request.data}")
#        serializer = self.get_serializer(data=request.data)
#        serializer.is_valid(raise_exception=True)
#        
#        user = self.request.user
#        amount = serializer.validated_data['amount']
#        phone_number = request.data.get('phone_number')
#        
#        if not phone_number or not phone_number.startswith('254'):
#            logger.error(f"Invalid phone number: {phone_number}")
#            raise ValidationError("Valid phone number starting with '254' is required.")
#
#        # Generate unique transaction ID
#        transaction_id = f"TXN-{uuid.uuid4().hex[:10]}"
#
#        # Initialize PaymentClient
#        payment_client = PaymentClient(callback_url='https://gamblegalaxy.onrender.com/api/v1/wallet/callback/')
#        try:
#            # Initiate STK Push
#            response = payment_client.initiate_stk_push(phone_number, amount, transaction_id)
#            if response.get('ResponseCode') != '0':
#                error_msg = response.get('error', 'Failed to initiate STK Push.')
#                logger.error(f"STK Push initiation failed for user {user.id}: {error_msg}")
#                raise ValidationError(error_msg)
#
#            checkout_request_id = response.get('CheckoutRequestID')
#            if not checkout_request_id:
#                logger.error(f"No CheckoutRequestID in response for user {user.id}: {response}")
#                raise ValidationError("Failed to get CheckoutRequestID from payment service.")
#
#            # Set context to skip balance update for pending deposit
#            serializer.context['update_balance'] = False
#
#            # Save pending transaction (without updating balance)
#            serializer.save(
#                user=user,
#                transaction_type='deposit',
#                payment_transaction_id=checkout_request_id
#            )
#            logger.info(f"STK Push initiated for user {user.id}: CheckoutRequestID={checkout_request_id}")
#            return Response({
#                'message': 'STK Push initiated. Please complete the payment on your phone.',
#                'checkout_request_id': checkout_request_id
#            }, status=status.HTTP_202_ACCEPTED)
#        except Exception as e:
#            logger.error(f"Error in DepositView for user {user.id}: {str(e)}")
#            raise ValidationError(f"Failed to process deposit: {str(e)}")
#
#class WithdrawView(generics.CreateAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def create(self, request, *args, **kwargs):
#        logger.info(f"Received withdrawal request: {request.data}")
#        serializer = self.get_serializer(data=request.data)
#        serializer.is_valid(raise_exception=True)
#
#        user = self.request.user
#        amount = serializer.validated_data['amount']
#        withdrawal_method = request.data.get('withdrawalMethod')
#        account_details = request.data.get('phoneNumber') or request.data.get('accountNumber')
#
#        if withdrawal_method not in ['mpesa', 'bank']:
#            logger.error(f"Invalid withdrawal method: {withdrawal_method}")
#            raise ValidationError("Withdrawal method must be 'mpesa' or 'bank'.")
#
#        # Generate unique transaction ID
#        transaction_id = f"TXN-{uuid.uuid4().hex[:10]}"
#
#        wallet = Wallet.objects.get(user=user)
#        
#        # Check for sufficient balance before proceeding
#        if wallet.balance < amount:
#            logger.error(f"Insufficient balance for user {user.id}: {amount}")
#            raise ValidationError("Insufficient balance for withdrawal.")
#
#        with db_transaction.atomic():
#            # Save pending withdrawal transaction (serializer handles balance deduction)
#            transaction = serializer.save(
#                user=user,
#                transaction_type='withdraw',
#                payment_transaction_id=transaction_id,
#                account_details=account_details,
#                description='pending'  # Mark as pending for admin review
#            )
#
#        logger.info(f"Withdrawal request created for user {user.id}: {transaction_id}")
#        return Response({
#            'message': 'Withdrawal request submitted. Awaiting admin approval.',
#            'transaction_id': transaction_id
#        }, status=status.HTTP_202_ACCEPTED)
#
#class TransactionHistoryView(generics.ListAPIView):
#    permission_classes = [permissions.IsAuthenticated]
#    serializer_class = TransactionSerializer
#
#    def get_queryset(self):
#        return Transaction.objects.filter(user=self.request.user).order_by('-timestamp')
#
#class CallbackView(generics.GenericAPIView):
#    permission_classes = []  # No authentication required for payment callbacks
#
#    def post(self, request, *args, **kwargs):
#        try:
#            data = request.data.get('Body', {}).get('stkCallback', {})
#            logger.info(f"Callback received: {data}")
#
#            checkout_request_id = data.get('CheckoutRequestID')
#            result_code = data.get('ResultCode')
#            result_desc = data.get('ResultDesc')
#
#            if not checkout_request_id or not result_code:
#                logger.error(f"Invalid callback data: {data}")
#                return Response({'status': 'Invalid callback data'}, status=status.HTTP_400_BAD_REQUEST)
#
#            with db_transaction.atomic():
#                try:
#                    transaction = Transaction.objects.select_for_update().get(
#                        payment_transaction_id=checkout_request_id
#                    )
#                except Transaction.DoesNotExist:
#                    logger.error(f"No transaction found for CheckoutRequestID: {checkout_request_id}")
#                    return Response({'status': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
#
#                if transaction.description == 'completed':
#                    logger.info(f"Transaction {checkout_request_id} already processed")
#                    return Response({'status': 'Transaction already processed'}, status=status.HTTP_200_OK)
#
#                if result_code == '0':  # Success
#                    callback_metadata = data.get('CallbackMetadata', {}).get('Item', [])
#                    payment_receipt = next((item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'), None)
#                    amount = next((float(item['Value']) for item in callback_metadata if item['Name'] == 'Amount'), None)
#                    account_details = next((item['Value'] for item in callback_metadata if item['Name'] == 'PhoneNumber'), None)
#
#                    if not payment_receipt or not amount or not account_details:
#                        logger.error(f"Incomplete callback metadata: {callback_metadata}")
#                        return Response({'status': 'Incomplete callback data'}, status=status.HTTP_400_BAD_REQUEST)
#
#                    if amount != float(transaction.amount):
#                        logger.error(f"Amount mismatch for {checkout_request_id}: Expected {transaction.amount}, Got {amount}")
#                        return Response({'status': 'Amount mismatch'}, status=status.HTTP_400_BAD_REQUEST)
#
#                    if transaction.transaction_type == 'deposit':
#                        wallet = Wallet.objects.get(user=transaction.user)
#                        wallet.deposit(amount)
#                    # For withdrawals, balance is already deducted, so just update status
#                    transaction.description = 'completed'
#                    transaction.payment_transaction_id = payment_receipt
#                    transaction.account_details = account_details
#                    transaction.save()
#
#                    # Send confirmation email
#                    try:
#                        template_name = 'emails/deposit_confirmation.html' if transaction.transaction_type == 'deposit' else 'emails/withdraw_confirmation.html'
#                        subject = f"{'Deposit' if transaction.transaction_type == 'deposit' else 'Withdrawal'} Confirmation"
#                        context = {
#                            'user': transaction.user,
#                            'amount': transaction.amount,
#                            'transaction_id': payment_receipt,
#                            'timestamp': transaction.timestamp,
#                            'account_details': account_details,
#                        }
#                        html_message = render_to_string(template_name, context)
#                        plain_message = strip_tags(html_message)
#                        send_mail(
#                            subject,
#                            plain_message,
#                            settings.DEFAULT_FROM_EMAIL,
#                            [transaction.user.email],
#                            html_message=html_message,
#                            fail_silently=False,
#                        )
#                        logger.info(f"Confirmation email sent to {transaction.user.email} for transaction {payment_receipt}")
#                    except Exception as e:
#                        logger.error(f"Failed to send confirmation email for transaction {payment_receipt}: {str(e)}")
#
#                    logger.info(f"Transaction completed for user {transaction.user.id}: {payment_receipt}")
#                    return Response({'status': 'Transaction processed successfully'}, status=status.HTTP_200_OK)
#                else:
#                    if transaction.transaction_type == 'deposit':
#                        transaction.description = f'failed: {result_desc}'
#                        transaction.save()
#                    else:  # For failed withdrawals, refund the amount to the wallet
#                        wallet = Wallet.objects.get(user=transaction.user)
#                        wallet.deposit(transaction.amount)
#                        transaction.description = f'failed: {result_desc}'
#                        transaction.save()
#                    logger.error(f"Transaction failed for {checkout_request_id}: {result_desc}")
#                    return Response({'status': f'Transaction failed: {result_desc}'}, status=status.HTTP_400_BAD_REQUEST)
#
#        except Exception as e:
#            logger.error(f"Error processing callback for {checkout_request_id}: {str(e)}")
#            return Response({'status': f'Error processing callback: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

import uuid
from django.db import transaction as db_transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer
from .payment import PaymentClient
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger('wallet')

class WalletView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet

class DepositView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def create(self, request, *args, **kwargs):
        logger.info(f"Received deposit request: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = self.request.user
        amount = serializer.validated_data['amount']
        deposit_method = request.data.get('deposit_method', 'stk_push')
        phone_number = request.data.get('phone_number') if deposit_method == 'stk_push' else None
        mpesa_code = request.data.get('mpesa_code') if deposit_method == 'manual' else None
        
        if deposit_method == 'stk_push':
            if not phone_number or not phone_number.startswith('254'):
                logger.error(f"Invalid phone number: {phone_number}")
                raise ValidationError("Valid phone number starting with '254' is required for STK Push.")

            transaction_id = f"TXN-{uuid.uuid4().hex[:10]}"
            payment_client = PaymentClient(callback_url='https://gamblegalaxy.onrender.com/api/v1/wallet/callback/')
            try:
                response = payment_client.initiate_stk_push(phone_number, amount, transaction_id)
                logger.info(f"STK Push response for user {user.id}: {response}")
                if response.get('ResponseCode') != '0':
                    error_msg = response.get('error', 'Failed to initiate STK Push.')
                    logger.error(f"STK Push initiation failed for user {user.id}: {error_msg}")
                    raise ValidationError(error_msg)

                checkout_request_id = response.get('CheckoutRequestID')
                if not checkout_request_id:
                    logger.error(f"No CheckoutRequestID in response for user {user.id}: {response}")
                    raise ValidationError("Failed to get CheckoutRequestID from payment service.")

                serializer.context['update_balance'] = False
                transaction = serializer.save(
                    user=user,
                    transaction_type='deposit',
                    payment_transaction_id=checkout_request_id,
                    description='pending: STK initiated - awaiting callback and admin'
                )
                logger.info(f"STK Push transaction saved for user {user.id}: ID={transaction.id}, CheckoutRequestID={checkout_request_id}")
                return Response({
                    'message': 'STK Push initiated. Please complete the payment on your phone.',
                    'checkout_request_id': checkout_request_id,
                    'transaction_id': transaction.id
                }, status=status.HTTP_202_ACCEPTED)
            except Exception as e:
                logger.error(f"Error in DepositView for user {user.id}: {str(e)}")
                raise ValidationError(f"Failed to process deposit: {str(e)}")
        
        elif deposit_method == 'manual':
            transaction_id = f"TXN-{uuid.uuid4().hex[:10]}"
            serializer.context['update_balance'] = False
            transaction = serializer.save(
                user=user,
                transaction_type='deposit',
                payment_transaction_id=transaction_id,
                mpesa_code=mpesa_code,
                description='pending: Manual deposit - awaiting admin verification'
            )
            logger.info(f"Manual deposit transaction saved for user {user.id}: ID={transaction.id}, M-Pesa Code={mpesa_code}")
            return Response({
                'message': 'Manual deposit request submitted with M-Pesa code. Awaiting admin approval.',
                'transaction_id': transaction_id
            }, status=status.HTTP_202_ACCEPTED)
        
        else:
            logger.error(f"Invalid deposit method: {deposit_method}")
            raise ValidationError("Deposit method must be 'manual' or 'stk_push'.")

class WithdrawView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def create(self, request, *args, **kwargs):
        logger.info(f"Received withdrawal request: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.request.user
        amount = serializer.validated_data['amount']
        withdrawal_method = request.data.get('withdrawalMethod')
        account_details = request.data.get('phoneNumber') or request.data.get('accountNumber')

        if withdrawal_method not in ['mpesa', 'bank']:
            logger.error(f"Invalid withdrawal method: {withdrawal_method}")
            raise ValidationError("Withdrawal method must be 'mpesa' or 'bank'.")

        wallet = Wallet.objects.get(user=user)
        
        if wallet.balance < amount:
            logger.error(f"Insufficient balance for user {user.id}: {amount}")
            raise ValidationError("Insufficient balance for withdrawal.")

        with db_transaction.atomic():
            transaction = serializer.save(
                user=user,
                transaction_type='withdraw',
                payment_transaction_id=f"TXN-{uuid.uuid4().hex[:10]}",
                account_details=account_details,
                description='pending'
            )

        logger.info(f"Withdrawal request created for user {user.id}: {transaction.payment_transaction_id}")
        return Response({
            'message': 'Withdrawal request submitted. Awaiting admin approval.',
            'transaction_id': transaction.payment_transaction_id
        }, status=status.HTTP_202_ACCEPTED)

class TransactionHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-timestamp')

class CallbackView(generics.GenericAPIView):
    permission_classes = []

    def post(self, request, *args, **kwargs):
        try:
            data = request.data.get('Body', {}).get('stkCallback', {})
            logger.info(f"Callback received: {data}")

            checkout_request_id = data.get('CheckoutRequestID')
            result_code = data.get('ResultCode')
            result_desc = data.get('ResultDesc')

            if not checkout_request_id or not result_code:
                logger.error(f"Invalid callback data: {data}")
                return Response({'status': 'Invalid callback data'}, status=status.HTTP_400_BAD_REQUEST)

            with db_transaction.atomic():
                try:
                    transaction = Transaction.objects.select_for_update().get(
                        payment_transaction_id=checkout_request_id
                    )
                except Transaction.DoesNotExist:
                    logger.error(f"No transaction found for CheckoutRequestID: {checkout_request_id}")
                    return Response({'status': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

                if transaction.description.startswith('completed'):
                    logger.info(f"Transaction {checkout_request_id} already processed")
                    return Response({'status': 'Transaction already processed'}, status=status.HTTP_200_OK)

                if result_code == '0':
                    callback_metadata = data.get('CallbackMetadata', {}).get('Item', [])
                    payment_receipt = next((item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'), None)
                    amount = next((float(item['Value']) for item in callback_metadata if item['Name'] == 'Amount'), None)
                    account_details = next((item['Value'] for item in callback_metadata if item['Name'] == 'PhoneNumber'), None)

                    if not payment_receipt or not amount or not account_details:
                        logger.error(f"Incomplete callback metadata: {callback_metadata}")
                        return Response({'status': 'Incomplete callback data'}, status=status.HTTP_400_BAD_REQUEST)

                    if amount != float(transaction.amount):
                        logger.error(f"Amount mismatch for {checkout_request_id}: Expected {transaction.amount}, Got {amount}")
                        return Response({'status': 'Amount mismatch'}, status=status.HTTP_400_BAD_REQUEST)

                    transaction.description = f'pending: STK success ({result_desc}) - awaiting admin verification'
                    transaction.payment_transaction_id = payment_receipt
                    transaction.account_details = account_details
                    transaction.save()
                    logger.info(f"Callback updated transaction {transaction.id}: Receipt={payment_receipt}, Status=pending")

                    try:
                        subject = "Pending STK Deposit Awaiting Verification"
                        context = {
                            'user': transaction.user,
                            'amount': transaction.amount,
                            'receipt': payment_receipt,
                            'timestamp': transaction.timestamp,
                            'account_details': account_details,
                        }
                        html_message = render_to_string('emails/pending_deposit.html', context)
                        plain_message = strip_tags(html_message)
                        send_mail(
                            subject,
                            plain_message,
                            settings.DEFAULT_FROM_EMAIL,
                            [settings.ADMIN_EMAIL],
                            html_message=html_message,
                            fail_silently=False,
                        )
                        logger.info(f"Admin notification sent for pending STK deposit {payment_receipt}")
                    except Exception as e:
                        logger.error(f"Failed to send admin notification: {str(e)}")

                    return Response({'status': 'Callback received; transaction pending admin approval'}, status=status.HTTP_200_OK)
                else:
                    transaction.description = f'failed: {result_desc}'
                    transaction.save()
                    logger.error(f"Transaction failed for {checkout_request_id}: {result_desc}")
                    return Response({'status': f'Transaction failed: {result_desc}'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error processing callback for {checkout_request_id}: {str(e)}")
            return Response({'status': f'Error processing callback: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
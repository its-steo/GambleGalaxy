import uuid
from django.db import transaction as db_transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer
from .payment import PaymentClient
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

    def perform_create(self, serializer):
        user = self.request.user
        amount = serializer.validated_data['amount']
        phone_number = self.request.data.get('phone_number')

        if not phone_number or not phone_number.startswith('254'):
            raise ValidationError("Valid phone number starting with '254' is required.")

        # Generate unique transaction ID
        transaction_id = f"TXN-{uuid.uuid4().hex[:10]}"

        # Initialize PaymentClient
        payment_client = PaymentClient(callback_url='https://gamblegalaxy.onrender.com/api/v1/wallet/callback/')
        try:
            # Initiate STK Push
            response = payment_client.initiate_stk_push(phone_number, amount, transaction_id)
            if response.get('ResponseCode') != '0':
                error_msg = response.get('error', 'Failed to initiate STK Push.')
                logger.error(f"STK Push initiation failed for user {user.id}: {error_msg}")
                raise ValidationError(error_msg)

            checkout_request_id = response.get('CheckoutRequestID')
            if not checkout_request_id:
                logger.error(f"No CheckoutRequestID in response for user {user.id}: {response}")
                raise ValidationError("Failed to get CheckoutRequestID from payment service.")

            # Save pending transaction with CheckoutRequestID
            serializer.save(
                user=user,
                transaction_type='deposit',
                payment_transaction_id=checkout_request_id,
                description='pending'
            )
            logger.info(f"STK Push initiated for user {user.id}: CheckoutRequestID={checkout_request_id}")
            return Response({
                'message': 'STK Push sent. Please enter your MPESA PIN to complete the deposit.',
                'checkout_request_id': checkout_request_id
            }, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            logger.error(f"Error in DepositView for user {user.id}: {str(e)}")
            raise ValidationError(f"Failed to initiate deposit: {str(e)}")

class WithdrawView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, transaction_type='withdraw')

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
                        payment_transaction_id=checkout_request_id,
                        transaction_type='deposit'
                    )
                except Transaction.DoesNotExist:
                    logger.error(f"No transaction found for CheckoutRequestID: {checkout_request_id}")
                    return Response({'status': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

                if transaction.description == 'completed':
                    logger.info(f"Transaction {checkout_request_id} already processed")
                    return Response({'status': 'Transaction already processed'}, status=status.HTTP_200_OK)

                if result_code == '0':  # Success
                    callback_metadata = data.get('CallbackMetadata', {}).get('Item', [])
                    payment_receipt = next((item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'), None)
                    amount = next((float(item['Value']) for item in callback_metadata if item['Name'] == 'Amount'), None)
                    phone_number = next((item['Value'] for item in callback_metadata if item['Name'] == 'PhoneNumber'), None)

                    if not payment_receipt or not amount or not phone_number:
                        logger.error(f"Incomplete callback metadata: {callback_metadata}")
                        return Response({'status': 'Incomplete callback data'}, status=status.HTTP_400_BAD_REQUEST)

                    # Verify amount matches
                    if amount != float(transaction.amount):
                        logger.error(f"Amount mismatch for {checkout_request_id}: Expected {transaction.amount}, Got {amount}")
                        transaction.description = 'failed: Amount mismatch'
                        transaction.save()
                        return Response({'status': 'Amount mismatch'}, status=status.HTTP_400_BAD_REQUEST)

                    # Update wallet balance
                    wallet = Wallet.objects.select_for_update().get(user=transaction.user)
                    wallet.deposit(amount)

                    # Update transaction
                    transaction.description = 'completed'
                    transaction.payment_transaction_id = payment_receipt
                    transaction.save()

                    logger.info(f"Deposit completed for user {transaction.user.id}: {payment_receipt}")
                    return Response({
                        'status': 'Deposit processed successfully',
                        'message': f'Deposit of {amount} successful for user {transaction.user.id}'
                    }, status=status.HTTP_200_OK)
                else:
                    # Transaction failed
                    transaction.description = f'failed: {result_desc}'
                    transaction.save()
                    logger.error(f"Deposit failed for {checkout_request_id}: {result_desc}")
                    return Response({
                        'status': 'Deposit failed',
                        'message': f'Deposit failed: {result_desc}'
                    }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error processing callback for {checkout_request_id}: {str(e)}")
            return Response({
                'status': 'Error processing callback',
                'message': f'Error processing callback: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
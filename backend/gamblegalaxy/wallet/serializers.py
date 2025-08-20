#from rest_framework import serializers
#from .models import Wallet, Transaction
#from django.db import transaction as db_transaction
#import logging
#
#logger = logging.getLogger('wallet')
#
#class WalletSerializer(serializers.ModelSerializer):
#    class Meta:
#        model = Wallet
#        fields = ['balance']
#
#class TransactionSerializer(serializers.ModelSerializer):
#    description = serializers.CharField(required=False, allow_blank=True)
#    payment_transaction_id = serializers.CharField(required=False, allow_blank=True)
#    transaction_type = serializers.CharField(required=False, default='deposit')  # Make optional with default
#
#    class Meta:
#        model = Transaction
#        fields = ['id', 'transaction_type', 'amount', 'timestamp', 'description', 'payment_transaction_id']
#        read_only_fields = ['id', 'timestamp', 'payment_transaction_id']
#
#    def validate_amount(self, value):
#        if value <= 0:
#            logger.error(f"Invalid amount: {value}")
#            raise serializers.ValidationError("Amount must be greater than zero.")
#        return value
#
#    def validate_transaction_type(self, value):
#        valid_types = ['deposit', 'withdraw', 'winning', 'bonus', 'penalty']
#        if value not in valid_types:
#            logger.error(f"Invalid transaction type: {value}. Valid types: {valid_types}")
#            raise serializers.ValidationError(f"Invalid transaction type. Must be one of: {valid_types}")
#        return value
#
#    def validate(self, data):
#        logger.info(f"Validating transaction data: {data}")
#        return super().validate(data)
#
#    def create(self, validated_data):
#        user = self.context['request'].user
#        amount = validated_data['amount']
#        tx_type = validated_data.get('transaction_type', 'deposit')  # Use default if not provided
#        description = validated_data.get('description', '')
#        payment_transaction_id = validated_data.get('payment_transaction_id', '')
#
#        with db_transaction.atomic():
#            wallet, created = Wallet.objects.get_or_create(user=user)
#
#            if tx_type in ['deposit', 'winning', 'bonus']:
#                wallet.deposit(amount)
#            elif tx_type in ['withdraw', 'penalty']:
#                if not wallet.withdraw(amount):
#                    logger.error(f"Insufficient balance for user {user.id}: {amount}")
#                    raise serializers.ValidationError("Insufficient balance for withdrawal.")
#
#            transaction = Transaction.objects.create(
#                user=user,
#                amount=amount,
#                transaction_type=tx_type,
#                description=description,
#                payment_transaction_id=payment_transaction_id
#            )
#            logger.info(f"Created transaction for user {user.id}: {transaction.id}")
#            return transaction

#from rest_framework import serializers
#from .models import Wallet, Transaction
#from django.db import transaction as db_transaction
#import logging
#
#logger = logging.getLogger('wallet')
#
#class WalletSerializer(serializers.ModelSerializer):
#    class Meta:
#        model = Wallet
#        fields = ['balance']
#
#class TransactionSerializer(serializers.ModelSerializer):
#    description = serializers.CharField(required=False, allow_blank=True)
#    payment_transaction_id = serializers.CharField(required=False, allow_blank=True)
#    transaction_type = serializers.CharField(required=False, default='deposit')
#    account_details = serializers.CharField(required=False, allow_blank=True)
#
#    class Meta:
#        model = Transaction
#        fields = ['id', 'transaction_type', 'amount', 'timestamp', 'description', 'payment_transaction_id', 'account_details']
#        read_only_fields = ['id', 'timestamp', 'payment_transaction_id']
#
#    def validate_amount(self, value):
#        if value <= 0:
#            logger.error(f"Invalid amount: {value}")
#            raise serializers.ValidationError("Amount must be greater than zero.")
#        return value
#
#    def validate_transaction_type(self, value):
#        valid_types = ['deposit', 'withdraw', 'winning', 'bonus', 'penalty']
#        if value not in valid_types:
#            logger.error(f"Invalid transaction type: {value}. Valid types: {valid_types}")
#            raise serializers.ValidationError(f"Invalid transaction type. Must be one of: {valid_types}")
#        return value
#
#    def validate(self, data):
#        logger.info(f"Validating transaction data: {data}")
#        if data.get('transaction_type') == 'withdraw':
#            account_details = self.context['request'].data.get('phoneNumber') or self.context['request'].data.get('accountNumber')
#            withdrawal_method = self.context['request'].data.get('withdrawalMethod')
#            
#            if not account_details:
#                logger.error("Missing account details for withdrawal")
#                raise serializers.ValidationError("Phone number or account number is required for withdrawal.")
#            
#            if withdrawal_method == 'mpesa' and not account_details.startswith('254'):
#                logger.error(f"Invalid phone number for M-Pesa withdrawal: {account_details}")
#                raise serializers.ValidationError("Phone number must start with '254' for M-Pesa withdrawals.")
#            
#            data['account_details'] = account_details
#
#        return super().validate(data)
#
#    def create(self, validated_data):
#        user = self.context['request'].user
#        amount = validated_data['amount']
#        tx_type = validated_data.get('transaction_type', 'deposit')
#        description = validated_data.get('description', '')
#        payment_transaction_id = validated_data.get('payment_transaction_id', '')
#        account_details = validated_data.get('account_details', '')
#
#        with db_transaction.atomic():
#            wallet, created = Wallet.objects.get_or_create(user=user)
#
#            if tx_type in ['deposit', 'winning', 'bonus']:
#                wallet.deposit(amount)
#            elif tx_type in ['withdraw', 'penalty']:
#                if not wallet.withdraw(amount):
#                    logger.error(f"Insufficient balance for user {user.id}: {amount}")
#                    raise serializers.ValidationError("Insufficient balance for withdrawal.")
#
#            transaction = Transaction.objects.create(
#                user=user,
#                amount=amount,
#                transaction_type=tx_type,
#                description=description,
#                payment_transaction_id=payment_transaction_id,
#                account_details=account_details
#            )
#            logger.info(f"Created transaction for user {user.id}: {transaction.id}")
#            return transaction

#from rest_framework import serializers
#from .models import Wallet, Transaction
#from django.db import transaction as db_transaction
#import logging
#
#logger = logging.getLogger('wallet')
#
#class WalletSerializer(serializers.ModelSerializer):
#    class Meta:
#        model = Wallet
#        fields = ['balance']
#
#class TransactionSerializer(serializers.ModelSerializer):
#    description = serializers.CharField(required=False, allow_blank=True)
#    payment_transaction_id = serializers.CharField(required=False, allow_blank=True)
#    transaction_type = serializers.CharField(required=False, default='deposit')
#    account_details = serializers.CharField(required=False, allow_blank=True)
#
#    class Meta:
#        model = Transaction
#        fields = ['id', 'transaction_type', 'amount', 'timestamp', 'description', 'payment_transaction_id', 'account_details']
#        read_only_fields = ['id', 'timestamp', 'payment_transaction_id']
#
#    def validate_amount(self, value):
#        if value <= 0:
#            logger.error(f"Invalid amount: {value}")
#            raise serializers.ValidationError("Amount must be greater than zero.")
#        return value
#
#    def validate_transaction_type(self, value):
#        valid_types = ['deposit', 'withdraw', 'winning', 'bonus', 'penalty']
#        if value not in valid_types:
#            logger.error(f"Invalid transaction type: {value}. Valid types: {valid_types}")
#            raise serializers.ValidationError(f"Invalid transaction type. Must be one of: {valid_types}")
#        return value
#
#    def validate(self, data):
#        logger.info(f"Validating transaction data: {data}")
#        if data.get('transaction_type') == 'withdraw':
#            account_details = self.context['request'].data.get('phoneNumber') or self.context['request'].data.get('accountNumber')
#            withdrawal_method = self.context['request'].data.get('withdrawalMethod')
#            
#            if not account_details:
#                logger.error("Missing account details for withdrawal")
#                raise serializers.ValidationError("Phone number or account number is required for withdrawal.")
#            
#            if withdrawal_method == 'mpesa' and not account_details.startswith('254'):
#                logger.error(f"Invalid phone number for M-Pesa withdrawal: {account_details}")
#                raise serializers.ValidationError("Phone number must start with '254' for M-Pesa withdrawals.")
#            
#            data['account_details'] = account_details
#
#        return super().validate(data)
#
#    def create(self, validated_data):
#        user = self.context['request'].user
#        amount = validated_data['amount']
#        tx_type = validated_data.get('transaction_type', 'deposit')
#        description = validated_data.get('description', '')
#        payment_transaction_id = validated_data.get('payment_transaction_id', '')
#        account_details = validated_data.get('account_details', '')
#
#        with db_transaction.atomic():
#            wallet, created = Wallet.objects.get_or_create(user=user)
#
#            # Only update balance if explicitly allowed (default True)
#            if self.context.get('update_balance', True):
#                if tx_type in ['deposit', 'winning', 'bonus']:
#                    wallet.deposit(amount)
#                elif tx_type in ['withdraw', 'penalty']:
#                    if not wallet.withdraw(amount):
#                        logger.error(f"Insufficient balance for user {user.id}: {amount}")
#                        raise serializers.ValidationError("Insufficient balance for withdrawal.")
#
#            transaction = Transaction.objects.create(
#                user=user,
#                amount=amount,
#                transaction_type=tx_type,
#                description=description,
#                payment_transaction_id=payment_transaction_id,
#                account_details=account_details
#            )
#            logger.info(f"Created transaction for user {user.id}: {transaction.id}")
#            return transaction


from rest_framework import serializers
from .models import Wallet, Transaction
from django.db import transaction as db_transaction
import logging

logger = logging.getLogger('wallet')

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['balance']

class TransactionSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True)
    payment_transaction_id = serializers.CharField(required=False, allow_blank=True)
    transaction_type = serializers.CharField(required=False, default='deposit')
    account_details = serializers.CharField(required=False, allow_blank=True)
    mpesa_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Transaction
        fields = ['id', 'transaction_type', 'amount', 'timestamp', 'description', 'payment_transaction_id', 'account_details', 'mpesa_code']
        read_only_fields = ['id', 'timestamp', 'payment_transaction_id']

    def validate_amount(self, value):
        if value <= 0:
            logger.error(f"Invalid amount: {value}")
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_transaction_type(self, value):
        valid_types = ['deposit', 'withdraw', 'winning', 'bonus', 'penalty']
        if value not in valid_types:
            logger.error(f"Invalid transaction type: {value}. Valid types: {valid_types}")
            raise serializers.ValidationError(f"Invalid transaction type. Must be one of: {valid_types}")
        return value

    def validate(self, data):
        logger.info(f"Validating transaction data: {data}")
        tx_type = data.get('transaction_type')
        if tx_type == 'deposit':
            deposit_method = self.context['request'].data.get('deposit_method', 'stk_push')
            if deposit_method == 'manual':
                mpesa_code = self.context['request'].data.get('mpesa_code')
                if not mpesa_code:
                    logger.error("Missing M-Pesa code for manual deposit")
                    raise serializers.ValidationError("M-Pesa code is required for manual deposits.")
                data['mpesa_code'] = mpesa_code
                data['description'] = 'pending: Manual deposit - awaiting admin verification'
            elif deposit_method == 'stk_push':
                phone_number = self.context['request'].data.get('phone_number')
                if not phone_number or not phone_number.startswith('254'):
                    logger.error(f"Invalid phone number for STK Push: {phone_number}")
                    raise serializers.ValidationError("Valid phone number starting with '254' is required for STK Push.")
                data['description'] = 'pending: STK initiated - awaiting callback and admin'
            else:
                logger.error(f"Invalid deposit method: {deposit_method}")
                raise serializers.ValidationError("Deposit method must be 'manual' or 'stk_push'.")
        elif tx_type == 'withdraw':
            account_details = self.context['request'].data.get('phoneNumber') or self.context['request'].data.get('accountNumber')
            withdrawal_method = self.context['request'].data.get('withdrawalMethod')
            if not account_details:
                logger.error("Missing account details for withdrawal")
                raise serializers.ValidationError("Phone number or account number is required for withdrawal.")
            if withdrawal_method == 'mpesa' and not account_details.startswith('254'):
                logger.error(f"Invalid phone number for M-Pesa withdrawal: {account_details}")
                raise serializers.ValidationError("Phone number must start with '254' for M-Pesa withdrawals.")
            data['account_details'] = account_details

        return super().validate(data)

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data['amount']
        tx_type = validated_data.get('transaction_type', 'deposit')
        description = validated_data.get('description', '')
        payment_transaction_id = validated_data.get('payment_transaction_id', '')
        account_details = validated_data.get('account_details', '')
        mpesa_code = validated_data.get('mpesa_code', '')

        with db_transaction.atomic():
            wallet, created = Wallet.objects.get_or_create(user=user)

            if self.context.get('update_balance', True):
                if tx_type in ['deposit', 'winning', 'bonus']:
                    wallet.deposit(amount)
                elif tx_type in ['withdraw', 'penalty']:
                    if not wallet.withdraw(amount):
                        logger.error(f"Insufficient balance for user {user.id}: {amount}")
                        raise serializers.ValidationError("Insufficient balance for withdrawal.")

            transaction = Transaction.objects.create(
                user=user,
                amount=amount,
                transaction_type=tx_type,
                description=description,
                payment_transaction_id=payment_transaction_id,
                account_details=account_details,
                mpesa_code=mpesa_code
            )
            logger.info(f"Created transaction for user {user.id}: {transaction.id}")
            return transaction
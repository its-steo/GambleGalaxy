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
    transaction_type = serializers.CharField(required=False, default='deposit')  # Make optional with default

    class Meta:
        model = Transaction
        fields = ['id', 'transaction_type', 'amount', 'timestamp', 'description', 'payment_transaction_id']
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
        return super().validate(data)

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data['amount']
        tx_type = validated_data.get('transaction_type', 'deposit')  # Use default if not provided
        description = validated_data.get('description', '')
        payment_transaction_id = validated_data.get('payment_transaction_id', '')

        with db_transaction.atomic():
            wallet, created = Wallet.objects.get_or_create(user=user)

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
                payment_transaction_id=payment_transaction_id
            )
            logger.info(f"Created transaction for user {user.id}: {transaction.id}")
            return transaction
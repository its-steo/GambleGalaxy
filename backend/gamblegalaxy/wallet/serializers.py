from rest_framework import serializers
from .models import Wallet, Transaction


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['balance']


class TransactionSerializer(serializers.ModelSerializer):
    # Optional description field for context
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Transaction
        fields = ['id', 'transaction_type', 'amount', 'timestamp', 'description']
        read_only_fields = ['id', 'timestamp']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data['amount']
        tx_type = validated_data['transaction_type']
        description = validated_data.get('description', '')

        wallet, created = Wallet.objects.get_or_create(user=user)

        # Handle wallet logic based on type
        if tx_type == 'deposit' or tx_type == 'winning' or tx_type == 'bonus':
            wallet.deposit(amount)
        elif tx_type == 'withdraw' or tx_type == 'penalty':
            if not wallet.withdraw(amount):
                raise serializers.ValidationError("Insufficient balance for withdrawal.")
        else:
            raise serializers.ValidationError("Invalid transaction type.")

        # Save the transaction
        transaction = Transaction.objects.create(
            user=user,
            amount=amount,
            transaction_type=tx_type,
            description=description
        )
        return transaction
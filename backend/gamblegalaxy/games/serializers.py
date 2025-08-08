from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils import timezone

from .models import AviatorRound, AviatorBet, SureOdd
from wallet.models import Wallet, Transaction
from django.db import transaction


class AviatorRoundSerializer(serializers.ModelSerializer):
    color = serializers.SerializerMethodField()

    class Meta:
        model = AviatorRound
        fields = ['id', 'crash_multiplier', 'start_time', 'is_active', 'color']

    def get_color(self, obj):
        return obj.get_crash_color()


class AviatorBetSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    round_crash = serializers.FloatField(source='round.crash_multiplier', read_only=True)

    class Meta:
        model = AviatorBet
        fields = ['id', 'user', 'username', 'round', 'round_crash', 'amount', 'auto_cashout', 'cash_out_multiplier', 'final_multiplier', 'is_winner', 'created_at']
        read_only_fields = ['id', 'username', 'round_crash', 'cash_out_multiplier', 'final_multiplier', 'is_winner', 'created_at']

    def validate(self, data):
        round = data.get("round")
        user = data.get("user")
        amount = data.get("amount")

        if not round or not user or amount is None:
            raise ValidationError("Missing required fields.")

        if not round.is_active:
            raise ValidationError("You cannot bet on an inactive round.")

        if amount <= 0:
            raise ValidationError("Bet amount must be positive.")

        try:
            wallet = Wallet.objects.get(user=user)
        except Wallet.DoesNotExist:
            raise ValidationError("Wallet not found.")

        if wallet.balance < amount:
            raise ValidationError("Insufficient wallet balance.")

        return data

    def create(self, validated_data):
        user = validated_data['user']
        amount = validated_data['amount']

        # Debug: Log model fields
        print(f"AviatorBet model fields: {list(AviatorBet._meta.get_fields())}")
        print(f"Transaction model fields: {list(Transaction._meta.get_fields())}")

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            wallet.balance -= amount
            wallet.save()

            # Debug: Log transaction parameters
            print(f"Creating transaction for user: {user.username}, amount: {-amount}, transaction_type: withdraw")

            try:
                Transaction.objects.create(
                    user=user,
                    amount=-amount,
                    transaction_type='withdraw',
                    description=f"Aviator bet of {amount}"
                )
            except Exception as e:
                print(f"Error creating transaction: {str(e)}")
                raise ValidationError(f"Failed to create transaction: {str(e)}")

        return super().create(validated_data)

    def update(self, instance, validated_data):
        if instance.cash_out_multiplier is not None:
            raise ValidationError("You already cashed out this bet.")

        round = instance.round
        if not round or round.crash_multiplier is None:
            raise ValidationError("Crash multiplier not yet available for this round.")

        # Determine cashout multiplier
        multiplier = validated_data.get('cash_out_multiplier')
        if not multiplier and instance.auto_cashout and instance.auto_cashout < round.crash_multiplier:
            multiplier = instance.auto_cashout
        elif not multiplier:
            multiplier = round.crash_multiplier

        if multiplier >= round.crash_multiplier:
            raise ValidationError("Too late! Plane crashed.")

        win_amount = round_amount(multiplier * instance.amount)

        # Debug: Log model fields
        print(f"AviatorBet model fields: {list(AviatorBet._meta.get_fields())}")
        print(f"Transaction model fields: {list(Transaction._meta.get_fields())}")

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=instance.user)
            wallet.balance += win_amount
            wallet.save()

            # Debug: Log transaction parameters
            print(f"Creating transaction for user: {instance.user.username}, amount: {win_amount}, transaction_type: winning")

            try:
                Transaction.objects.create(
                    user=instance.user,
                    amount=win_amount,
                    transaction_type='winning',
                    description=f"Aviator win of {win_amount} at x{multiplier}"
                )
            except Exception as e:
                print(f"Error creating transaction: {str(e)}")
                raise ValidationError(f"Failed to create transaction: {str(e)}")

        instance.cash_out_multiplier = multiplier
        instance.final_multiplier = multiplier
        instance.is_winner = True
        instance.save()

        return instance


def round_amount(value, decimals=2):
    return round(float(value), decimals)


class SureOddSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = SureOdd
        fields = ['id', 'user', 'username', 'odd', 'is_used', 'verified_by_admin', 'created_at']


class TopWinnerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    avatar = serializers.URLField(source='user.avatar', read_only=True)

    class Meta:
        model = AviatorBet
        fields = ['username', 'avatar', 'amount', 'cash_out_multiplier']
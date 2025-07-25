from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils import timezone

from .models import AviatorRound, AviatorBet, SureOdd
from wallet.models import Wallet, Transaction


class AviatorRoundSerializer(serializers.ModelSerializer):
    color = serializers.SerializerMethodField()

    class Meta:
        model = AviatorRound
        fields = [
            'id',
            'crash_multiplier',
            'start_time',
            'is_active',
            'color',
        ]

    def get_color(self, obj):
        return obj.get_crash_color()


class AviatorBetSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    round_crash = serializers.FloatField(source='round.crash_multiplier', read_only=True)

    class Meta:
        model = AviatorBet
        fields = [
            'id',
            'user',
            'username',
            'round',
            'round_crash',
            'amount',
            'auto_cashout',
            'cashed_out_at',
            'is_winner',
            'created_at',
        ]
        read_only_fields = ['id', 'username', 'round_crash', 'is_winner', 'cashed_out_at']

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

        wallet = Wallet.objects.get(user=user)
        wallet.balance -= amount
        wallet.save()

        Transaction.objects.create(
            user=user,
            amount=-amount,
            type="BET_PLACED",
            description=f"Aviator bet of {amount}"
        )

        return super().create(validated_data)

    def update(self, instance, validated_data):
        if instance.cashed_out_at:
            raise ValidationError("You already cashed out this bet.")

        round = instance.round
        if not round or round.crash_multiplier is None:
            raise ValidationError("Crash multiplier not yet available for this round.")

        # Determine cashout multiplier
        if instance.auto_cashout and instance.auto_cashout < round.crash_multiplier:
            multiplier = instance.auto_cashout
        else:
            multiplier = round.crash_multiplier

        win_amount = round_amount(multiplier * instance.amount)

        wallet = Wallet.objects.get(user=instance.user)
        wallet.balance += win_amount
        wallet.save()

        Transaction.objects.create(
            user=instance.user,
            amount=win_amount,
            type="BET_WIN",
            description=f"Aviator win of {win_amount} at x{multiplier}"
        )

        instance.cashed_out_at = multiplier
        instance.is_winner = True
        instance.save()

        return instance


def round_amount(value, decimals=2):
    return round(float(value), decimals)


class SureOddSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = SureOdd
        fields = [
            'id',
            'user',
            'username',
            'odd',
            'is_used',
            'verified_by_admin',
            'created_at',
        ]


class TopWinnerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    avatar = serializers.URLField(source='user.avatar', read_only=True)

    class Meta:
        model = AviatorBet
        fields = ['username', 'avatar', 'amount', 'cashed_out_at']
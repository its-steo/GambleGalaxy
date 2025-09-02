from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import logging
import datetime

from .models import AviatorRound, AviatorBet, SureOdd, PredictorPackage, PredictorPurchase
from wallet.models import Wallet, Transaction
from django.db import transaction

logger = logging.getLogger(__name__)

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

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            wallet.balance -= amount
            wallet.save()

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

        multiplier = validated_data.get('cash_out_multiplier')
        if not multiplier:
            raise ValidationError("Cashout multiplier is required.")

        if multiplier >= round.crash_multiplier:
            raise ValidationError("Cannot cash out: multiplier exceeds crash point.")

        win_amount = round(float(instance.amount) * multiplier, 2)

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=instance.user)
            wallet.balance += Decimal(str(win_amount))
            wallet.save()

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

class PredictorPackageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PredictorPackage
        fields = ['id', 'name', 'image_url', 'predictions_per_day', 'validity_days', 'price', 'created_at']

    def get_image_url(self, obj):
        return obj.get_image_url()

class PredictorPurchaseSerializer(serializers.ModelSerializer):
    predictor_package_id = serializers.PrimaryKeyRelatedField(
        queryset=PredictorPackage.objects.all(),
        source='predictor_package',
        write_only=True
    )
    predictor_package = PredictorPackageSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    predictions_remaining = serializers.SerializerMethodField()

    class Meta:
        model = PredictorPurchase
        fields = ['id', 'user', 'username', 'predictor_package_id', 'predictor_package', 'purchase_date', 'expiry_date', 'predictions_used_today', 'predictions_remaining']
        read_only_fields = ['purchase_date', 'expiry_date', 'predictions_used_today', 'predictions_remaining']

    def get_predictions_remaining(self, obj):
        """Calculate remaining predictions for the day."""
        today = timezone.now().date()
        last_reset_date = obj.last_reset_date
        # Convert last_reset_date to date if it's a datetime
        if isinstance(last_reset_date, datetime.datetime):
            logger.warning(f"last_reset_date is datetime for PredictorPurchase {obj.id}: {last_reset_date}")
            last_reset_date = last_reset_date.date()
        if last_reset_date < today:
            return obj.predictor_package.predictions_per_day
        return max(obj.predictor_package.predictions_per_day - obj.predictions_used_today, 0)

    def create(self, validated_data):
        user = validated_data['user']
        predictor_package = validated_data['predictor_package']
        amount = predictor_package.price

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            if wallet.balance < amount:
                raise serializers.ValidationError("Insufficient wallet balance.")

            wallet.balance -= amount
            wallet.save()

            logger.info(f"Creating transaction for user {user.username}, amount: {-amount}, package: {predictor_package.name}")
            Transaction.objects.create(
                user=user,
                amount=-amount,
                transaction_type='withdraw',
                description=f"Predictor purchase: {predictor_package.name}"
            )

            purchase = PredictorPurchase.objects.create(
                user=user,
                predictor_package=predictor_package,
                expiry_date=timezone.now() + timezone.timedelta(days=predictor_package.validity_days)
            )
            return purchase
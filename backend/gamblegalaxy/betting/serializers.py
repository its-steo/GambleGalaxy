from rest_framework import serializers
from decimal import Decimal, ROUND_HALF_UP
from .models import Match, Bet, BetSelection, SureOddSlip
from wallet.models import Wallet  # ✅ Correct import


# -----------------------
# MATCH SERIALIZER
# -----------------------
class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = '__all__'


# -----------------------
# BET SELECTION SERIALIZER
# -----------------------
class BetSelectionSerializer(serializers.ModelSerializer):
    match = MatchSerializer(read_only=True)
    match_id = serializers.PrimaryKeyRelatedField(
        queryset=Match.objects.all(),
        source='match',
        write_only=True
    )

    class Meta:
        model = BetSelection
        fields = ['id', 'match', 'match_id', 'selected_option', 'is_correct']
        read_only_fields = ['id', 'match', 'is_correct']


# -----------------------
# BET SERIALIZER
# -----------------------
class BetSerializer(serializers.ModelSerializer):
    selections = BetSelectionSerializer(many=True)
    expected_payout = serializers.SerializerMethodField()

    class Meta:
        model = Bet
        fields = [
            'id', 'user', 'amount', 'total_odds',
            'status', 'placed_at', 'selections', 'expected_payout'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'placed_at',
            'total_odds', 'expected_payout'
        ]

    def get_expected_payout(self, obj):
        if obj.status == 'pending' and obj.amount and obj.total_odds:
            payout = Decimal(str(obj.amount)) * Decimal(str(obj.total_odds))
            return payout.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return Decimal("0.00")

    def create(self, validated_data):
        user = self.context['request'].user
        selections_data = validated_data.pop('selections')
        amount = validated_data.get('amount')

        # Validate wallet
        wallet = Wallet.objects.filter(user=user).first()
        if not wallet:
            raise serializers.ValidationError("Wallet not found for the user.")
        if wallet.balance < amount:
            raise serializers.ValidationError("Insufficient wallet balance.")

        # Deduct amount
        wallet.balance -= amount
        wallet.save()

        # Create Bet object
        bet = Bet.objects.create(user=user, amount=amount)
        total_odds = Decimal('1.0')

        for selection_data in selections_data:
            match = selection_data['match']
            option = selection_data['selected_option']

            if match.status != 'upcoming':
                raise serializers.ValidationError(f"Match '{match}' is not open for betting.")

            # Determine odds based on option
            if option == 'home_win':
                odds = match.odds_home_win
            elif option == 'draw':
                odds = match.odds_draw
            elif option == 'away_win':
                odds = match.odds_away_win
            else:
                raise serializers.ValidationError("Invalid option selected.")

            if odds is None:
                raise serializers.ValidationError(f"No odds available for {option} on match {match}.")

            total_odds *= Decimal(str(odds))

            # Create selection
            BetSelection.objects.create(
                bet=bet,
                match=match,
                selected_option=option,
                odds=odds
            )

        bet.total_odds = total_odds.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        bet.save()
        return bet


# -----------------------
# SURE ODD SLIP SERIALIZER
# -----------------------
class SureOddSlipSerializer(serializers.ModelSerializer):
    matches = MatchSerializer(many=True, read_only=True)
    expected_payout = serializers.SerializerMethodField()

    class Meta:
        model = SureOddSlip
        fields = [
            'code', 'matches', 'amount_paid',
            'has_paid', 'is_used', 'revealed_predictions',
            'shown_to_user_at', 'expected_payout'
        ]

    def get_expected_payout(self, obj):
        if obj.amount_paid and obj.matches.exists():
            odds = Decimal("1.0")
            for match in obj.matches.all():
                # Use average odds as fallback calculation
                odds_list = [match.odds_home_win, match.odds_draw, match.odds_away_win]
                valid_odds = [Decimal(str(o)) for o in odds_list if o]
                if valid_odds:
                    odds *= sum(valid_odds) / len(valid_odds)
            payout = Decimal(str(obj.amount_paid)) * odds
            return payout.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return Decimal("0.00")

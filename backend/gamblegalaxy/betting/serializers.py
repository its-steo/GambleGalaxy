from rest_framework import serializers
from .models import Match, Bet, BetSelection, SureOddSlip
from wallet.models import Wallet

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
        read_only_fields = ['id', 'user', 'status', 'placed_at', 'total_odds', 'expected_payout']

    def get_expected_payout(self, obj):
        if obj.status == 'pending':
            return round(obj.amount * obj.total_odds, 2)
        return None

    def create(self, validated_data):
        user = self.context['request'].user
        selections_data = validated_data.pop('selections')
        amount = validated_data.get('amount')

        # Wallet check
        wallet = Wallet.objects.filter(user=user).first()
        if not wallet:
            raise serializers.ValidationError("Wallet not found for the user.")
        if wallet.balance < amount:
            raise serializers.ValidationError("Insufficient wallet balance.")

        # Deduct amount
        wallet.balance -= amount
        wallet.save()

        # Create bet
        bet = Bet.objects.create(user=user, amount=amount)
        total_odds = 1.0

        for selection_data in selections_data:
            match = selection_data['match']
            option = selection_data['selected_option']

            if match.status != 'upcoming':
                raise serializers.ValidationError(f"Match '{match}' is not open for betting.")

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

            total_odds *= float(odds)

            BetSelection.objects.create(
                bet=bet,
                match=match,
                selected_option=option
            )

        bet.total_odds = round(total_odds, 2)
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
        total_odds = 1.0
        for match in obj.matches.all():
            if match.odds_home_win:  # You may extend logic to include draw or away_win
                total_odds *= float(match.odds_home_win)
        return round(obj.amount_paid * total_odds, 2) if obj.amount_paid else 0.0

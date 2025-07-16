from rest_framework import serializers
from .models import AviatorRound, AviatorBet
from .models import SureOdd


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
            'created_at'
        ]

class TopWinnerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    avatar = serializers.URLField(source='user.avatar', read_only=True)

    class Meta:
        model = AviatorBet
        fields = ['username', 'avatar', 'amount', 'cashed_out_at']


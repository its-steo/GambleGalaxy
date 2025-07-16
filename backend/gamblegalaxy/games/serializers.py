from rest_framework import serializers
from .models import AviatorRound, AviatorBet

class AviatorRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = AviatorRound
        fields = '__all__'

class AviatorBetSerializer(serializers.ModelSerializer):
    class Meta:
        model = AviatorBet
        fields = '__all__'

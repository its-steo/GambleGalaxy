from rest_framework import serializers
from .models import UserStats, RecentActivity, TopWinner
from django.conf import settings

class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStats
        fields = ['total_bets', 'total_winnings', 'total_losses', 'win_rate', 'active_bets', 'last_updated']

class RecentActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = RecentActivity
        fields = ['id', 'activity_type', 'game_type', 'amount', 'multiplier', 'description', 'status', 'timestamp']

class TopWinnerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TopWinner
        fields = ['id', 'username', 'amount', 'game_type', 'multiplier', 'timestamp']

class DashboardStatsSerializer(serializers.Serializer):
    user_stats = UserStatsSerializer()
    wallet_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    recent_activities = RecentActivitySerializer(many=True)
    top_winners = TopWinnerSerializer(many=True)
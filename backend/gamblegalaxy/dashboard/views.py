from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import UserStats, RecentActivity, TopWinner
from .serializers import UserStatsSerializer, RecentActivitySerializer, TopWinnerSerializer
from wallet.models import Wallet
from decimal import Decimal

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        user_stats, _ = UserStats.objects.get_or_create(user=user)
        wallet = Wallet.objects.filter(user=user).first()
        wallet_balance = wallet.balance if wallet else Decimal('0.00')
        recent_activities = RecentActivity.objects.filter(user=user)[:10]
        today = timezone.now().date()
        top_winners = TopWinner.objects.filter(timestamp__date=today)[:5]
        
        # Flatten the structure to match frontend expectations
        response_data = {
            # Wallet data
            'totalBalance': float(wallet_balance),
            'balance': float(wallet_balance),  # Alternative key
            
            # User stats data (flattened)
            'totalBets': user_stats.total_bets,
            'totalWinnings': float(user_stats.total_winnings),
            'totalLosses': float(user_stats.total_losses),
            'winRate': user_stats.win_rate,
            'activeBets': user_stats.active_bets,
            
            # Additional computed stats
            'totalWins': user_stats.total_bets - user_stats.active_bets if user_stats.total_bets > 0 else 0,
            'netProfit': float(user_stats.total_winnings - user_stats.total_losses),
            
            # Activities and winners (keep as arrays)
            'recentActivities': RecentActivitySerializer(recent_activities, many=True).data,
            'topWinners': TopWinnerSerializer(top_winners, many=True).data,
            
            # Metadata
            'lastUpdated': user_stats.last_updated.isoformat() if user_stats.last_updated else None,
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        limit = int(request.query_params.get('limit', 20))
        activity_type = request.query_params.get('type', None)
        activities = RecentActivity.objects.filter(user=user)
        if activity_type:
            activities = activities.filter(activity_type=activity_type)
        activities = activities[:limit]
        serializer = RecentActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        data = request.data.copy()
        data['user'] = request.user.id
        serializer = RecentActivitySerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            self.update_user_stats(request.user, serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update_user_stats(self, user, activity_data):
        user_stats, _ = UserStats.objects.get_or_create(user=user)
        activity_type = activity_data.get('activity_type')
        amount = Decimal(str(activity_data.get('amount', 0)))
        
        if activity_type == 'bet':
            user_stats.total_bets += 1
            user_stats.active_bets += 1
        elif activity_type == 'win':
            user_stats.total_winnings += amount
            user_stats.active_bets = max(0, user_stats.active_bets - 1)
        elif activity_type == 'cashout':
            user_stats.total_winnings += amount
            user_stats.active_bets = max(0, user_stats.active_bets - 1)
        elif activity_type == 'lost':
            user_stats.total_losses += amount
            user_stats.active_bets = max(0, user_stats.active_bets - 1)
        
        user_stats.calculate_win_rate()
        user_stats.save()

class TopWinnersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        period = request.query_params.get('period', 'today')
        limit = int(request.query_params.get('limit', 10))
        now = timezone.now()
        if period == 'today':
            start_date = now.date()
            winners = TopWinner.objects.filter(timestamp__date=start_date)
        elif period == 'week':
            start_date = now.date() - timedelta(days=7)
            winners = TopWinner.objects.filter(timestamp__gte=start_date)
        elif period == 'month':
            start_date = now.date() - timedelta(days=30)
            winners = TopWinner.objects.filter(timestamp__gte=start_date)
        else:
            winners = TopWinner.objects.all()
        winners = winners[:limit]
        serializer = TopWinnerSerializer(winners, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_stats, _ = UserStats.objects.get_or_create(user=request.user)
        serializer = UserStatsSerializer(user_stats)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        user_stats, _ = UserStats.objects.get_or_create(user=request.user)
        serializer = UserStatsSerializer(user_stats, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

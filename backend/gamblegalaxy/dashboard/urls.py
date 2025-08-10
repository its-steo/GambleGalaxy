from django.urls import path
from .views import DashboardStatsView, RecentActivityView, TopWinnersView, UserStatsView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('activity/', RecentActivityView.as_view(), name='recent-activity'),
    path('top-winners/', TopWinnersView.as_view(), name='top-winners'),
    path('user-stats/', UserStatsView.as_view(), name='user-stats'),
]
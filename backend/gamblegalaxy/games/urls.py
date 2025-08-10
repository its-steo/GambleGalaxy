from django.urls import path
from . import views
from .views import top_winners_today

urlpatterns = [
    path('aviator/start/', views.start_aviator_round, name='start_aviator_round'),
    path('aviator/bet/', views.place_aviator_bet, name='place_aviator_bet'),
    path('aviator/cashout/', views.cashout_aviator_bet, name='cashout_aviator_bet'),
    path('aviator/round/<int:round_id>/status/', views.get_round_status, name='get_round_status'),
    path('aviator/past-crashes/', views.past_crashes, name='past_crashes'),
    path('aviator/sure-odds/', views.user_sure_odds, name='user_sure_odds'),
    path('aviator/top-winners/', top_winners_today, name='top_winners_today'),
    path('aviator/sure-odds/purchase/', views.purchase_sure_odd, name='purchase_sure_odd'),
    path('aviator/sure-odds/get/', views.get_sure_odd, name='get_sure_odd'),
    path('aviator/sure-odds/status/', views.sure_odd_status, name='sure_odd_status'),
    path('aviator/sure-odds/history/', views.sure_odd_history, name='sure_odd_history'),
    path('wallet/balance/', views.get_balance, name='get_balance'),
    # 🔧 NEW: Add the missing wallet update endpoint
    path('wallet/update-balance/', views.update_wallet_balance, name='update_wallet_balance'),
]

from django.urls import path
from . import views
from .views import top_winners_today

urlpatterns = [
    path('aviator/start/', views.start_aviator_round, name='start_aviator_round'),
    path('aviator/bet/', views.place_aviator_bet, name='place_aviator_bet'),
    path('aviator/cashout/', views.cashout_aviator_bet, name='cashout_aviator_bet'),
    path('api/aviator/past-crashes/', views.past_crashes, name='past_crashes'),
    path('api/aviator/sure-odds/', views.user_sure_odds, name='user_sure_odds'),
     path('api/aviator/top-winners/', top_winners_today, name='top_winners_today'),

]

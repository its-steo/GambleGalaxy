from django.urls import path
from . import views

urlpatterns = [
    path('aviator/start/', views.start_aviator_round, name='start_aviator_round'),
    path('aviator/bet/', views.place_aviator_bet, name='place_aviator_bet'),
    path('aviator/cashout/', views.cashout_aviator_bet, name='cashout_aviator_bet'),
]

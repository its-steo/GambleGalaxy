from django.urls import path
from .views import MatchListView, PlaceBetView, MyBetHistoryView, SureOddsPaymentView
from betting.views import SureOddsView
from . import views

urlpatterns = [
    path('matches/', views.MatchListView.as_view(), name='matches'),
    path('place/', views.PlaceBetView.as_view(), name='place-bet'),
    path('history/', views.MyBetHistoryView.as_view(), name='bet-history'),
    path('sure-odds/', views.SureOddsView.as_view(), name='sure-odds'),
    path('sure-odds/pay/', views.SureOddsPaymentView.as_view(), name='sure-odds-pay'),
    




]
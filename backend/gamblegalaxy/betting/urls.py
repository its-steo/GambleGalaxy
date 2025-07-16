from django.urls import path
from .views import MatchListView, PlaceBetView, MyBetHistoryView, SureOddsPaymentView
from betting.views import SureOddsView

urlpatterns = [
    path('matches/', MatchListView.as_view(), name='match-list'),
    path('place/', PlaceBetView.as_view(), name='place-bet'),
    path('history/', MyBetHistoryView.as_view(), name='bet-history'),
    path('sure-odds/', SureOddsView.as_view(), name='sure-odds'),
    path('sure-odds/pay/', SureOddsPaymentView.as_view(), name='sure-odds-pay'),


]

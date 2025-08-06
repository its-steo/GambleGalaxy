from django.urls import path
from .views import WalletView, DepositView, WithdrawView, TransactionHistoryView

urlpatterns = [
    path('', WalletView.as_view(), name='wallet'),
    path('deposit/', DepositView.as_view(), name='wallet-deposit'),
    path('withdraw/', WithdrawView.as_view(), name='wallet-withdraw'),
    path('transactions/', TransactionHistoryView.as_view(), name='wallet-transactions'),
]
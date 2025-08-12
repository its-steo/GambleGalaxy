#from django.urls import path
#from .views import WalletView, DepositView, WithdrawView, TransactionHistoryView, Call
#
#urlpatterns = [
#    path('', WalletView.as_view(), name='wallet'),
#    path('deposit/', DepositView.as_view(), name='wallet-deposit'),
#    path('withdraw/', WithdrawView.as_view(), name='wallet-withdraw'),
#    path('callback/', CallbackView.as_view(), name='wallet-callback'),
#    path('transactions/', TransactionHistoryView.as_view(), name='wallet-transactions'),
#]


from django.urls import path
from .views import WalletView, DepositView, WithdrawView, TransactionHistoryView, CallbackView

app_name = 'wallet'

urlpatterns = [
    path('', WalletView.as_view(), name='wallet'),
    path('deposit/', DepositView.as_view(), name='wallet-deposit'),
    path('withdraw/', WithdrawView.as_view(), name='wallet-withdraw'),
    path('callback/', CallbackView.as_view(), name='wallet-callback'),
    path('transactions/', TransactionHistoryView.as_view(), name='wallet-transactions'),
]
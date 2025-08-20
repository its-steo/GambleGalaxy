from django.urls import path
from .views import RegisterView, ProfileView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import check_username
from .views import login_page, register_page, profile_page
from .views import WalletView, DepositView, WithdrawView, TransactionHistoryView  # ✅ Import wallet views

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('check-username/', check_username, name='check_username'),
    # ✅ Added wallet endpoints
    path('wallet/', WalletView.as_view(), name='wallet'),
    path('deposit/', DepositView.as_view(), name='deposit'),
    path('withdraw/', WithdrawView.as_view(), name='withdraw'),
    path('transactions/', TransactionHistoryView.as_view(), name='transaction_history'),
]
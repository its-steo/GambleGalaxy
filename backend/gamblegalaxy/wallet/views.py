from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer


class WalletView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet


class DepositView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def perform_create(self, serializer):
        amount = serializer.validated_data['amount']
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        wallet.deposit(amount)  # ⬅️ update wallet balance
        serializer.save(user=self.request.user, transaction_type='deposit')


class WithdrawView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def perform_create(self, serializer):
        amount = serializer.validated_data['amount']
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        if wallet.withdraw(amount):  # ⬅️ only save if successful
            serializer.save(user=self.request.user, transaction_type='withdraw')
            raise ValidationError("Insufficient funds.")
            raise serializers.ValidationError("Insufficient funds.")


class TransactionHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-timestamp')

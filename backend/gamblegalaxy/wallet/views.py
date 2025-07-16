from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer
from django.db import transaction as db_transaction

class WalletView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet

class DepositView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def post(self, request):
        amount = request.data.get('amount')
        if not amount:
            return Response({"error": "Amount is required"}, status=400)

        with db_transaction.atomic():
            wallet, _ = Wallet.objects.get_or_create(user=request.user)
            wallet.balance += float(amount)
            wallet.save()

            txn = Transaction.objects.create(
                user=request.user,
                amount=amount,
                transaction_type='deposit'
            )
            return Response(TransactionSerializer(txn).data, status=201)

class WithdrawView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def post(self, request):
        amount = request.data.get('amount')
        if not amount:
            return Response({"error": "Amount is required"}, status=400)

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        if wallet.balance < float(amount):
            return Response({"error": "Insufficient balance"}, status=400)

        with db_transaction.atomic():
            wallet.balance -= float(amount)
            wallet.save()

            txn = Transaction.objects.create(
                user=request.user,
                amount=amount,
                transaction_type='withdraw'
            )
            return Response(TransactionSerializer(txn).data, status=201)

class TransactionHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-timestamp')


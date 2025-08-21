from django.shortcuts import render
from rest_framework import generics
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer
from rest_framework.decorators import api_view

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
    
@api_view(['GET'])
def check_username(request):
    username = request.GET.get('username')
    if username:
        exists = User.objects.filter(username=username).exists()
        return Response({'exists': exists})
    return Response({'error': 'No username provided'}, status=400)

class WalletView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet

class TransactionHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-timestamp')

# Render Login Page
def login_page(request):
    return render(request, 'frontend/login.html')

# Render Register Page
def register_page(request):
    return render(request, 'frontend/register.html')

# Optional: Profile page
def profile_page(request):
    return render(request, 'frontend/profile.html')
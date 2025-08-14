#from django.core.management.base import BaseCommand
#from accounts.models import CustomUser
#from wallet.models import Wallet, Transaction
#from django.utils import timezone
#import decimal
#
#class Command(BaseCommand):
#    help = 'Creates a demo user account with a wallet and initial balance for testing the Aviator game'
#
#    def handle(self, *args, **kwargs):
#        username = 'demo_user'
#        
#        # Check if demo user already exists
#        if CustomUser.objects.filter(username=username).exists():
#            self.stdout.write(self.style.WARNING(f'Demo user {username} already exists.'))
#            demo_user = CustomUser.objects.get(username=username)
#        else:
#            # Create demo user
#            demo_user = CustomUser.objects.create_user(
#                username=username,
#                password='demo123',
#                email='demo@example.com',
#                is_active=True,
#                is_demo=True  # Comment out if CustomUser lacks is_demo field
#            )
#            demo_user.first_name = 'Demo'
#            demo_user.last_name = 'User'
#            demo_user.save()
#            self.stdout.write(self.style.SUCCESS(f'Created demo user: {username}'))
#
#        # Check if wallet already exists
#        initial_balance = decimal.Decimal('5000.00')
#        try:
#            wallet = Wallet.objects.get(user=demo_user)
#            self.stdout.write(self.style.WARNING(f'Wallet already exists for {username} with balance {wallet.balance}.'))
#            # Optionally reset balance for demo purposes
#            if wallet.balance != initial_balance:
#                wallet.balance = initial_balance
#                wallet.save()
#                self.stdout.write(self.style.SUCCESS(f'Reset wallet balance to {initial_balance} for {username}.'))
#        except Wallet.DoesNotExist:
#            # Create wallet with initial demo balance
#            wallet = Wallet.objects.create(
#                user=demo_user,
#                balance=initial_balance
#            )
#            self.stdout.write(self.style.SUCCESS(f'Created wallet for {username} with balance {initial_balance}'))
#
#        # Log initial balance as a bonus transaction (only if no bonus transaction exists)
#        if not Transaction.objects.filter(user=demo_user, transaction_type='bonus', description='Demo account initial balance').exists():
#            Transaction.objects.create(
#                user=demo_user,
#                amount=initial_balance,
#                transaction_type='bonus',
#                description='Demo account initial balance',
#                timestamp=timezone.now()
#            )
#            self.stdout.write(self.style.SUCCESS(f'Logged initial bonus transaction for {username}'))
#        else:
#            self.stdout.write(self.style.WARNING(f'Bonus transaction already exists for {username}.'))
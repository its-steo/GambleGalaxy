from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'phone', 'is_verified', 'is_bot', 'is_nesty', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'phone')
    ordering = ('id',)

    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('phone', 'is_verified', 'is_bot', 'avatar', 'is_nesty')}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('phone', 'is_verified', 'is_bot', 'avatar', 'is_nesty')}),
    )
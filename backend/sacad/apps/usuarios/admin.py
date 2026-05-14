from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from .models import Profile, AllowedDomain

User = get_user_model()

admin.site.unregister(User)


@admin.action(description="Aprobar usuarios seleccionados")
def approve_users(modeladmin, request, queryset):
    updated = queryset.update(is_active=True)
    modeladmin.message_user(request, f"{updated} usuario(s) aprobado(s).")


@admin.register(User)
class SACADUserAdmin(UserAdmin):
    list_display = ["email", "username", "first_name", "last_name", "is_active", "is_staff"]
    list_filter = ["is_active", "is_staff", "is_superuser", "groups"]
    actions = [approve_users]


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "foto"]


@admin.register(AllowedDomain)
class AllowedDomainAdmin(admin.ModelAdmin):
    list_display = ["domain", "created_at"]

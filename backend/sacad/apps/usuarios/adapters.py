from django.conf import settings
from django.contrib.auth import get_user_model
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from django.shortcuts import redirect
from .models import Profile, AllowedDomain


class FCEGoogleAccountAdapter(DefaultSocialAccountAdapter):
    """
    Adapter que:
    1. Nuevos usuarios quedan pendientes de aprobacion (Profile.approval_status)
    2. Usuarios existentes aprobados pueden iniciar sesion normalmente
    """

    def _unique_username(self, base_username):
        User = get_user_model()
        username = base_username
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{suffix}"
            suffix += 1
        return username

    def pre_social_login(self, request, sociallogin):
        email = sociallogin.user.email

        # Verificar si el dominio está permitido
        allowed = AllowedDomain.objects.values_list("domain", flat=True)
        if allowed.exists():
            domain = email.split("@")[1] if "@" in email else ""
            if domain not in allowed:
                from django.contrib import messages
                messages.error(request, f"Acceso denegado. El dominio {domain} no está permitido.")
                raise ImmediateHttpResponse(redirect("/accounts/login/"))

        User = get_user_model()

        # Si es una cuenta social nueva y el usuario ya existe por email,
        # vinculamos este login social al usuario existente.
        if not sociallogin.user.pk:
            try:
                existing = User.objects.filter(email=email).first()
                if existing:
                    sociallogin.user = existing
            except User.DoesNotExist:
                pass

        # Usuario existente pero inactivo → redirigir a pending
        if sociallogin.user.pk and not sociallogin.user.is_active:
            raise ImmediateHttpResponse(
                redirect(f"{settings.FRONTEND_URL}/auth/pending")
            )

        # Usuario nuevo: asignar username único
        # NO ponemos is_active=False aquí porque allauth 65+ interrumpe
        # el flujo con su plantilla accounts/inactive/ antes de seguir
        # nuestro redirect. En su lugar, google_complete verifica el
        # approval_status del Profile y redirige al frontend.
        if not sociallogin.user.pk:
            base = email.split("@")[0]
            sociallogin.user.username = self._unique_username(base)

        # Forzar redirect a google_complete para generar JWT tokens
        # (SOCIALACCOUNT_LOGIN_REDIRECT_URL ya no funciona en allauth 65+)
        sociallogin.state["next"] = "/api/auth/google/complete/"

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)
        Profile.objects.get_or_create(
            user=user,
            defaults={"approval_status": Profile.ApprovalStatus.PENDING},
        )
        return user

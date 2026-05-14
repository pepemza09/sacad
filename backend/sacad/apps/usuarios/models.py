from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Profile(models.Model):
    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", _("Pendiente")
        APPROVED = "approved", _("Aprobado")
        REJECTED = "rejected", _("Rechazado")

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    foto = models.ImageField(upload_to="fotos_perfil/", blank=True, null=True)
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Profile of {self.user.email}"


class AllowedDomain(models.Model):
    domain = models.CharField(
        max_length=255,
        unique=True,
        help_text="Dominio de email permitido, ej: fce.uncu.edu.ar",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Dominio permitido"
        verbose_name_plural = "Dominios permitidos"
        ordering = ["domain"]

    def __str__(self):
        return self.domain

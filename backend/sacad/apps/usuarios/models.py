from django.db import models
from django.conf import settings
from django.contrib.auth.models import Group
from django.utils.translation import gettext_lazy as _


MENU_KEYS = [
    ("dashboard", "Dashboard"),
    ("facultades", "Facultades"),
    ("sedes", "Sedes"),
    ("carreras", "Carreras"),
    ("planes", "Planes de Estudio"),
    ("areas", "Áreas"),
    ("materias", "Materias"),
    ("docentes", "Docentes"),
    ("equivalencias", "Equivalencias"),
    ("configuracion", "Configuración"),
    ("configuracion.usuarios", "Config. - Autorización usuarios"),
    ("configuracion.dominios", "Config. - Dominios permitidos"),
    ("configuracion.roles", "Config. - Roles de usuarios"),
    ("configuracion.tipos-materia", "Config. - Tipos de Materia"),
    ("configuracion.designaciones", "Config. - Designaciones"),
    ("configuracion.nomenclador", "Config. - Nomenclador"),
]


class GroupMenuPermission(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="menu_permissions")
    menu_key = models.CharField(max_length=50, choices=MENU_KEYS)
    can_read = models.BooleanField(default=False)
    can_write = models.BooleanField(default=False)

    class Meta:
        unique_together = ("group", "menu_key")
        verbose_name = "Permiso de menú"
        verbose_name_plural = "Permisos de menú"

    def __str__(self):
        return f"{self.group.name} – {self.get_menu_key_display()} (R:{self.can_read} W:{self.can_write})"


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
    zoom_level = models.FloatField(default=100.0, help_text="Zoom en porcentaje (50-200)")

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

from django.db import models
from django.core.validators import RegexValidator


class Docente(models.Model):
    apellido = models.CharField(max_length=100)
    nombre = models.CharField(max_length=100)
    dni = models.CharField(
        max_length=15,
        unique=True,
        validators=[RegexValidator(r"^\d+$", "Solo números.")],
    )
    cuit_cuil = models.CharField(
        max_length=15,
        unique=True,
        blank=True,
        validators=[RegexValidator(r"^\d{2}-\d{8}-\d$", "Formato: XX-XXXXXXXX-X")],
    )
    legajo = models.CharField(max_length=20, blank=True)
    legajo_en_tramite = models.BooleanField(default=False)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=30, blank=True)
    facultad = models.ForeignKey(
        "academica.Facultad",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="docentes",
    )
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Docente"
        verbose_name_plural = "Docentes"
        ordering = ["apellido", "nombre"]

    def __str__(self):
        return f"{self.apellido}, {self.nombre}"

    @property
    def legajo_display(self):
        if self.legajo_en_tramite:
            return "En trámite"
        return self.legajo or "-"

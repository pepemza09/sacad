from django.db import models
from django.core.exceptions import ValidationError


class Equivalencia(models.Model):
    TIPO_CHOICES = [
        ("total", "Total"),
        ("parcial", "Parcial"),
    ]

    plan_destino = models.ForeignKey(
        "academica.PlanEstudio",
        on_delete=models.CASCADE,
        related_name="equivalencias_destino",
    )
    materias_origen = models.ManyToManyField(
        "academica.Materia",
        related_name="equivalencias_origen",
    )
    materias_destino = models.ManyToManyField(
        "academica.Materia",
        related_name="equivalencias_destino",
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="total")
    resolucion = models.CharField(max_length=100, blank=True)
    porcentaje = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Para equivalencia parcial"
    )
    observaciones = models.TextField(blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Equivalencia"
        verbose_name_plural = "Equivalencias"
        ordering = ["-pk"]

    def __str__(self):
        origen = ", ".join(self.materias_origen.values_list("nombre", flat=True))
        destino = ", ".join(self.materias_destino.values_list("nombre", flat=True))
        return f"{origen} → {destino} ({self.get_tipo_display()})"

    def clean(self):
        super().clean()
        if self.pk:
            origenes = self.materias_origen.all()
            destinos = self.materias_destino.all()
            if origenes and destinos:
                carrera_origen = origenes.first().plan_estudio.carrera
                carrera_destino = destinos.first().plan_estudio.carrera
                if carrera_origen != carrera_destino:
                    raise ValidationError(
                        "Las materias de origen y destino deben pertenecer a la misma carrera."
                    )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

from django.db import models
from django.core.validators import RegexValidator


class Cargo(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    descripcion = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Cargo"
        verbose_name_plural = "Cargos"
        ordering = ["codigo"]

    def __str__(self):
        return self.descripcion


class Dedicacion(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    descripcion = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Dedicación"
        verbose_name_plural = "Dedicaciones"
        ordering = ["codigo"]

    def __str__(self):
        return self.descripcion


class Caracter(models.Model):
    class RequiereFecha(models.TextChoices):
        NINGUNA = "ninguna", "Sin fechas"
        INICIO = "inicio", "Solo fecha de inicio"
        FIN = "fin", "Solo fecha de fin"
        AMBAS = "ambas", "Fecha de inicio y fin"

    codigo = models.CharField(max_length=20, unique=True)
    descripcion = models.CharField(max_length=255)
    requiere_fecha = models.CharField(
        max_length=10,
        choices=RequiereFecha.choices,
        default=RequiereFecha.NINGUNA,
    )
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Carácter"
        verbose_name_plural = "Caracteres"
        ordering = ["codigo"]

    def __str__(self):
        return self.descripcion


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
        null=True,
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

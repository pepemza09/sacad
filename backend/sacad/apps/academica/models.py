from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

User = get_user_model()


def derivar_cuatrimestre(periodo):
    if not periodo:
        return "1"
    p = periodo.strip()
    if "2C" in p or "2c" in p:
        return "2"
    if "1C" in p or "1c" in p:
        return "1"
    return "1"


class Facultad(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nombre_corto = models.CharField(max_length=100)
    nombre = models.CharField(max_length=255)
    decano = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Facultad"
        verbose_name_plural = "Facultades"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class Sede(models.Model):
    codigo = models.CharField(max_length=20)
    nombre = models.CharField(max_length=255)
    facultad = models.ForeignKey(Facultad, on_delete=models.CASCADE, related_name="sedes")
    activa = models.BooleanField(default=True)
    direccion = models.CharField(max_length=255, blank=True, default="")
    localidad = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        verbose_name = "Sede"
        verbose_name_plural = "Sedes"
        ordering = ["facultad", "nombre"]
        unique_together = ["facultad", "codigo"]

    def __str__(self):
        return f"{self.nombre} ({self.facultad.nombre})"


class Carrera(models.Model):
    NIVEL_CHOICES = [
        ("grado", "Grado"),
        ("pregrado", "Pregrado"),
        ("posgrado", "Posgrado"),
    ]
    MODALIDAD_CHOICES = [
        ("presencial", "Presencial"),
        ("distancia", "Distancia"),
        ("mixta", "Mixta"),
    ]

    facultad = models.ForeignKey(Facultad, on_delete=models.CASCADE, related_name="carreras")
    codigo = models.CharField(max_length=20)
    codigo_ministerial = models.CharField(max_length=20, blank=True, default="")
    nombre_corto = models.CharField(max_length=255, blank=True, default="")
    nombre = models.CharField(max_length=255)
    titulo_otorga = models.CharField(max_length=255, blank=True, default="")
    duracion_anos = models.PositiveSmallIntegerField(default=1)
    nivel = models.CharField(max_length=20, choices=NIVEL_CHOICES, default="grado")
    modalidad = models.CharField(max_length=20, choices=MODALIDAD_CHOICES, default="presencial")
    sedes = models.ManyToManyField(Sede, blank=True, related_name="carreras")
    director = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Carrera"
        verbose_name_plural = "Carreras"
        ordering = ["facultad", "nombre"]
        unique_together = ["facultad", "codigo"]

    def __str__(self):
        return f"{self.nombre} - {self.facultad.nombre}"


class TituloIntermedio(models.Model):
    nombre = models.CharField(max_length=255)
    duracion_anos = models.PositiveSmallIntegerField(help_text="Duración en años")

    class Meta:
        verbose_name = "Título Intermedio"
        verbose_name_plural = "Títulos Intermedios"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.duracion_anos} años)"


class PlanEstudio(models.Model):
    carrera = models.ForeignKey(Carrera, on_delete=models.CASCADE, related_name="planes")
    codigo = models.CharField(max_length=50, help_text="Código del plan de estudio")
    version = models.CharField(max_length=50, blank=True, default="", help_text="Versión del plan")
    titulo_otorga = models.CharField(max_length=255, help_text="Título que otorga")
    duracion_anos = models.PositiveSmallIntegerField(help_text="Duración en años según el título que otorga")
    año_inicio_implementacion = models.PositiveIntegerField(help_text="Año en que comenzó a implementarse")
    vigente = models.BooleanField(default=False, help_text="Indica si el plan está vigente actualmente")
    titulos_intermedios = models.ManyToManyField(TituloIntermedio, blank=True)

    class Meta:
        verbose_name = "Plan de Estudio"
        verbose_name_plural = "Planes de Estudio"
        ordering = ["carrera", "-año_inicio_implementacion"]
        unique_together = ["carrera", "codigo"]
        indexes = [
            models.Index(fields=["carrera", "vigente"]),
            models.Index(fields=["año_inicio_implementacion"]),
        ]

    def __str__(self):
        return f"{self.carrera.nombre} - {self.codigo}"


class TipoMateria(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Tipo de Materia"
        verbose_name_plural = "Tipos de Materia"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Area(models.Model):
    plan_estudio = models.ForeignKey(
        PlanEstudio, on_delete=models.CASCADE, related_name="areas"
    )
    nombre = models.CharField(max_length=255)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Área"
        verbose_name_plural = "Áreas"
        ordering = ["plan_estudio", "orden", "nombre"]
        unique_together = ["plan_estudio", "nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.plan_estudio.codigo})"


class Materia(models.Model):
    CUATRIMESTRE_CHOICES = [
        ("1", "Primer Cuatrimestre"),
        ("2", "Segundo Cuatrimestre"),
        ("anual", "Anual"),
    ]

    plan_estudio = models.ForeignKey(
        PlanEstudio, on_delete=models.CASCADE, related_name="materias"
    )
    codigo = models.CharField(max_length=20)
    nombre = models.CharField(max_length=255)
    año = models.PositiveSmallIntegerField()
    cuatrimestre = models.CharField(max_length=10, choices=CUATRIMESTRE_CHOICES)
    creditos = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Créditos de la materia"
    )
    periodo = models.CharField(
        max_length=20, blank=True, default="",
        help_text="Período original (ej: B1/1C, 1C, B2/1C)"
    )
    carga_horaria_semanal = models.PositiveIntegerField(null=True, blank=True)
    carga_horaria_total = models.PositiveIntegerField()
    area = models.ForeignKey(
        Area, on_delete=models.SET_NULL, null=True, blank=True, related_name="materias"
    )
    tipo = models.ForeignKey(
        TipoMateria, on_delete=models.PROTECT, null=True, blank=True, related_name="materias"
    )
    contenidos_minimos = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if self.periodo:
            self.periodo = self.periodo.strip().upper()
        if self.periodo and not self.cuatrimestre:
            self.cuatrimestre = derivar_cuatrimestre(self.periodo)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Materia"
        verbose_name_plural = "Materias"
        ordering = ["plan_estudio", "año", "cuatrimestre", "nombre"]
        unique_together = ["plan_estudio", "codigo"]
        indexes = [
            models.Index(fields=["plan_estudio", "año"]),
            models.Index(fields=["plan_estudio", "codigo"]),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Correlatividad(models.Model):
    TIPO_CHOICES = [
        ("cursar", "Para cursar"),
        ("cursado", "Cursado"),
        ("aprobar", "Para aprobar"),
        ("aprobacion", "Aprobación"),
        ("regular", "Regular"),
    ]

    materia = models.ForeignKey(
        Materia, on_delete=models.CASCADE, related_name="correlativas"
    )
    materia_requerida = models.ForeignKey(
        Materia, on_delete=models.CASCADE, related_name="requisito_de"
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)

    class Meta:
        verbose_name = "Correlatividad"
        verbose_name_plural = "Correlatividades"
        unique_together = ["materia", "materia_requerida", "tipo"]

    def __str__(self):
        return f"{self.materia.nombre} requiere {self.materia_requerida.nombre} ({self.get_tipo_display()})"

    def clean(self):
        if self.materia.plan_estudio != self.materia_requerida.plan_estudio:
            raise ValidationError("Las correlativas deben ser del mismo plan de estudio.")

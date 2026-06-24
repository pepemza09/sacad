from django.db import models


class Disciplina(models.Model):
    codigo = models.CharField(max_length=2, unique=True)
    descripcion = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Disciplina"
        verbose_name_plural = "Disciplinas"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"


class Subdisciplina(models.Model):
    codigo = models.CharField(max_length=2)
    disciplina = models.ForeignKey(
        Disciplina,
        on_delete=models.PROTECT,
        related_name="subdisciplinas",
    )
    descripcion = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Subdisciplina"
        verbose_name_plural = "Subdisciplinas"
        ordering = ["disciplina__codigo", "codigo"]
        unique_together = ("codigo", "disciplina")

    def __str__(self):
        return f"{self.disciplina.codigo}.{self.codigo} - {self.descripcion}"


class Especialidad(models.Model):
    codigo = models.CharField(max_length=2)
    subdisciplina = models.ForeignKey(
        Subdisciplina,
        on_delete=models.PROTECT,
        related_name="especialidades",
    )
    descripcion = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Especialidad"
        verbose_name_plural = "Especialidades"
        ordering = ["subdisciplina__disciplina__codigo", "subdisciplina__codigo", "codigo"]
        unique_together = ("codigo", "subdisciplina")

    def __str__(self):
        return f"{self.subdisciplina.disciplina.codigo}.{self.subdisciplina.codigo}.{self.codigo} - {self.descripcion}"

from django.contrib import admin
from .models import Disciplina, Subdisciplina, Especialidad


@admin.register(Disciplina)
class DisciplinaAdmin(admin.ModelAdmin):
    list_display = ["codigo", "descripcion", "activo"]
    search_fields = ["codigo", "descripcion"]


@admin.register(Subdisciplina)
class SubdisciplinaAdmin(admin.ModelAdmin):
    list_display = ["codigo", "descripcion", "activo"]
    search_fields = ["codigo", "descripcion"]


@admin.register(Especialidad)
class EspecialidadAdmin(admin.ModelAdmin):
    list_display = ["codigo", "descripcion", "activo"]
    search_fields = ["codigo", "descripcion"]

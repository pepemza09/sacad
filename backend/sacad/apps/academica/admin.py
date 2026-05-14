from django.contrib import admin
from .models import Facultad, Sede, Carrera, PlanEstudio, TituloIntermedio, Materia, Correlatividad


@admin.register(Facultad)
class FacultadAdmin(admin.ModelAdmin):
    list_display = ["nombre", "codigo", "decano", "activa"]
    list_filter = ["activa"]
    search_fields = ["nombre", "codigo", "nombre_corto"]
    autocomplete_fields = ["decano"]


@admin.register(Sede)
class SedeAdmin(admin.ModelAdmin):
    list_display = ["nombre", "codigo", "facultad", "activa"]
    list_filter = ["activa", "facultad"]
    search_fields = ["nombre", "codigo", "direccion", "localidad"]
    autocomplete_fields = ["facultad"]


@admin.register(Carrera)
class CarreraAdmin(admin.ModelAdmin):
    list_display = ["nombre", "codigo", "facultad", "nivel", "modalidad", "activa"]
    list_filter = ["activa", "nivel", "modalidad", "facultad"]
    search_fields = ["nombre", "codigo"]
    autocomplete_fields = ["facultad", "director"]
    filter_horizontal = ["sedes"]


@admin.register(TituloIntermedio)
class TituloIntermedioAdmin(admin.ModelAdmin):
    list_display = ["nombre", "duracion_anos"]
    search_fields = ["nombre"]


@admin.register(PlanEstudio)
class PlanEstudioAdmin(admin.ModelAdmin):
    list_display = ["codigo", "carrera", "vigente", "año_inicio_implementacion", "duracion_anos"]
    list_filter = ["vigente", "carrera__facultad"]
    search_fields = ["codigo", "carrera__nombre"]
    autocomplete_fields = ["carrera"]
    filter_horizontal = ["titulos_intermedios"]


@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ["codigo", "nombre", "plan_estudio", "año", "cuatrimestre", "tipo"]
    list_filter = ["tipo", "cuatrimestre", "año", "plan_estudio__carrera"]
    search_fields = ["nombre", "codigo"]
    autocomplete_fields = ["plan_estudio"]


@admin.register(Correlatividad)
class CorrelatividadAdmin(admin.ModelAdmin):
    list_display = ["materia", "materia_requerida", "tipo"]
    list_filter = ["tipo"]
    search_fields = ["materia__nombre", "materia_requerida__nombre"]
    autocomplete_fields = ["materia", "materia_requerida"]

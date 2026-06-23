from django.contrib import admin
from .models import Cargo, Dedicacion, Caracter, Docente


@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    list_display = ["codigo", "descripcion", "activo"]
    list_filter = ["activo"]
    search_fields = ["codigo", "descripcion"]


@admin.register(Dedicacion)
class DedicacionAdmin(admin.ModelAdmin):
    list_display = ["codigo", "descripcion", "activo"]
    list_filter = ["activo"]
    search_fields = ["codigo", "descripcion"]


@admin.register(Caracter)
class CaracterAdmin(admin.ModelAdmin):
    list_display = ["codigo", "descripcion", "activo"]
    list_filter = ["activo"]
    search_fields = ["codigo", "descripcion"]


@admin.register(Docente)
class DocenteAdmin(admin.ModelAdmin):
    list_display = ["apellido", "nombre", "email", "dni", "facultad", "activo"]
    list_filter = ["activo", "facultad"]
    search_fields = ["apellido", "nombre", "email", "dni"]
    autocomplete_fields = ["facultad"]

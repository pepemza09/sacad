from django.contrib import admin
from .models import Docente


@admin.register(Docente)
class DocenteAdmin(admin.ModelAdmin):
    list_display = ["apellido", "nombre", "email", "dni", "facultad", "activo"]
    list_filter = ["activo", "facultad"]
    search_fields = ["apellido", "nombre", "email", "dni"]
    autocomplete_fields = ["facultad"]

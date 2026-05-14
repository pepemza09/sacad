from django.contrib import admin
from .models import Equivalencia


@admin.register(Equivalencia)
class EquivalenciaAdmin(admin.ModelAdmin):
    list_display = ["id", "plan_destino", "tipo", "porcentaje", "activa"]
    list_filter = ["activa", "tipo"]
    search_fields = ["resolucion", "observaciones"]
    autocomplete_fields = ["plan_destino", "materias_origen", "materias_destino"]
    filter_horizontal = ["materias_origen", "materias_destino"]

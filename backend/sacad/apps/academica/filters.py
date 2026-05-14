import django_filters
from .models import Facultad, Sede, Carrera, PlanEstudio, Materia


class FacultadFilter(django_filters.FilterSet):
    class Meta:
        model = Facultad
        fields = {
            "activa": ["exact"],
            "nombre": ["icontains"],
        }


class SedeFilter(django_filters.FilterSet):
    class Meta:
        model = Sede
        fields = {
            "activa": ["exact"],
            "facultad": ["exact"],
            "nombre": ["icontains"],
        }


class CarreraFilter(django_filters.FilterSet):
    class Meta:
        model = Carrera
        fields = {
            "facultad": ["exact"],
            "activa": ["exact"],
            "nivel": ["exact"],
            "modalidad": ["exact"],
            "codigo_ministerial": ["icontains"],
            "nombre_corto": ["icontains"],
        }


class PlanEstudioFilter(django_filters.FilterSet):
    class Meta:
        model = PlanEstudio
        fields = {
            "carrera": ["exact"],
            "vigente": ["exact"],
            "año_inicio_implementacion": ["exact", "gte", "lte"],
        }


class MateriaFilter(django_filters.FilterSet):
    año = django_filters.NumberFilter(field_name="año")

    class Meta:
        model = Materia
        fields = {
            "plan_estudio": ["exact"],
            "año": ["exact"],
            "cuatrimestre": ["exact"],
            "tipo": ["exact"],
        }

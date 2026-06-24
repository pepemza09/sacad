from rest_framework import serializers
from .models import Cargo, Dedicacion, Caracter, Docente, CargoDocente


class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = "__all__"


class DedicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dedicacion
        fields = "__all__"


class CaracterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caracter
        fields = "__all__"


class DocenteSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(
        source="facultad.nombre", read_only=True
    )
    legajo_display = serializers.CharField(read_only=True)

    class Meta:
        model = Docente
        fields = "__all__"


class CargoDocenteSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.SerializerMethodField()
    materia_codigo = serializers.CharField(source="materia.codigo", read_only=True)
    materia_nombre = serializers.CharField(source="materia.nombre", read_only=True)
    cargo_codigo = serializers.CharField(source="cargo.codigo", read_only=True)
    cargo_descripcion = serializers.CharField(source="cargo.descripcion", read_only=True)
    dedicacion_codigo = serializers.CharField(source="dedicacion.codigo", read_only=True)
    dedicacion_descripcion = serializers.CharField(source="dedicacion.descripcion", read_only=True)
    caracter_codigo = serializers.CharField(source="caracter.codigo", read_only=True)
    caracter_descripcion = serializers.CharField(source="caracter.descripcion", read_only=True)
    carrera_nombre = serializers.CharField(source="materia.plan_estudio.carrera.nombre", read_only=True)
    plan_estudio_codigo = serializers.CharField(source="materia.plan_estudio.codigo", read_only=True)
    area_nombre = serializers.CharField(source="materia.area.nombre", read_only=True, allow_null=True)
    facultad_nombre = serializers.CharField(source="materia.plan_estudio.carrera.facultad.nombre", read_only=True)
    caracter_requiere_fecha = serializers.CharField(source="caracter.requiere_fecha", read_only=True)

    class Meta:
        model = CargoDocente
        fields = "__all__"

    def get_docente_nombre(self, obj):
        return f"{obj.docente.apellido}, {obj.docente.nombre}"

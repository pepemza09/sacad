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
    materias_display = serializers.SerializerMethodField()
    cargo_codigo = serializers.CharField(source="cargo.codigo", read_only=True)
    cargo_descripcion = serializers.CharField(source="cargo.descripcion", read_only=True)
    dedicacion_codigo = serializers.CharField(source="dedicacion.codigo", read_only=True)
    dedicacion_descripcion = serializers.CharField(source="dedicacion.descripcion", read_only=True)
    caracter_codigo = serializers.CharField(source="caracter.codigo", read_only=True)
    caracter_descripcion = serializers.CharField(source="caracter.descripcion", read_only=True)
    caracter_requiere_fecha = serializers.CharField(source="caracter.requiere_fecha", read_only=True)
    sede_nombre = serializers.CharField(source="sede.nombre", read_only=True, allow_null=True)

    class Meta:
        model = CargoDocente
        fields = "__all__"

    def get_docente_nombre(self, obj):
        return f"{obj.docente.apellido}, {obj.docente.nombre}"

    def get_materias_display(self, obj):
        return [
            {
                "id": m.id,
                "codigo": m.codigo,
                "nombre": m.nombre,
                "carrera_nombre": m.plan_estudio.carrera.nombre,
                "plan_estudio_codigo": m.plan_estudio.codigo,
                "area_nombre": m.area.nombre if m.area else None,
                "facultad_nombre": m.plan_estudio.carrera.facultad.nombre,
                "carrera_id": m.plan_estudio.carrera.id,
            }
            for m in obj.materias.all()
        ]

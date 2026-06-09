from rest_framework import serializers
from .models import Equivalencia


class EquivalenciaSerializer(serializers.ModelSerializer):
    plan_destino_nombre = serializers.SerializerMethodField()
    materias_origen_display = serializers.SerializerMethodField()
    materias_destino_display = serializers.SerializerMethodField()

    class Meta:
        model = Equivalencia
        fields = "__all__"

    def get_plan_destino_nombre(self, obj):
        return str(obj.plan_destino)

    def get_materias_origen_display(self, obj):
        return [
            {"id": m.id, "codigo": m.codigo, "nombre": m.nombre}
            for m in obj.materias_origen.all()
        ]

    def get_materias_destino_display(self, obj):
        return [
            {"id": m.id, "codigo": m.codigo, "nombre": m.nombre}
            for m in obj.materias_destino.all()
        ]

    def validate(self, data):
        from .engine import EquivalenciasEngine

        request = self.context.get("request")
        if request and request.method in ("POST", "PUT", "PATCH"):
            materias_origen = request.data.get("materias_origen", [])
            materias_destino = request.data.get("materias_destino", [])
            if not materias_origen or not materias_destino:
                raise serializers.ValidationError(
                    "Debe especificar materias de origen y destino"
                )
            valido, error = EquivalenciasEngine.validar_mismo_plan(
                materias_origen, materias_destino
            )
            if not valido:
                raise serializers.ValidationError(error)
        return data


class EquivalenciaConsultaSerializer(serializers.Serializer):
    materia_origen_id = serializers.IntegerField()
    plan_destino_id = serializers.IntegerField()

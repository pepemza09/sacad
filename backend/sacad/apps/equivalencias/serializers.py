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
            {
                "id": m.id,
                "codigo": m.codigo,
                "nombre": m.nombre,
                "plan_estudio": m.plan_estudio_id,
                "plan_estudio_codigo": m.plan_estudio.codigo,
                "plan_estudio_carrera_nombre": m.plan_estudio.carrera.nombre,
            }
            for m in obj.materias_origen.all()
        ]

    def get_materias_destino_display(self, obj):
        return [
            {
                "id": m.id,
                "codigo": m.codigo,
                "nombre": m.nombre,
                "plan_estudio": m.plan_estudio_id,
                "plan_estudio_codigo": m.plan_estudio.codigo,
                "plan_estudio_carrera_nombre": m.plan_estudio.carrera.nombre,
            }
            for m in obj.materias_destino.all()
        ]

    def validate(self, data):
        from .engine import EquivalenciasEngine
        from sacad.apps.academica.models import Materia

        request = self.context.get("request")
        if request and request.method in ("POST", "PUT", "PATCH"):
            instance = self.instance

            materias_origen = data.get("materias_origen")
            materias_destino = data.get("materias_destino")

            if materias_origen is None and instance is not None:
                materias_origen = list(instance.materias_origen.all())
            if materias_destino is None and instance is not None:
                materias_destino = list(instance.materias_destino.all())

            if (
                materias_origen is None
                or materias_destino is None
                or not materias_origen
                or not materias_destino
            ):
                raise serializers.ValidationError(
                    "Especificá las materias de origen y destino."
                )

            origen_ids = [m.id for m in materias_origen]
            destino_ids = [m.id for m in materias_destino]

            valido, error = EquivalenciasEngine.validar_mismo_plan(
                origen_ids, destino_ids
            )
            if not valido:
                raise serializers.ValidationError(error)

            if set(origen_ids) & set(destino_ids):
                raise serializers.ValidationError(
                    "Una materia no puede ser origen y destino de la misma equivalencia."
                )

            plan_destino = data.get("plan_destino")
            if plan_destino is None and instance is not None:
                plan_destino = instance.plan_destino
            if plan_destino is not None:
                malas = Materia.objects.filter(
                    id__in=destino_ids
                ).exclude(plan_estudio_id=plan_destino.pk)
                if malas.exists():
                    raise serializers.ValidationError(
                        {
                            "materias_destino": (
                                "Todas las materias destino deben pertenecer al plan "
                                "de estudio destino."
                            )
                        }
                    )
        return data


class EquivalenciaConsultaSerializer(serializers.Serializer):
    materia_origen_id = serializers.IntegerField()
    plan_destino_id = serializers.IntegerField()

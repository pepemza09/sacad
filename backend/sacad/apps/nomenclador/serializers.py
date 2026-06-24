from rest_framework import serializers
from .models import Disciplina, Subdisciplina, Especialidad


class DisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = "__all__"


class SubdisciplinaSerializer(serializers.ModelSerializer):
    disciplina_codigo = serializers.CharField(
        source="disciplina.codigo", read_only=True
    )

    class Meta:
        model = Subdisciplina
        fields = "__all__"


class EspecialidadSerializer(serializers.ModelSerializer):
    subdisciplina_codigo = serializers.CharField(
        source="subdisciplina.codigo", read_only=True
    )
    disciplina_codigo = serializers.CharField(
        source="subdisciplina.disciplina.codigo", read_only=True
    )

    class Meta:
        model = Especialidad
        fields = "__all__"

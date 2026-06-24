from rest_framework import serializers
from .models import Disciplina, Subdisciplina, Especialidad


class DisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = "__all__"


class SubdisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subdisciplina
        fields = "__all__"


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = "__all__"

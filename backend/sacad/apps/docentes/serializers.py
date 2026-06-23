from rest_framework import serializers
from .models import Docente


class DocenteSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(
        source="facultad.nombre", read_only=True
    )
    legajo_display = serializers.CharField(read_only=True)

    class Meta:
        model = Docente
        fields = "__all__"

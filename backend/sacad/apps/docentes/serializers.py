from rest_framework import serializers
from .models import Cargo, Dedicacion, Caracter, Docente


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

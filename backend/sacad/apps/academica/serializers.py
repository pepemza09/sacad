from rest_framework import serializers
from .models import Facultad, Sede, Carrera, PlanEstudio, TituloIntermedio, Area, Materia, Correlatividad, TipoMateria


class FacultadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facultad
        fields = "__all__"

    def validate_nombre_corto(self, value):
        qs = Facultad.objects.filter(nombre_corto__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya existe una facultad con ese nombre corto.")
        return value

    def validate_nombre(self, value):
        qs = Facultad.objects.filter(nombre__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya existe una facultad con ese nombre.")
        return value


class SedeSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(source="facultad.nombre", read_only=True)

    class Meta:
        model = Sede
        fields = "__all__"


class SedeListSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(source="facultad.nombre", read_only=True)

    class Meta:
        model = Sede
        fields = ["id", "codigo", "nombre", "facultad", "facultad_nombre", "activa", "direccion", "localidad"]


class FacultadListSerializer(serializers.ModelSerializer):
    carreras_count = serializers.SerializerMethodField()
    sedes_count = serializers.SerializerMethodField()

    class Meta:
        model = Facultad
        fields = ["id", "codigo", "nombre_corto", "nombre", "activa", "carreras_count", "sedes_count"]

    def get_carreras_count(self, obj):
        return obj.carreras.count()

    def get_sedes_count(self, obj):
        return obj.sedes.count()


class CarreraSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(source="facultad.nombre", read_only=True)
    sedes = serializers.PrimaryKeyRelatedField(many=True, queryset=Sede.objects.all(), required=False)
    sedes_nombres = serializers.SerializerMethodField(read_only=True)
    codigo = serializers.CharField(required=False, allow_blank=True, default="")
    titulo_otorga = serializers.CharField(required=False, allow_blank=True, default="")
    duracion_anos = serializers.IntegerField(required=False, default=1)
    nivel = serializers.ChoiceField(choices=Carrera.NIVEL_CHOICES, required=False, default="grado")
    modalidad = serializers.ChoiceField(choices=Carrera.MODALIDAD_CHOICES, required=False, default="presencial")

    class Meta:
        model = Carrera
        fields = [
            "id", "codigo", "codigo_ministerial", "nombre_corto", "nombre",
            "facultad", "facultad_nombre", "sedes", "sedes_nombres",
            "titulo_otorga", "duracion_anos",
            "nivel", "modalidad", "director", "activa",
        ]

    def get_sedes_nombres(self, obj):
        return [{"id": s.id, "nombre": s.nombre} for s in obj.sedes.all()]

    def validate(self, attrs):
        if not attrs.get("codigo"):
            attrs["codigo"] = attrs.get("codigo_ministerial", "sin-codigo")
        return attrs


class CarreraListSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(source="facultad.nombre", read_only=True)
    sedes_nombres = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Carrera
        fields = [
            "id", "codigo_ministerial", "nombre_corto", "nombre",
            "facultad", "facultad_nombre", "sedes_nombres", "activa",
        ]

    def get_sedes_nombres(self, obj):
        return [{"id": s.id, "nombre": s.nombre} for s in obj.sedes.all()]


class TituloIntermedioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TituloIntermedio
        fields = ["id", "nombre", "duracion_anos"]


class PlanEstudioSerializer(serializers.ModelSerializer):
    carrera_nombre = serializers.CharField(source="carrera.nombre", read_only=True)
    materias_count = serializers.SerializerMethodField()
    titulos_intermedios = TituloIntermedioSerializer(many=True, required=False)

    class Meta:
        model = PlanEstudio
        fields = "__all__"

    def get_materias_count(self, obj):
        return obj.materias.count()

    def create(self, validated_data):
        titulos_data = validated_data.pop("titulos_intermedios", [])
        plan = PlanEstudio.objects.create(**validated_data)
        for t_data in titulos_data:
            t, _ = TituloIntermedio.objects.get_or_create(**t_data)
            plan.titulos_intermedios.add(t)
        return plan

    def update(self, instance, validated_data):
        titulos_data = validated_data.pop("titulos_intermedios", [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.titulos_intermedios.clear()
        for t_data in titulos_data:
            t, _ = TituloIntermedio.objects.get_or_create(**t_data)
            instance.titulos_intermedios.add(t)
        return instance


class PlanEstudioListSerializer(serializers.ModelSerializer):
    carrera_nombre = serializers.CharField(source="carrera.nombre", read_only=True)
    materias_count = serializers.SerializerMethodField()
    titulos_intermedios = TituloIntermedioSerializer(many=True, read_only=True)

    class Meta:
        model = PlanEstudio
        fields = [
            "id", "codigo", "version", "carrera", "carrera_nombre",
            "titulo_otorga", "duracion_anos", "vigente",
            "año_inicio_implementacion", "materias_count", "titulos_intermedios",
        ]

    def get_materias_count(self, obj):
        return obj.materias.count()


class AreaSerializer(serializers.ModelSerializer):
    plan_estudio_codigo = serializers.CharField(source="plan_estudio.codigo", read_only=True)
    carrera_nombre = serializers.CharField(source="plan_estudio.carrera.nombre", read_only=True)
    materias_count = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = "__all__"

    def get_materias_count(self, obj):
        return obj.materias.count()


class TipoMateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMateria
        fields = "__all__"


class MateriaSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.SerializerMethodField()
    plan_estudio_codigo = serializers.CharField(source="plan_estudio.codigo", read_only=True)
    carrera_nombre = serializers.CharField(source="plan_estudio.carrera.nombre", read_only=True)
    area_nombre = serializers.CharField(source="area.nombre", read_only=True, allow_null=True)
    disciplina_codigo = serializers.CharField(source="disciplina.codigo", read_only=True, allow_null=True)
    disciplina_descripcion = serializers.CharField(source="disciplina.descripcion", read_only=True, allow_null=True)
    subdisciplina_codigo = serializers.CharField(source="subdisciplina.codigo", read_only=True, allow_null=True)
    subdisciplina_descripcion = serializers.CharField(source="subdisciplina.descripcion", read_only=True, allow_null=True)
    especialidad_codigo = serializers.CharField(source="especialidad.codigo", read_only=True, allow_null=True)
    especialidad_descripcion = serializers.CharField(source="especialidad.descripcion", read_only=True, allow_null=True)

    class Meta:
        model = Materia
        fields = "__all__"

    def get_tipo_nombre(self, obj):
        return obj.tipo.nombre if obj.tipo else None


class MateriaDetailSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.SerializerMethodField()
    plan_estudio_codigo = serializers.CharField(source="plan_estudio.codigo", read_only=True)
    carrera_nombre = serializers.CharField(source="plan_estudio.carrera.nombre", read_only=True)
    area_nombre = serializers.CharField(source="area.nombre", read_only=True, allow_null=True)
    disciplina_codigo = serializers.CharField(source="disciplina.codigo", read_only=True, allow_null=True)
    disciplina_descripcion = serializers.CharField(source="disciplina.descripcion", read_only=True, allow_null=True)
    subdisciplina_codigo = serializers.CharField(source="subdisciplina.codigo", read_only=True, allow_null=True)
    subdisciplina_descripcion = serializers.CharField(source="subdisciplina.descripcion", read_only=True, allow_null=True)
    especialidad_codigo = serializers.CharField(source="especialidad.codigo", read_only=True, allow_null=True)
    especialidad_descripcion = serializers.CharField(source="especialidad.descripcion", read_only=True, allow_null=True)
    correlativas = serializers.SerializerMethodField()
    requisito_de = serializers.SerializerMethodField()

    class Meta:
        model = Materia
        fields = "__all__"

    def get_correlativas(self, obj):
        return [
            {
                "id": c.materia_requerida.id,
                "codigo": c.materia_requerida.codigo,
                "nombre": c.materia_requerida.nombre,
                "tipo": c.tipo,
            }
            for c in obj.correlativas.all()
        ]

    def get_requisito_de(self, obj):
        return [
            {
                "id": r.materia.id,
                "codigo": r.materia.codigo,
                "nombre": r.materia.nombre,
                "tipo": r.tipo,
            }
            for r in obj.requisito_de.all()
        ]


class CorrelatividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Correlatividad
        fields = "__all__"


class ArbolCurricularSerializer(serializers.Serializer):
    año = serializers.IntegerField()
    cuatrimestre = serializers.CharField()
    materias = MateriaSerializer(many=True)

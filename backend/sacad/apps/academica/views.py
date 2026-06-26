from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Facultad, Sede, Carrera, PlanEstudio,
    Materia, Correlatividad, TipoMateria, Area,
)
from .serializers import (
    FacultadSerializer, FacultadListSerializer,
    SedeSerializer, SedeListSerializer,
    CarreraSerializer, CarreraListSerializer,
    PlanEstudioSerializer, PlanEstudioListSerializer,
    MateriaSerializer, MateriaDetailSerializer,
    CorrelatividadSerializer, ArbolCurricularSerializer,
    TipoMateriaSerializer, AreaSerializer,
)
from .filters import (
    FacultadFilter, SedeFilter, CarreraFilter,
    PlanEstudioFilter, MateriaFilter,
)
from .permissions import EsAdminUniversidad, EsSecretarioAcademico, EsDirectorCarrera


class FacultadViewSet(viewsets.ModelViewSet):
    queryset = Facultad.objects.all()
    filterset_class = FacultadFilter
    search_fields = ["codigo", "nombre_corto", "nombre"]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return FacultadListSerializer
        return FacultadSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [EsSecretarioAcademico()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n_sedes = instance.sedes.count()
        if n_sedes:
            return Response(
                {"detail": f"Facultad no eliminable: tiene {n_sedes} sede{'s' if n_sedes != 1 else ''} asociada{'s' if n_sedes != 1 else ''}. Eliminá las sedes primero."},
                status=status.HTTP_409_CONFLICT,
            )
        n_carreras = instance.carreras.count()
        if n_carreras:
            return Response(
                {"detail": f"Facultad no eliminable: tiene {n_carreras} carrera{'s' if n_carreras != 1 else ''} asociada{'s' if n_carreras != 1 else ''}. Eliminá las carreras primero."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SedeViewSet(viewsets.ModelViewSet):
    queryset = Sede.objects.select_related("facultad").all()
    filterset_class = SedeFilter
    search_fields = ["codigo", "nombre", "direccion", "localidad"]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return SedeListSerializer
        return SedeSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [EsSecretarioAcademico()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n = instance.carreras.count()
        if n:
            return Response(
                {"detail": f"Sede no eliminable: tiene {n} carrera{'s' if n != 1 else ''} asociada{'s' if n != 1 else ''}. Eliminá las carreras primero."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CarreraViewSet(viewsets.ModelViewSet):
    queryset = Carrera.objects.select_related("facultad").all()
    serializer_class = CarreraSerializer
    filterset_class = CarreraFilter
    search_fields = ["nombre", "codigo", "codigo_ministerial", "nombre_corto"]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return CarreraListSerializer
        return CarreraSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [EsSecretarioAcademico()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n = instance.planes.count()
        if n:
            return Response(
                {
                    "detail": f"Carrera no eliminable: tiene {n} plan{'es' if n != 1 else ''} de estudio asociado{'s' if n != 1 else ''}. Eliminá los planes primero."
                },
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanEstudioViewSet(viewsets.ModelViewSet):
    queryset = PlanEstudio.objects.select_related("carrera").all()
    filterset_class = PlanEstudioFilter
    search_fields = ["codigo"]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return PlanEstudioListSerializer
        return PlanEstudioSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [EsSecretarioAcademico()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n_materias = instance.materias.count()
        if n_materias:
            return Response(
                {
                    "detail": f"Plan no eliminable: tiene {n_materias} materia{'s' if n_materias != 1 else ''} asociada{'s' if n_materias != 1 else ''}. Eliminá las materias primero."
                },
                status=status.HTTP_409_CONFLICT,
            )
        n_areas = instance.areas.count()
        if n_areas:
            return Response(
                {
                    "detail": f"Plan no eliminable: tiene {n_areas} área{'s' if n_areas != 1 else ''} asociada{'s' if n_areas != 1 else ''}. Eliminá las áreas primero."
                },
                status=status.HTTP_409_CONFLICT,
            )
        n_equis = instance.equivalencias_destino.count()
        if n_equis:
            return Response(
                {
                    "detail": f"Plan no eliminable: está referenciado en {n_equis} equivalencia{'s' if n_equis != 1 else ''} como destino. Eliminá las equivalencias primero."
                },
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def arbol_curricular(self, request, pk=None):
        plan = self.get_object()
        materias = plan.materias.select_related("plan_estudio").all()
        arbol = {}
        for m in materias:
            key = (m.año, m.cuatrimestre)
            if key not in arbol:
                arbol[key] = {
                    "año": m.año,
                    "cuatrimestre": m.cuatrimestre,
                    "materias": [],
                }
            arbol[key]["materias"].append(MateriaSerializer(m).data)
        result = sorted(arbol.values(), key=lambda x: (x["año"], x["cuatrimestre"]))
        return Response(result)


class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.select_related(
        "plan_estudio__carrera", "disciplina", "subdisciplina", "especialidad"
    ).all()
    filterset_class = MateriaFilter
    search_fields = ["nombre", "codigo", "periodo", "tipo__nombre", "contenidos_minimos"]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MateriaDetailSerializer
        return MateriaSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [EsDirectorCarrera()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n_req = instance.requisito_de.count()
        if n_req:
            return Response(
                {"detail": f"Materia no eliminable: es requisito de {n_req} correlatividad{'es' if n_req != 1 else ''}. Eliminá las correlatividades primero."},
                status=status.HTTP_409_CONFLICT,
            )
        n_orig = instance.equivalencias_origen.count()
        if n_orig:
            return Response(
                {"detail": f"Materia no eliminable: está referenciada en {n_orig} equivalencia{'s' if n_orig != 1 else ''} como origen. Eliminá las equivalencias primero."},
                status=status.HTTP_409_CONFLICT,
            )
        n_dest = instance.equivalencias_destino.count()
        if n_dest:
            return Response(
                {"detail": f"Materia no eliminable: está referenciada en {n_dest} equivalencia{'s' if n_dest != 1 else ''} como destino. Eliminá las equivalencias primero."},
                status=status.HTTP_409_CONFLICT,
            )
        n_cargos = instance.cargos_docentes.count()
        if n_cargos:
            return Response(
                {"detail": f"Materia no eliminable: está asignada a {n_cargos} cargo{'s' if n_cargos != 1 else ''} docente. Eliminá los cargos primero."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def correlativas(self, request, pk=None):
        materia = self.get_object()
        corrs = materia.correlativas.select_related("materia_requerida").all()
        data = [
            {
                "id": c.materia_requerida.id,
                "codigo": c.materia_requerida.codigo,
                "nombre": c.materia_requerida.nombre,
                "tipo": c.tipo,
            }
            for c in corrs
        ]
        return Response(data)


class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.select_related("plan_estudio").all()
    serializer_class = AreaSerializer
    search_fields = ["nombre"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        plan_estudio = self.request.query_params.get("plan_estudio")
        if plan_estudio:
            qs = qs.filter(plan_estudio_id=plan_estudio)
        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [EsSecretarioAcademico()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n = instance.materias.count()
        if n:
            return Response(
                {"detail": f"Área no eliminable: tiene {n} materia{'s' if n != 1 else ''} asociada{'s' if n != 1 else ''}. Eliminá las materias primero."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CorrelatividadViewSet(viewsets.ModelViewSet):
    queryset = Correlatividad.objects.select_related("materia", "materia_requerida").all()
    serializer_class = CorrelatividadSerializer
    permission_classes = [IsAuthenticated, EsDirectorCarrera]


class TipoMateriaViewSet(viewsets.ModelViewSet):
    queryset = TipoMateria.objects.all()
    serializer_class = TipoMateriaSerializer
    search_fields = ["nombre"]
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [EsSecretarioAcademico()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n = instance.materias.count()
        if n:
            return Response(
                {"detail": f"Tipo de materia no eliminable: tiene {n} materia{'s' if n != 1 else ''} asociada{'s' if n != 1 else ''}. Eliminá las materias primero."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

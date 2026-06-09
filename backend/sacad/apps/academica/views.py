from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import ProtectedError
from .models import (
    Facultad, Sede, Carrera, PlanEstudio,
    Materia, Correlatividad, TipoMateria,
)
from .serializers import (
    FacultadSerializer, FacultadListSerializer,
    SedeSerializer, SedeListSerializer,
    CarreraSerializer, CarreraListSerializer,
    PlanEstudioSerializer, PlanEstudioListSerializer,
    MateriaSerializer, MateriaDetailSerializer,
    CorrelatividadSerializer, ArbolCurricularSerializer,
    TipoMateriaSerializer,
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
            return [EsAdminUniversidad()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError as e:
            return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        if instance.sedes.exists():
            raise ProtectedError(
                f"No se puede eliminar la facultad porque tiene {instance.sedes.count()} sede(s) asociada(s).",
                instance.sedes.all(),
            )
        if instance.carreras.exists():
            raise ProtectedError(
                f"No se puede eliminar la facultad porque tiene {instance.carreras.count()} carrera(s) asociada(s).",
                instance.carreras.all(),
            )
        instance.delete()


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
        try:
            self.perform_destroy(instance)
        except ProtectedError as e:
            return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        if instance.carreras.exists():
            raise ProtectedError(
                f"No se puede eliminar la sede porque tiene {instance.carreras.count()} carrera(s) asociada(s).",
                instance.carreras.all(),
            )
        instance.delete()


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
        try:
            self.perform_destroy(instance)
        except ProtectedError as e:
            return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        if instance.planes.exists():
            raise ProtectedError(
                f"No se puede eliminar la carrera porque tiene {instance.planes.count()} plan(es) de estudio asociado(s).",
                instance.planes.all(),
            )
        instance.delete()


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
        try:
            self.perform_destroy(instance)
        except ProtectedError as e:
            return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        if instance.materias.exists():
            raise ProtectedError(
                f"No se puede eliminar el plan porque tiene {instance.materias.count()} materia(s) asociada(s).",
                instance.materias.all(),
            )
        instance.delete()

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
    queryset = Materia.objects.select_related("plan_estudio__carrera").all()
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

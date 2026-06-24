from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from .models import Disciplina, Subdisciplina, Especialidad
from .serializers import (
    DisciplinaSerializer,
    SubdisciplinaSerializer,
    EspecialidadSerializer,
)
from sacad.apps.usuarios.permissions import tiene_permiso_menu


MENU_KEY = "configuracion.nomenclador"


class DisciplinaViewSet(viewsets.ModelViewSet):
    queryset = Disciplina.objects.all()
    serializer_class = DisciplinaSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        read_ok = tiene_permiso_menu(
            request.user, MENU_KEY, require_write=request.method not in SAFE_METHODS
        )
        if not read_ok:
            self.permission_denied(
                request,
                message="No tenés permiso para ver o modificar el nomenclador.",
            )


class SubdisciplinaViewSet(viewsets.ModelViewSet):
    queryset = Subdisciplina.objects.select_related("disciplina").all()
    serializer_class = SubdisciplinaSerializer
    filterset_fields = ["disciplina"]

    def check_permissions(self, request):
        super().check_permissions(request)
        read_ok = tiene_permiso_menu(
            request.user, MENU_KEY, require_write=request.method not in SAFE_METHODS
        )
        if not read_ok:
            self.permission_denied(
                request,
                message="No tenés permiso para ver o modificar el nomenclador.",
            )


class EspecialidadViewSet(viewsets.ModelViewSet):
    queryset = Especialidad.objects.select_related(
        "subdisciplina__disciplina"
    ).all()
    serializer_class = EspecialidadSerializer
    filterset_fields = ["subdisciplina"]

    def check_permissions(self, request):
        super().check_permissions(request)
        read_ok = tiene_permiso_menu(
            request.user, MENU_KEY, require_write=request.method not in SAFE_METHODS
        )
        if not read_ok:
            self.permission_denied(
                request,
                message="No tenés permiso para ver o modificar el nomenclador.",
            )

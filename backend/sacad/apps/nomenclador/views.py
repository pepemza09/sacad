from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n_sub = instance.subdisciplinas.count()
        if n_sub:
            return Response(
                {"detail": f"Disciplina no eliminable: tiene {n_sub} subdisciplina{'s' if n_sub != 1 else ''} asociada{'s' if n_sub != 1 else ''}. Eliminá las subdisciplinas primero."},
                status=status.HTTP_409_CONFLICT,
            )
        n_mat = instance.materias.count()
        if n_mat:
            return Response(
                {"detail": f"Disciplina no eliminable: tiene {n_mat} materia{'s' if n_mat != 1 else ''} asociada{'s' if n_mat != 1 else ''}. Eliminá las materias primero."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n_esp = instance.especialidades.count()
        if n_esp:
            return Response(
                {"detail": f"Subdisciplina no eliminable: tiene {n_esp} especialidad{'es' if n_esp != 1 else ''} asociada{'s' if n_esp != 1 else ''}. Eliminá las especialidades primero."},
                status=status.HTTP_409_CONFLICT,
            )
        n_mat = instance.materias.count()
        if n_mat:
            return Response(
                {"detail": f"Subdisciplina no eliminable: tiene {n_mat} materia{'s' if n_mat != 1 else ''} asociada{'s' if n_mat != 1 else ''}. Eliminá las materias primero."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        n = instance.materias.count()
        if n:
            return Response(
                {"detail": f"Especialidad no eliminable: tiene {n} materia{'s' if n != 1 else ''} asociada{'s' if n != 1 else ''}. Eliminá las materias primero."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

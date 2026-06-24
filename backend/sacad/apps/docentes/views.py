from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from .models import Cargo, Dedicacion, Caracter, Docente, CargoDocente
from .serializers import (
    CargoSerializer, DedicacionSerializer,
    CaracterSerializer, DocenteSerializer, CargoDocenteSerializer,
)
from sacad.apps.usuarios.permissions import tiene_permiso_menu


MENU_KEY = "configuracion.designaciones"


class CargoViewSet(viewsets.ModelViewSet):
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        # SAFE_METHODS → require_read=False (checks can_read), else → require_write (checks can_write)
        read_ok = tiene_permiso_menu(request.user, MENU_KEY, require_write=request.method not in SAFE_METHODS)
        if not read_ok:
            self.permission_denied(request, message="No tenés permiso para ver o modificar designaciones.")


class DedicacionViewSet(viewsets.ModelViewSet):
    queryset = Dedicacion.objects.all()
    serializer_class = DedicacionSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        read_ok = tiene_permiso_menu(request.user, MENU_KEY, require_write=request.method not in SAFE_METHODS)
        if not read_ok:
            self.permission_denied(request, message="No tenés permiso para ver o modificar designaciones.")


class CaracterViewSet(viewsets.ModelViewSet):
    queryset = Caracter.objects.all()
    serializer_class = CaracterSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        read_ok = tiene_permiso_menu(request.user, MENU_KEY, require_write=request.method not in SAFE_METHODS)
        if not read_ok:
            self.permission_denied(request, message="No tenés permiso para ver o modificar designaciones.")


class CargoDocenteViewSet(viewsets.ModelViewSet):
    queryset = CargoDocente.objects.select_related(
        "docente", "materia__plan_estudio__carrera__facultad",
        "materia__area", "cargo", "dedicacion", "caracter",
    ).all()
    serializer_class = CargoDocenteSerializer
    search_fields = ["docente__apellido", "docente__nombre", "materia__nombre", "materia__codigo"]

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in SAFE_METHODS:
            if not tiene_permiso_menu(request.user, "docentes", require_write=True):
                self.permission_denied(
                    request,
                    message="No tenés permiso para modificar cargos docentes.",
                )


class DocenteViewSet(viewsets.ModelViewSet):
    queryset = Docente.objects.select_related("facultad").all()
    serializer_class = DocenteSerializer
    search_fields = ["apellido", "nombre", "email", "dni"]

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in SAFE_METHODS:
            if not tiene_permiso_menu(request.user, "docentes", require_write=True):
                self.permission_denied(
                    request,
                    message="No tenés permiso para modificar docentes.",
                )

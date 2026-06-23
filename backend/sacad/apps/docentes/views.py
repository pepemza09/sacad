from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from .models import Docente
from .serializers import DocenteSerializer
from sacad.apps.usuarios.permissions import tiene_permiso_menu


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

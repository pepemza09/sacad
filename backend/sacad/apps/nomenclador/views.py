from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
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


def _serializar_entrada(d: Disciplina | None = None, s: Subdisciplina | None = None, e: Especialidad | None = None) -> dict:
    """Serializa una entrada del nomenclador en formato plano."""
    if e:
        return {
            "id": f"e_{e.id}",
            "tipo": "especialidad",
            "disciplina_codigo": e.subdisciplina.disciplina.codigo,
            "subdisciplina_codigo": e.subdisciplina.codigo,
            "especialidad_codigo": e.codigo,
            "nombre": e.descripcion,
            "activo": e.activo and e.subdisciplina.activo and e.subdisciplina.disciplina.activo,
        }
    if s:
        return {
            "id": f"s_{s.id}",
            "tipo": "subdisciplina",
            "disciplina_codigo": s.disciplina.codigo,
            "subdisciplina_codigo": s.codigo,
            "especialidad_codigo": "",
            "nombre": s.descripcion,
            "activo": s.activo and s.disciplina.activo,
        }
    if d:
        return {
            "id": f"d_{d.id}",
            "tipo": "disciplina",
            "disciplina_codigo": d.codigo,
            "subdisciplina_codigo": "",
            "especialidad_codigo": "",
            "nombre": d.descripcion,
            "activo": d.activo,
        }
    return {}


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def entradas_nomenclador(request):
    if request.method == "POST":
        if not tiene_permiso_menu(request.user, MENU_KEY, require_write=True):
            return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)

        entry_id = request.data.get("id")

        if entry_id:
            tipo, pk = entry_id.split("_", 1)
            nombre = request.data.get("nombre", "").strip()
            activo = request.data.get("activo", True)

            if not nombre:
                return Response({"detail": "El nombre es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

            if tipo == "d":
                d = get_object_or_404(Disciplina, id=pk)
                d.descripcion = nombre
                d.activo = activo
                d.save(update_fields=["descripcion", "activo"])
                return Response(_serializar_entrada(d=d))
            elif tipo == "s":
                s = get_object_or_404(Subdisciplina, id=pk)
                s.descripcion = nombre
                s.activo = activo
                s.save(update_fields=["descripcion", "activo"])
                return Response(_serializar_entrada(s=s))
            elif tipo == "e":
                e = get_object_or_404(Especialidad, id=pk)
                e.descripcion = nombre
                e.activo = activo
                e.save(update_fields=["descripcion", "activo"])
                return Response(_serializar_entrada(e=e))

            return Response({"detail": "ID inválido."}, status=status.HTTP_400_BAD_REQUEST)

        # Crear nueva entrada
        disciplina_codigo = request.data.get("disciplina_codigo", "").strip().upper()
        subdisciplina_codigo = request.data.get("subdisciplina_codigo", "").strip().upper()
        especialidad_codigo = request.data.get("especialidad_codigo", "").strip().upper()
        nombre = request.data.get("nombre", "").strip()
        activo = request.data.get("activo", True)

        if not disciplina_codigo or len(disciplina_codigo) != 2:
            return Response({"detail": "El código de disciplina debe tener 2 caracteres."}, status=status.HTTP_400_BAD_REQUEST)
        if not nombre:
            return Response({"detail": "El nombre es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        d, _ = Disciplina.objects.get_or_create(
            codigo=disciplina_codigo,
            defaults={"descripcion": nombre, "activo": activo},
        )

        if subdisciplina_codigo and len(subdisciplina_codigo) == 2:
            s, _ = Subdisciplina.objects.get_or_create(
                codigo=subdisciplina_codigo,
                disciplina=d,
                defaults={"descripcion": nombre, "activo": activo},
            )
        else:
            return Response(_serializar_entrada(d=d), status=status.HTTP_201_CREATED)

        if especialidad_codigo and len(especialidad_codigo) == 2:
            e, _ = Especialidad.objects.get_or_create(
                codigo=especialidad_codigo,
                subdisciplina=s,
                defaults={"descripcion": nombre, "activo": activo},
            )
            return Response(_serializar_entrada(e=e), status=status.HTTP_201_CREATED)

        return Response(_serializar_entrada(s=s), status=status.HTTP_201_CREATED)

    # GET — listar todas las entradas planas ordenadas
    result = []

    for d in Disciplina.objects.all():
        if not d.subdisciplinas.exists():
            result.append(_serializar_entrada(d=d))

    for s in Subdisciplina.objects.select_related("disciplina").all():
        if not s.especialidades.exists():
            result.append(_serializar_entrada(s=s))

    for e in Especialidad.objects.select_related("subdisciplina__disciplina").all():
        result.append(_serializar_entrada(e=e))

    result.sort(key=lambda x: (
        x["disciplina_codigo"],
        x["subdisciplina_codigo"],
        x["especialidad_codigo"],
    ))
    return Response(result)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Equivalencia
from .serializers import EquivalenciaSerializer
from .engine import EquivalenciasEngine


class EquivalenciaViewSet(viewsets.ModelViewSet):
    queryset = Equivalencia.objects.prefetch_related(
        "materias_origen", "materias_destino"
    ).all()
    serializer_class = EquivalenciaSerializer
    search_fields = ["resolucion", "observaciones"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        plan_destino = self.request.query_params.get("plan_destino")
        materia_origen = self.request.query_params.get("materia_origen")
        if plan_destino:
            qs = qs.filter(plan_destino__id=plan_destino)
        if materia_origen:
            qs = qs.filter(materias_origen__id=materia_origen)
        return qs

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="materias_origen",
                description="IDs de materias origen separados por coma (ej: 1,2,3)",
                required=True,
                type=str,
            ),
            OpenApiParameter(
                name="plan_destino",
                description="ID del plan destino",
                required=True,
                type=int,
            ),
        ]
    )
    @action(detail=False, methods=["get"])
    def consultar(self, request):
        materias_origen_raw = request.query_params.get("materias_origen", "")
        plan_destino = request.query_params.get("plan_destino")

        if not materias_origen_raw or not plan_destino:
            return Response(
                {"error": "Se requieren materias_origen y plan_destino"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            materias_origen_ids = [
                int(x.strip())
                for x in materias_origen_raw.split(",")
                if x.strip()
            ]
            plan_destino_id = int(plan_destino)
        except ValueError:
            return Response(
                {"error": "IDs inválidos"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        engine = EquivalenciasEngine(
            materias_origen_ids=materias_origen_ids,
            plan_destino_id=plan_destino_id,
        )
        resultados = engine.resolver()
        return Response(resultados)

    @action(detail=False, methods=["post"])
    def validar(self, request):
        materias_origen = request.data.get("materias_origen", [])
        materias_destino = request.data.get("materias_destino", [])

        valido, error = EquivalenciasEngine.validar_sin_ciclos(
            materias_origen, materias_destino
        )
        if not valido:
            return Response(
                {"valido": False, "error": error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valido, error = EquivalenciasEngine.validar_mismo_plan(
            materias_origen, materias_destino
        )
        if not valido:
            return Response(
                {"valido": False, "error": error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"valido": True})

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Equivalencia
from .serializers import EquivalenciaSerializer, EquivalenciaConsultaSerializer
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
            OpenApiParameter(name="materia_origen", description="ID materia origen", required=True, type=int),
            OpenApiParameter(name="plan_destino", description="ID plan destino", required=True, type=int),
        ]
    )
    @action(detail=False, methods=["get"])
    def consultar(self, request):
        materia_origen = request.query_params.get("materia_origen")
        plan_destino = request.query_params.get("plan_destino")

        if not materia_origen or not plan_destino:
            return Response(
                {"error": "Se requieren materia_origen y plan_destino"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        engine = EquivalenciasEngine(
            materia_origen_id=int(materia_origen),
            plan_destino_id=int(plan_destino),
        )
        resultados = engine.resolver_en_cascada()
        return Response(resultados)

    @action(detail=False, methods=["post"])
    def validar(self, request):
        materias_origen = request.data.get("materias_origen", [])
        materias_destino = request.data.get("materias_destino", [])
        valido, error = EquivalenciasEngine.validar_sin_ciclos(
            materias_origen, materias_destino
        )
        if valido:
            return Response({"valido": True})
        return Response({"valido": False, "error": error}, status=status.HTTP_400_BAD_REQUEST)

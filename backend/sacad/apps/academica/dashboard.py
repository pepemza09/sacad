from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Facultad, Carrera, PlanEstudio, Materia


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    facultad_id = request.query_params.get("facultad")

    data = {
        "total_facultades": Facultad.objects.filter(activa=True).count(),
        "total_carreras": Carrera.objects.filter(activa=True).count(),
        "planes_vigentes": PlanEstudio.objects.filter(vigente=True).count(),
        "total_materias": Materia.objects.count(),
    }

    base_facultades = Facultad.objects.filter(activa=True)
    if facultad_id:
        base_facultades = base_facultades.filter(id=facultad_id)

    carreras_por_facultad = (
        Carrera.objects.filter(activa=True, facultad__in=base_facultades)
        .values("facultad__nombre")
        .annotate(count=Count("id"))
        .order_by("facultad__nombre")
    )

    data["carreras_por_facultad"] = {
        item["facultad__nombre"]: item["count"]
        for item in carreras_por_facultad
    }

    materias_por_año = (
        Materia.objects.filter(plan_estudio__vigente=True)
        .values("año")
        .annotate(count=Count("id"))
        .order_by("año")
    )

    data["materias_por_año"] = {
        item["año"]: item["count"]
        for item in materias_por_año
    }

    ultimos_planes = (
        PlanEstudio.objects.select_related("carrera")
        .order_by("-año_inicio_implementacion")[:10]
        .values("id", "codigo", "carrera__nombre", "año_inicio_implementacion", "vigente")
    )

    data["ultimos_planes"] = [
        {
            "id": p["id"],
            "nombre": p["codigo"],
            "carrera": p["carrera__nombre"],
            "año_inicio_implementacion": p["año_inicio_implementacion"],
            "activo": p["vigente"],
        }
        for p in ultimos_planes
    ]

    return Response(data)

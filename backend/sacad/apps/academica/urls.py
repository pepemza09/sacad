from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    FacultadViewSet, SedeViewSet, CarreraViewSet,
    PlanEstudioViewSet, MateriaViewSet, CorrelatividadViewSet,
)
from .dashboard import dashboard_stats

router = DefaultRouter()
router.register(r"facultades", FacultadViewSet)
router.register(r"sedes", SedeViewSet)
router.register(r"carreras", CarreraViewSet)
router.register(r"planes", PlanEstudioViewSet)
router.register(r"materias", MateriaViewSet)
router.register(r"correlatividades", CorrelatividadViewSet)

urlpatterns = router.urls + [
    path("dashboard/stats/", dashboard_stats, name="dashboard-stats"),
]

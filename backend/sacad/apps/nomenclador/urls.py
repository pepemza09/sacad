from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import DisciplinaViewSet, SubdisciplinaViewSet, EspecialidadViewSet, entradas_nomenclador

router = DefaultRouter()
router.register(r"disciplinas", DisciplinaViewSet)
router.register(r"subdisciplinas", SubdisciplinaViewSet)
router.register(r"especialidades", EspecialidadViewSet)

urlpatterns = router.urls + [
    path("entradas/", entradas_nomenclador, name="entradas-nomenclador"),
]

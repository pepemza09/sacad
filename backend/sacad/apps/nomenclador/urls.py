from rest_framework.routers import DefaultRouter
from .views import DisciplinaViewSet, SubdisciplinaViewSet, EspecialidadViewSet

router = DefaultRouter()
router.register(r"disciplinas", DisciplinaViewSet)
router.register(r"subdisciplinas", SubdisciplinaViewSet)
router.register(r"especialidades", EspecialidadViewSet)

urlpatterns = router.urls

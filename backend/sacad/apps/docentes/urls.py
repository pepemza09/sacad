from rest_framework.routers import DefaultRouter
from .views import CargoViewSet, DedicacionViewSet, CaracterViewSet, DocenteViewSet, CargoDocenteViewSet

router = DefaultRouter()
router.register(r"cargos", CargoViewSet)
router.register(r"dedicaciones", DedicacionViewSet)
router.register(r"caracteres", CaracterViewSet)
router.register(r"docentes", DocenteViewSet)
router.register(r"cargos-docentes", CargoDocenteViewSet)

urlpatterns = router.urls

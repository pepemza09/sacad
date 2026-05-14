from rest_framework.routers import DefaultRouter
from .views import EquivalenciaViewSet

router = DefaultRouter()
router.register(r"equivalencias", EquivalenciaViewSet)

urlpatterns = router.urls

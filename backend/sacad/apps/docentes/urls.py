from rest_framework.routers import DefaultRouter
from .views import DocenteViewSet

router = DefaultRouter()
router.register(r"docentes", DocenteViewSet)

urlpatterns = router.urls

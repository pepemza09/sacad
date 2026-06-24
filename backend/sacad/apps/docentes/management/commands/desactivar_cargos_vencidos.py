from django.core.management.base import BaseCommand
from django.utils import timezone
from sacad.apps.docentes.models import CargoDocente


class Command(BaseCommand):
    help = "Desactiva cargos docentes cuya fecha de fin ya pasó"

    def handle(self, *args, **options):
        today = timezone.now().date()
        qs = CargoDocente.objects.filter(fecha_fin__lt=today, activo=True)
        count = qs.update(activo=False)
        self.stdout.write(f"{count} cargo(s) desactivado(s).")

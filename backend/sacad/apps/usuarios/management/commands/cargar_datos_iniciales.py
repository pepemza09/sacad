from django.core.management import call_command
from django.core.management.base import BaseCommand
from sacad.apps.academica.models import Facultad


class Command(BaseCommand):
    help = "Carga datos iniciales si la DB está vacía (idempotente)"

    def handle(self, *args, **options):
        if Facultad.objects.exists():
            self.stdout.write("La DB ya tiene datos. Se saltea la carga inicial.")
            return

        self.stdout.write("DB vacía. Cargando datos iniciales...")
        call_command("loaddata", "dump_full")
        self.stdout.write(self.style.SUCCESS("Datos iniciales cargados correctamente"))

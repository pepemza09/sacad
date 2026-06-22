from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from sacad.apps.usuarios.models import Profile
from sacad.apps.academica.models import TipoMateria

User = get_user_model()


class Command(BaseCommand):
    help = "Crea el usuario administrador admin@sacad.edu con permisos de superusuario"

    def handle(self, *args, **options):
        email = "admin@sacad.edu"
        password = "admin123"

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": "admin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()

        Profile.objects.get_or_create(
            user=user,
            defaults={"approval_status": Profile.ApprovalStatus.APPROVED},
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"Admin {email} creado correctamente"))
        else:
            self.stdout.write(self.style.WARNING(f"Admin {email} actualizado"))

        for tipo_nombre in ["obligatoria", "optativa", "electiva"]:
            TipoMateria.objects.get_or_create(nombre=tipo_nombre)
        self.stdout.write(self.style.SUCCESS("Tipos de materia creados"))

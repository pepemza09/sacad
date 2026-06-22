from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Crea un usuario superadmin"

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Email del usuario")
        parser.add_argument("--password", type=str, help="Contraseña (genera una aleatoria si no se especifica)")

    def handle(self, *args, **options):
        email = options["email"]
        password = options.get("password")

        if User.objects.filter(email=email).exists():
            raise CommandError(f"Ya existe un usuario con email {email}")

        user = User.objects.create(
            email=email,
            username=email.split("@")[0],
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        user.set_password(password)
        user.save()

        from sacad.apps.usuarios.models import Profile
        Profile.objects.create(
            user=user,
            approval_status=Profile.ApprovalStatus.APPROVED,
        )

        self.stdout.write(self.style.SUCCESS(f"Superadmin {email} creado correctamente"))

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from sacad.apps.academica.models import (
    Facultad,
    Sede,
    Carrera,
    TituloIntermedio,
    PlanEstudio,
    TipoMateria,
    Area,
    Materia,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seed base data for SACAD (FCE UNCuyo)"

    def handle(self, *args, **options):
        # ── Superuser ────────────────────────────────────────────────
        if not User.objects.filter(email="admin@sacad.edu").exists():
            u = User.objects.create_superuser(
                username="admin",
                email="admin@sacad.edu",
                password="admin123",
            )
            u.is_staff = True
            u.is_superuser = True
            u.save()
            self.stdout.write(self.style.SUCCESS("Superuser creado: admin/admin123"))
        else:
            self.stdout.write("Superuser ya existe, omitido.")

        # ── Facultad ─────────────────────────────────────────────────
        facultad, _ = Facultad.objects.get_or_create(
            codigo="03",
            defaults={
                "nombre_corto": "FCE",
                "nombre": "Facultad de Ciencias Económicas",
                "activa": True,
            },
        )
        self.stdout.write(f"Facultad: {facultad.nombre}")

        # ── Sedes ────────────────────────────────────────────────────
        sede_mza, _ = Sede.objects.get_or_create(
            facultad=facultad,
            codigo="MZA",
            defaults={
                "nombre": "Sede Central",
                "activa": True,
                "localidad": "Mendoza",
            },
        )
        self.stdout.write(f"Sede: {sede_mza.nombre} ({sede_mza.codigo})")

        sede_sr, _ = Sede.objects.get_or_create(
            facultad=facultad,
            codigo="DSR",
            defaults={
                "nombre": "Delegación San Rafael",
                "activa": True,
                "localidad": "San Rafael",
            },
        )
        self.stdout.write(f"Sede: {sede_sr.nombre} ({sede_sr.codigo})")

        # ── Carrera ──────────────────────────────────────────────────
        carrera, _ = Carrera.objects.get_or_create(
            facultad=facultad,
            codigo="450",
            defaults={
                "codigo_ministerial": "450",
                "nombre_corto": "CP",
                "nombre": "Contador Público",
                "duracion_anos": 4,
                "nivel": "grado",
                "modalidad": "presencial",
                "activa": True,
            },
        )
        carrera.sedes.add(sede_mza, sede_sr)
        self.stdout.write(f"Carrera: {carrera.nombre} ({carrera.nombre_corto})")

        # ── Título Intermedio ────────────────────────────────────────
        titulo, _ = TituloIntermedio.objects.get_or_create(
            nombre="Analista Universitario/a Contable",
            defaults={"duracion_anos": 2},
        )
        self.stdout.write(f"Título intermedio: {titulo.nombre}")

        # ── Plan de Estudio ──────────────────────────────────────────
        plan, _ = PlanEstudio.objects.get_or_create(
            carrera=carrera,
            codigo="2026",
            defaults={
                "version": "1",
                "titulo_otorga": "Contador Público",
                "duracion_anos": 4,
                "año_inicio_implementacion": 2026,
                "vigente": True,
            },
        )
        plan.titulos_intermedios.add(titulo)
        self.stdout.write(f"Plan: {plan.codigo} ({carrera.nombre_corto})")

        # ── Tipo de Materia ──────────────────────────────────────────
        tipo_oblig, _ = TipoMateria.objects.get_or_create(
            nombre="obligatoria", defaults={"activo": True}
        )
        self.stdout.write(f"Tipo materia: {tipo_oblig.nombre}")

        # ── Áreas ────────────────────────────────────────────────────
        areas_data = [
            "Jurídica",
            "Contabilidad e Impuestos",
            "Administración, Tecnología de la Información y Economía",
            "Matemática",
            "Actividades de Integración y Práctica Laboral",
            "Humanística",
        ]
        areas = []
        for i, nombre in enumerate(areas_data):
            a, _ = Area.objects.get_or_create(
                plan_estudio=plan,
                nombre=nombre,
                defaults={"orden": i},
            )
            areas.append(a)
            self.stdout.write(f"  Área: {a.nombre}")

        # ── Materias ─────────────────────────────────────────────────
        materias_data = [
            {
                "codigo": "510201",
                "nombre": "DERECHO PÚBLICO",
                "año": 1,
                "cuatrimestre": "1",
                "creditos": 6,
                "periodo": "B1",
                "carga_horaria_semanal": 5,
                "carga_horaria_total": 70,
            },
        ]
        for m in materias_data:
            materia, created = Materia.objects.get_or_create(
                plan_estudio=plan,
                codigo=m["codigo"],
                defaults={
                    "nombre": m["nombre"],
                    "año": m["año"],
                    "cuatrimestre": m["cuatrimestre"],
                    "creditos": m["creditos"],
                    "periodo": m["periodo"],
                    "carga_horaria_semanal": m["carga_horaria_semanal"],
                    "carga_horaria_total": m["carga_horaria_total"],
                    "tipo": tipo_oblig,
                },
            )
            label = "creada" if created else "ya existe"
            self.stdout.write(f"  Materia {label}: {materia.codigo} - {materia.nombre}")

        total_materias = Materia.objects.filter(plan_estudio=plan).count()
        self.stdout.write(self.style.SUCCESS(
            f"\nSeed completado — {total_materias} materia(s), {len(areas)} área(s)"
        ))

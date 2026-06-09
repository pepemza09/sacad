from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from sacad.apps.academica.models import (
    Facultad, Sede, Carrera, PlanEstudio, Materia, TipoMateria
)

User = get_user_model()

MATERIAS = [
    # (codigo, nombre, año, cuatrimestre, periodo, hs_sem, hs_tot, tipo_nombre, contenidos)
    ("101", "Introducción a la Administración", 1, "1", "1C", 4, 64, "obligatoria", "Conceptos básicos de administración. Evolución del pensamiento administrativo. Proceso administrativo."),
    ("102", "Matemática I", 1, "1", "1C", 6, 96, "obligatoria", "Conjuntos numéricos. Ecuaciones e inecuaciones. Funciones. Límites y continuidad."),
    ("103", "Contabilidad I", 1, "2", "2C", 5, 80, "obligatoria", "Principios contables. Registración contable. Estados contables básicos."),
    ("104", "Principios de Economía", 1, "2", "2C", 4, 64, "obligatoria", "Microeconomía y macroeconomía. Oferta y demanda. Mercados."),
    ("201", "Administración I", 2, "1", "1C", 4, 64, "obligatoria", "Planeación, organización, dirección y control. Estructuras organizacionales."),
    ("202", "Microeconomía", 2, "1", "1C", 4, 64, "obligatoria", "Teoría del consumidor. Teoría de la firma. Estructuras de mercado."),
    ("203", "Estadística", 2, "1", "1C", 5, 80, "obligatoria", "Estadística descriptiva. Probabilidad. Distribuciones. Inferencia estadística."),
    ("204", "Derecho Comercial", 2, "2", "2C", 3, 48, "obligatoria", "Derecho societario. Contratos comerciales. Títulos de crédito."),
    ("301", "Administración II", 3, "1", "1C", 4, 64, "obligatoria", "Gestión estratégica. Análisis FODA. Ventaja competitiva."),
    ("302", "Marketing", 3, "1", "1C", 4, 64, "obligatoria", "Mix de marketing. Segmentación. Posicionamiento. Investigación de mercados."),
    ("303", "Inglés Técnico", 3, "2", "2C", 3, 48, "optativa", "Comprensión lectora de textos técnicos. Vocabulario específico de administración."),
    ("304", "Sistemas de Información", 3, "2", "2C", 4, 64, "obligatoria", "Sistemas de información gerencial. ERP. Toma de decisiones basada en datos."),
    ("401", "Finanzas", 4, "1", "1C", 5, 80, "obligatoria", "Matemática financiera. Evaluación de proyectos. Presupuesto de capital."),
    ("402", "Gestión de RRHH", 4, "1", "1C", 4, 64, "obligatoria", "Reclutamiento y selección. Capacitación. Evaluación de desempeño."),
    ("403", "Comercio Internacional", 4, "2", "2C", 3, 48, "optativa", "Exportaciones e importaciones. Incoterms. Mercados internacionales."),
    ("404", "Electiva I", 4, "anual", "Anual", 3, 96, "electiva", "Contenidos a definir según oferta académica."),
    ("501", "Planeamiento Estratégico", 5, "1", "1C", 4, 64, "obligatoria", "Formulación e implementación de estrategias. Tablero de comando."),
    ("502", "Metodología de la Investigación", 5, "1", "1C", 3, 48, "obligatoria", "Métodos cuantitativos y cualitativos. Diseño de investigación. Tesis."),
    ("503", "Práctica Profesional", 5, "2", "2C", 6, 96, "obligatoria", "Práctica laboral en empresas conveniadas. Informe final."),
    ("504", "Electiva II", 5, "2", "2C", 3, 48, "electiva", "Contenidos a definir según oferta académica."),
]


class Command(BaseCommand):
    help = "Puebla la base de datos con datos demo (facultad, carrera, plan, materias)"

    def handle(self, *args, **options):
        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            self.stdout.write(self.style.ERROR("No hay admin. Ejecutá crear_admin primero."))
            return

        facultad, _ = Facultad.objects.get_or_create(
            codigo="FCE",
            defaults={
                "nombre_corto": "FCE",
                "nombre": "Facultad de Ciencias Económicas",
                "decano": admin,
                "activa": True,
            },
        )
        self.stdout.write(f"Facultad: {facultad.nombre}")

        sede, _ = Sede.objects.get_or_create(
            facultad=facultad,
            codigo="CBA",
            defaults={
                "nombre": "Córdoba",
                "activa": True,
                "direccion": "Av. Colón 1234",
                "localidad": "Córdoba",
            },
        )
        self.stdout.write(f"Sede: {sede.nombre}")

        carrera, _ = Carrera.objects.get_or_create(
            facultad=facultad,
            codigo="LA",
            defaults={
                "codigo_ministerial": "123456",
                "nombre_corto": "Lic. Administración",
                "nombre": "Licenciatura en Administración",
                "titulo_otorga": "Licenciado/a en Administración",
                "duracion_anos": 5,
                "nivel": "grado",
                "modalidad": "presencial",
                "director": admin,
                "activa": True,
            },
        )
        carrera.sedes.add(sede)
        self.stdout.write(f"Carrera: {carrera.nombre}")

        plan, _ = PlanEstudio.objects.get_or_create(
            carrera=carrera,
            codigo="2024",
            defaults={
                "version": "1",
                "titulo_otorga": "Licenciado/a en Administración",
                "duracion_anos": 5,
                "año_inicio_implementacion": 2024,
                "vigente": True,
            },
        )
        self.stdout.write(f"Plan: {plan.codigo}")

        created_count = 0
        for codigo, nombre, año, cuatrimestre, periodo, hs_sem, hs_tot, tipo_nombre, contenidos in MATERIAS:
            tipo = TipoMateria.objects.filter(nombre=tipo_nombre).first()
            if not tipo:
                self.stdout.write(self.style.WARNING(f"Tipo '{tipo_nombre}' no encontrado, se saltea {codigo}"))
                continue
            _, was_created = Materia.objects.get_or_create(
                plan_estudio=plan,
                codigo=codigo,
                defaults={
                    "nombre": nombre,
                    "año": año,
                    "cuatrimestre": cuatrimestre,
                    "periodo": periodo,
                    "carga_horaria_semanal": hs_sem,
                    "carga_horaria_total": hs_tot,
                    "tipo": tipo,
                    "contenidos_minimos": contenidos,
                },
            )
            if was_created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Materias creadas: {created_count}"))

        if Materia.objects.filter(plan_estudio=plan).count() == len(MATERIAS):
            self.stdout.write(self.style.SUCCESS("Datos demo cargados correctamente"))
        else:
            self.stdout.write(self.style.WARNING("Algunas materias ya existían o faltan"))

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from sacad.apps.academica.models import (
    Facultad, Sede, Carrera, PlanEstudio, Materia, TipoMateria
)

User = get_user_model()

# (codigo, nombre, año, cuatrimestre, horas_ip, creditos, tipo_nombre)
LA_MATERIAS = [
    # 1er año
    ("510301", "Sistemas Integrados de Información", 1, "1", 75, 10, "obligatoria"),
    ("510302", "Principios y Aplicaciones de Administración", 1, "1", 75, 10, "obligatoria"),
    ("510303", "Principios de Micro y Macroeconomía", 1, "1", 75, 9, "obligatoria"),
    ("510304", "Matemática Aplicada a la Administración", 1, "2", 75, 10, "obligatoria"),
    ("510305", "Derecho Privado", 1, "2", 60, 7, "obligatoria"),
    ("510306", "Fundamentos de Marketing", 1, "2", 60, 7, "obligatoria"),
    ("510307", "Administración de Personas", 1, "2", 60, 7, "obligatoria"),
    # 2do año
    ("520301", "Administración: Estructuras y Estrategias", 2, "1", 75, 7, "obligatoria"),
    ("520302", "Costos para Decisiones", 2, "1", 60, 6, "obligatoria"),
    ("520303", "Estadística Aplicada a la Administración", 2, "1", 75, 8, "obligatoria"),
    ("520304", "Derecho Constitucional y Administrativo", 2, "1", 60, 6, "obligatoria"),
    ("520305", "Administración Financiera I", 2, "2", 60, 7, "obligatoria"),
    ("520306", "Administración de Operaciones", 2, "2", 60, 7, "obligatoria"),
    ("520307", "Régimen Impositivo", 2, "2", 60, 7, "obligatoria"),
    ("520308", "Matemática Financiera", 2, "2", 90, 8, "obligatoria"),
    ("520309", "Práctica Laboral", 2, "2", 80, 4, "obligatoria"),
    # 3er año
    ("530301", "Investigación de Mercados", 3, "1", 60, 7, "obligatoria"),
    ("530302", "Macroeconomía", 3, "1", 60, 7, "obligatoria"),
    ("530303", "Derecho Laboral para Administración de Personas", 3, "1", 60, 8, "obligatoria"),
    ("530304", "Administración del Sector Público", 3, "1", 75, 9, "obligatoria"),
    ("530305", "Diseño y Gestión de Organizaciones", 3, "2", 75, 9, "obligatoria"),
    ("530306", "Marketing Estratégico", 3, "2", 60, 7, "obligatoria"),
    ("530307", "Comportamiento Humano en las Organizaciones", 3, "2", 60, 7, "obligatoria"),
    # 4to año
    ("540301", "Administración Financiera II", 4, "1", 75, 10, "obligatoria"),
    ("540302", "Trabajo Final Integrador", 4, "1", 60, 10, "obligatoria"),
    ("540303", "Inteligencia Estratégica y Creación de Valor", 4, "1", 75, 9, "obligatoria"),
    ("540304", "Administración Estratégica", 4, "2", 75, 10, "obligatoria"),
    ("540305", "Práctica Profesional", 4, "2", 85, 9, "obligatoria"),
]

LA_OPTATIVAS = [
    ("570301", "Inversiones Financieras", 3, 60, 6, "optativa"),
    ("570302", "Administración de Entidades Financieras", 3, 60, 6, "optativa"),
    ("570303", "Administración de Proyectos", 3, 60, 6, "optativa"),
    ("570304", "Negociación", 3, 60, 6, "optativa"),
    ("570305", "Ética y Negocios", 3, 60, 6, "optativa"),
    ("570306", "Comunicación Publicitaria", 3, 60, 6, "optativa"),
    ("570307", "Marketing Digital", 3, 60, 6, "optativa"),
    ("570308", "Operatoria de Comercio Exterior", 3, 60, 6, "optativa"),
    ("570309", "Administración de Capacitación y Compensaciones", 3, 60, 6, "optativa"),
    ("570310", "Administración del Cambio", 3, 60, 6, "optativa"),
    ("570311", "Administración de Remuneraciones: Casuística", 3, 60, 6, "optativa"),
    ("570312", "Gestión de la Calidad", 3, 60, 6, "optativa"),
    ("570313", "Filosofía Política y Social para Administradores", 3, 60, 6, "optativa"),
    ("570314", "Finanzas del Sector Público", 3, 60, 6, "optativa"),
    ("570315", "Administración de la Salud", 3, 60, 6, "optativa"),
    ("570316", "Empresas de Impacto", 3, 60, 6, "optativa"),
    ("570317", "Medición de Impacto", 3, 60, 6, "optativa"),
    ("570318", "Normativa y Desarrollo de Ecosistemas de Impacto", 3, 60, 6, "optativa"),
    ("570319", "Administración Estratégica de Operaciones", 3, 60, 6, "optativa"),
    ("570320", "Investigación Operativa", 3, 60, 6, "optativa"),
    ("570321", "Derecho Concursal para Administradores", 3, 60, 6, "optativa"),
]

CP_MATERIAS = [
    # 1er año
    ("510201", "Derecho Público", 1, "1", 60, 6, "obligatoria"),
    ("510202", "Principios y Aplicaciones de Administración", 1, "1", 75, 10, "obligatoria"),
    ("510203", "Introducción a la Economía", 1, "1", 60, 8, "obligatoria"),
    ("510204", "Comportamiento Organizacional", 1, "1", 60, 6, "obligatoria"),
    ("510205", "Algebra Lineal", 1, "2", 60, 7, "obligatoria"),
    ("510206", "Cálculo", 1, "2", 75, 9, "obligatoria"),
    ("510207", "Fundamentos de Contabilidad", 1, "2", 75, 10, "obligatoria"),
    # 2do año
    ("520201", "Contabilidad Intermedia", 2, "1", 75, 9, "obligatoria"),
    ("520202", "Sistemas y Tecnologías de Información", 2, "1", 60, 8, "obligatoria"),
    ("520203", "Estadística", 2, "1", 60, 8, "obligatoria"),
    ("520204", "Filosofía y Ética", 2, "1", 60, 5, "obligatoria"),
    ("520205", "Derecho Civil y Comercial", 2, "2", 60, 8, "obligatoria"),
    ("520206", "Contabilidad de Costos", 2, "2", 60, 8, "obligatoria"),
    ("520207", "Macroeconomía", 2, "2", 70, 6, "obligatoria"),
    ("520208", "Matemática Financiera", 2, "2", 60, 8, "obligatoria"),
    ("520209", "Práctica Laboral I", 2, "2", 80, 6, "obligatoria"),
    # 3er año
    ("530201", "Contabilidad Superior", 3, "1", 75, 10, "obligatoria"),
    ("530202", "Sistemas y Tecnologías de Información II", 3, "1", 60, 4, "obligatoria"),
    ("530203", "Derecho Societario", 3, "1", 60, 6, "obligatoria"),
    ("530204", "Costos para la Gestión", 3, "2", 70, 9, "obligatoria"),
    ("530205", "Teoría y Técnica Impositiva I", 3, "2", 75, 9, "obligatoria"),
    ("530206", "Contabilidad Avanzada", 3, "2", 60, 9, "obligatoria"),
    ("530207", "Práctica Laboral II", 3, "2", 80, 5, "obligatoria"),
    # 4to año
    ("540201", "Teoría y Técnica Impositiva II", 4, "1", 60, 8, "obligatoria"),
    ("540202", "Control Estratégico y Gestión Financiera", 4, "1", 75, 7, "obligatoria"),
    ("540203", "Auditoría", 4, "1", 75, 10, "obligatoria"),
    ("540204", "Derecho Concursal", 4, "1", 60, 5, "obligatoria"),
    ("540205", "Administración Financiera del Sector Público", 4, "2", 75, 9, "obligatoria"),
    ("540206", "Práctica Profesional", 4, "2", 85, 10, "obligatoria"),
]

CP_OPTATIVAS = [
    ("580201", "Administración de Proyectos", 3, 60, 6, "optativa"),
    ("580202", "Negociación", 3, 60, 6, "optativa"),
    ("580203", "Gestión de la Calidad", 3, 60, 6, "optativa"),
    ("580204", "Investigación Operativa", 3, 60, 6, "optativa"),
    ("580205", "Administración de Entidades Financieras", 3, 60, 6, "optativa"),
    ("580206", "Finanzas del Sector Público", 3, 60, 6, "optativa"),
    ("580207", "Empresas de Impacto", 3, 60, 6, "optativa"),
    ("580208", "Medición de Impacto", 3, 60, 6, "optativa"),
    ("580209", "Ética y Negocios", 3, 60, 6, "optativa"),
    ("580210", "Comunicación Publicitaria", 3, 60, 6, "optativa"),
    ("580211", "Marketing Digital", 3, 60, 6, "optativa"),
    ("580212", "Operatoria de Comercio Exterior", 3, 60, 6, "optativa"),
    ("580213", "Administración del Cambio", 3, 60, 6, "optativa"),
    ("580214", "Administración de Capacitación y Compensaciones", 3, 60, 6, "optativa"),
    ("580215", "Administración de la Salud", 3, 60, 6, "optativa"),
    ("580216", "Administración de Remuneraciones: Casuística", 3, 60, 6, "optativa"),
]

LE_MATERIAS = [
    # 1er año
    ("510401", "Fundamentos de Economía", 1, "1", 70, 8, "obligatoria"),
    ("510402", "Matemática I", 1, "1", 70, 8, "obligatoria"),
    ("510403", "Sistemas Integrados de Información", 1, "1", 56, 6, "obligatoria"),
    ("510404", "Introducción a la Economía", 1, "2", 70, 8, "obligatoria"),
    ("510405", "Algebra Lineal", 1, "2", 84, 8, "obligatoria"),
    # 2do año
    ("520401", "Microeconomía I", 2, "1", 60, 6, "obligatoria"),
    ("520402", "Matemática Financiera", 2, "1", 60, 8, "obligatoria"),
    ("520403", "Estadística I", 2, "1", 60, 8, "obligatoria"),
    ("520404", "Macroeconomía", 2, "1", 60, 8, "obligatoria"),
    ("520405", "Finanzas y Mercado de Capitales", 2, "2", 60, 8, "obligatoria"),
    ("520406", "Microeconomía II", 2, "2", 75, 8, "obligatoria"),
    ("520407", "Estadística II", 2, "2", 75, 7, "obligatoria"),
    ("520408", "Taller de Aplicación I", 2, "2", 56, 6, "obligatoria"),
    # 3er año
    ("530401", "Pensamiento Económico Mundial", 3, "1", 60, 8, "obligatoria"),
    ("530402", "Econometría I", 3, "1", 84, 9, "obligatoria"),
    ("530403", "Microeconomía III", 3, "1", 60, 8, "obligatoria"),
    ("530404", "Análisis y Proyección de Estados Contables", 3, "1", 60, 6, "obligatoria"),
    ("530405", "Finanzas Públicas", 3, "2", 60, 8, "obligatoria"),
    ("530406", "Análisis Económico de Proyectos", 3, "2", 60, 8, "obligatoria"),
    ("530407", "Economía Monetaria", 3, "2", 60, 8, "obligatoria"),
    # 4to año
    ("540401", "Economía Internacional", 4, "1", 70, 8, "obligatoria"),
    ("540402", "Desarrollo Económico", 4, "1", 60, 8, "obligatoria"),
    ("540403", "Econometría II", 4, "1", 70, 8, "obligatoria"),
    ("540404", "Política Económica Argentina", 4, "2", 70, 8, "obligatoria"),
    ("540405", "Organización Industrial", 4, "2", 60, 7, "obligatoria"),
    ("540406", "Taller de Aplicación II", 4, "2", 56, 6, "obligatoria"),
]

LE_OPTATIVAS = [
    ("570401", "Historia Económica Mundial", 3, 60, 6, "optativa"),
    ("570402", "Economía Ambiental", 3, 60, 6, "optativa"),
    ("570403", "Economía de las Políticas Sociales", 3, 60, 6, "optativa"),
    ("570404", "Economía Internacional Monetaria", 3, 60, 6, "optativa"),
    ("570405", "Economía y Desarrollo Productivo", 3, 60, 6, "optativa"),
    ("570406", "Economía Matemática", 3, 60, 6, "optativa"),
    ("570407", "Economía Regional", 3, 56, 6, "optativa"),
    ("570408", "Filosofía Política y Social para Economistas", 3, 56, 6, "optativa"),
    ("570409", "Historia Económica Mundial", 3, 60, 6, "optativa"),
    ("570410", "Tópicos Avanzados de Evaluación Socioeconómica de Proyectos", 3, 60, 6, "optativa"),
]

CARRERAS = [
    {
        "codigo": "LA",
        "codigo_ministerial": "LA-2026",
        "nombre_corto": "Lic. Administración",
        "nombre": "Licenciatura en Administración",
        "titulo_otorga": "Licenciado/a en Administración",
        "duracion_anos": 4,
        "plan_codigo": "2026",
        "plan_version": "1",
        "materias": LA_MATERIAS,
        "optativas": LA_OPTATIVAS,
    },
    {
        "codigo": "CP",
        "codigo_ministerial": "CP-2026",
        "nombre_corto": "Contador Público",
        "nombre": "Contador Público",
        "titulo_otorga": "Contador/a Público/a",
        "duracion_anos": 4,
        "plan_codigo": "2026",
        "plan_version": "1",
        "materias": CP_MATERIAS,
        "optativas": CP_OPTATIVAS,
    },
    {
        "codigo": "LE",
        "codigo_ministerial": "LE-2026",
        "nombre_corto": "Lic. Economía",
        "nombre": "Licenciatura en Economía",
        "titulo_otorga": "Licenciado/a en Economía",
        "duracion_anos": 4,
        "plan_codigo": "2026",
        "plan_version": "1",
        "materias": LE_MATERIAS,
        "optativas": LE_OPTATIVAS,
    },
]


class Command(BaseCommand):
    help = "Carga los Planes de Estudio 2026 desde los documentos oficiales"

    def handle(self, *args, **options):
        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            self.stdout.write(self.style.ERROR("No hay admin. Ejecutá crear_admin primero."))
            return

        facultad = Facultad.objects.filter(codigo="FCE").first()
        if not facultad:
            self.stdout.write(self.style.ERROR("No existe la facultad FCE. Ejecutá poblar_demo primero."))
            return

        sede = Sede.objects.filter(facultad=facultad, codigo="CBA").first()
        if not sede:
            self.stdout.write(self.style.ERROR("No existe la sede CBA. Ejecutá poblar_demo primero."))
            return

        total_creadas = 0
        total_optativas = 0

        for c in CARRERAS:
            carrera, created = Carrera.objects.get_or_create(
                facultad=facultad,
                codigo=c["codigo"],
                defaults={
                    "codigo_ministerial": c["codigo_ministerial"],
                    "nombre_corto": c["nombre_corto"],
                    "nombre": c["nombre"],
                    "titulo_otorga": c["titulo_otorga"],
                    "duracion_anos": c["duracion_anos"],
                    "nivel": "grado",
                    "modalidad": "presencial",
                    "director": admin,
                    "activa": True,
                },
            )
            carrera.sedes.add(sede)
            self.stdout.write(f"{'Creada' if created else 'Actualizada'}: {carrera.nombre} ({carrera.codigo})")

            plan, _ = PlanEstudio.objects.get_or_create(
                carrera=carrera,
                codigo=c["plan_codigo"],
                defaults={
                    "version": c["plan_version"],
                    "titulo_otorga": c["titulo_otorga"],
                    "duracion_anos": c["duracion_anos"],
                    "año_inicio_implementacion": 2026,
                    "vigente": True,
                },
            )
            self.stdout.write(f"  Plan: {plan.codigo}")

            for m in c["materias"]:
                codigo, nombre, año, cuatri, hs_ip, creditos, tipo_nombre = m
                tipo = TipoMateria.objects.filter(nombre=tipo_nombre).first()
                if not tipo:
                    self.stdout.write(self.style.WARNING(f"    Tipo '{tipo_nombre}' no encontrado"))
                    continue
                _, created = Materia.objects.update_or_create(
                    plan_estudio=plan,
                    codigo=codigo,
                    defaults={
                        "nombre": nombre,
                        "año": año,
                        "cuatrimestre": cuatri,
                        "periodo": "1C" if cuatri == "1" else "2C" if cuatri == "2" else "Anual",
                        "carga_horaria_semanal": hs_ip // 15 if hs_ip else 4,
                        "carga_horaria_total": hs_ip,
                        "tipo": tipo,
                        "contenidos_minimos": "",
                    },
                )
                if created:
                    total_creadas += 1

            self.stdout.write(f"  Materias obligatorias: {len(c['materias'])}")

            for m in c["optativas"]:
                codigo, nombre, año, hs_ip, creditos, tipo_nombre = m
                tipo = TipoMateria.objects.filter(nombre=tipo_nombre).first()
                if not tipo:
                    continue
                _, created = Materia.objects.update_or_create(
                    plan_estudio=plan,
                    codigo=codigo,
                    defaults={
                        "nombre": nombre,
                        "año": año,
                        "cuatrimestre": "2",
                        "periodo": "2C",
                        "carga_horaria_semanal": hs_ip // 15 if hs_ip else 4,
                        "carga_horaria_total": hs_ip,
                        "tipo": tipo,
                        "contenidos_minimos": "",
                    },
                )
                if created:
                    total_optativas += 1

            self.stdout.write(f"  Optativas/Electivas: {len(c['optativas'])}")

        self.stdout.write(self.style.SUCCESS(
            f"Total materias creadas: {total_creadas}, optativas: {total_optativas}"
        ))

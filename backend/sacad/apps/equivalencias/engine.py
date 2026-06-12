from .models import Equivalencia
from sacad.apps.academica.models import Materia


class EquivalenciasEngine:
    """
    Motor de resolución de equivalencias en cascada.

    Soporta equivalencias 1:1, 1:N, N:1 y N:N entre diferentes planes/carreras.
    La cascada funciona como BFS: cada materia destino adquirida se convierte
    en nuevo origen para la siguiente iteración, hasta alcanzar el plan destino.

    Ejemplo:
      Eq1: {M1 (PlanA)} → {M2 + M3 (PlanB)}   plan_destino=PlanB
      Eq2: {M2 (PlanB)} → {M4 (PlanC)}          plan_destino=PlanC

    Consultando origen=[M1], plan_destino=PlanC:
      1. M1 → M2+M3 (PlanB)  →  M2 se agrega a taken
      2. M2 → M4 (PlanC)     →  M4 es resultado final
    """

    def __init__(self, materias_origen_ids=None, plan_destino_id=None):
        self.materias_origen_ids = list(materias_origen_ids or [])
        self.plan_destino_id = plan_destino_id

    def resolver(self, max_depth=10):
        """
        BFS traversal del grafo de equivalencias.

        Retorna lista de dicts con las materias destino encontradas
        en el plan solicitado.
        """
        taken_ids = set(self.materias_origen_ids)
        result_details = []
        seen_eq_ids = set()

        all_equivalencias = list(
            Equivalencia.objects.filter(activa=True)
            .select_related("plan_destino")
            .prefetch_related("materias_origen", "materias_destino")
        )

        eq_origen_cache = {}
        for eq in all_equivalencias:
            eq_origen_cache[eq.id] = set(
                eq.materias_origen.values_list("id", flat=True)
            )

        for depth in range(max_depth):
            found_new = False

            for eq in all_equivalencias:
                if eq.id in seen_eq_ids:
                    continue

                if eq_origen_cache[eq.id].issubset(taken_ids):
                    seen_eq_ids.add(eq.id)
                    found_new = True

                    for dest in eq.materias_destino.all():
                        if dest.id in taken_ids:
                            continue

                        taken_ids.add(dest.id)

                        if eq.plan_destino_id == self.plan_destino_id:
                            result_details.append({
                                "materia_destino_id": dest.id,
                                "materia_destino_codigo": dest.codigo,
                                "materia_destino_nombre": dest.nombre,
                                "tipo": eq.tipo,
                                "porcentaje": eq.porcentaje,
                                "resolucion": eq.resolucion,
                                "cascada": depth > 0,
                            })

            if not found_new:
                break

        return result_details

    @staticmethod
    def validar_sin_ciclos(materias_origen_ids, materias_destino_ids):
        """Valida que no existan ciclos A→B y B→A."""
        for oid in materias_origen_ids:
            for did in materias_destino_ids:
                ciclo_inverso = Equivalencia.objects.filter(
                    materias_origen__id=did,
                    materias_destino__id=oid,
                    activa=True,
                )
                if ciclo_inverso.exists():
                    return False, (
                        f"Equivalencia cíclica entre las materias {oid} y {did}."
                    )
        return True, None

    @staticmethod
    def validar_mismo_plan(materias_origen_ids, materias_destino_ids):
        """
        Valida que no todas las materias pertenezcan al mismo plan de estudio.
        """
        all_ids = list(materias_origen_ids) + list(materias_destino_ids)
        if not all_ids:
            return True, None

        planes = set(
            Materia.objects.filter(id__in=all_ids)
            .values_list("plan_estudio_id", flat=True)
            .distinct()
        )
        if len(planes) == 1:
            return False, (
                "No pueden existir equivalencias entre materias del mismo plan."
            )
        return True, None

    @staticmethod
    def get_stats_plan(plan_id):
        """Obtiene estadísticas de equivalencias para un plan."""
        origen_count = Equivalencia.objects.filter(
            materias_origen__plan_estudio__id=plan_id
        ).count()
        destino_count = Equivalencia.objects.filter(
            plan_destino__id=plan_id
        ).count()
        return {
            "plan_id": plan_id,
            "equivalencias_como_origen": origen_count,
            "equivalencias_como_destino": destino_count,
        }

from .models import Equivalencia


class EquivalenciasEngine:
    """
    Motor de resolución de equivalencias.
    Soporta cadenas 1:N, N:1, N:M y cascada:
    Si A = B+C y B = D, entonces A = D+C al consultar.
    """

    def __init__(self, materia_origen_id=None, plan_destino_id=None):
        self.materia_origen_id = materia_origen_id
        self.plan_destino_id = plan_destino_id

    def resolver_directas(self):
        equivalencias = Equivalencia.objects.filter(
            materias_origen__id=self.materia_origen_id,
            plan_destino__id=self.plan_destino_id,
            activa=True,
        ).prefetch_related("materias_destino")

        result = []
        for eq in equivalencias:
            for dest in eq.materias_destino.all():
                result.append(
                    {
                        "materia_destino_id": dest.id,
                        "materia_destino_codigo": dest.codigo,
                        "materia_destino_nombre": dest.nombre,
                        "tipo": eq.tipo,
                        "porcentaje": eq.porcentaje,
                        "resolucion": eq.resolucion,
                    }
                )
        return result

    def resolver_en_cascada(self):
        """
        Resuelve equivalencias en cascada:
        Si MateriaA (plan1) = MateriaB + MateriaC (plan2),
        y MateriaB (plan2) = MateriaD (plan3),
        entonces MateriaA (plan1) = MateriaD + MateriaC (plan3).
        """
        resultados = self.resolver_directas()
        ids_encontrados = set()
        nuevos_ids = set()

        for r in resultados:
            nuevos_ids.add(r["materia_destino_id"])

        while nuevos_ids:
             nuevos_ids.difference_update(ids_encontrados)
             if not nuevos_ids:
                 break
             ids_encontrados.update(nuevos_ids)
             batch = set(nuevos_ids)
             nuevos_ids = set()

             for mid in batch:
                 equivalencias_cascada = Equivalencia.objects.filter(
                     materias_origen__id=mid,
                     plan_destino__id=self.plan_destino_id,
                     activa=True,
                 ).prefetch_related("materias_destino")

                 for eq in equivalencias_cascada:
                     for dest in eq.materias_destino.all():
                         if dest.id not in ids_encontrados:
                             nuevos_ids.add(dest.id)
                             resultados.append(
                                 {
                                     "materia_destino_id": dest.id,
                                     "materia_destino_codigo": dest.codigo,
                                     "materia_destino_nombre": dest.nombre,
                                     "tipo": eq.tipo,
                                     "porcentaje": eq.porcentaje,
                                     "resolucion": eq.resolucion,
                                     "cascada": True,
                                 }
                             )

        return resultados

    @staticmethod
    def validar_sin_ciclos(materias_origen_ids, materias_destino_ids):
        """Valida que no existan ciclos A->B y B->A."""
        for oid in materias_origen_ids:
            for did in materias_destino_ids:
                ciclo_inverso = Equivalencia.objects.filter(
                    materias_origen__id=did,
                    materias_destino__id=oid,
                    activa=True,
                )
                if ciclo_inverso.exists():
                    return False, f"Equivalencia cíclica detectada entre materia {oid} y {did}"
        return True, None

    @staticmethod
    def get_stats_plan(plan_id):
        """Obtiene estadísticas de equivalencias para un plan."""
        origen_count = Equivalencia.objects.filter(materias_origen__plan_estudio__id=plan_id).count()
        destino_count = Equivalencia.objects.filter(plan_destino__id=plan_id).count()
        return {
            "plan_id": plan_id,
            "equivalencias_como_origen": origen_count,
            "equivalencias_como_destino": destino_count,
        }

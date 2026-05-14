from rest_framework import permissions


class EsAdminUniversidad(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or request.user.groups.filter(name="Admin Universidad").exists()
        )


class EsSecretarioAcademico(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser
            or request.user.groups.filter(name__in=["Admin Universidad", "Secretario Académico"]).exists()
        )


class EsDirectorCarrera(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser
            or request.user.groups.filter(
                name__in=["Admin Universidad", "Secretario Académico", "Director Carrera"]
            ).exists()
        )


class EsDocente(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class EsDeSuFacultad(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if hasattr(obj, "facultad"):
            return obj.facultad.decano == request.user
        if hasattr(obj, "carrera"):
            return obj.carrera.director == request.user
        return True

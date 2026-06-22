from rest_framework import permissions
from sacad.apps.usuarios.permissions import tiene_permiso_menu


class EsAdminUniversidad(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.method in permissions.SAFE_METHODS:
            return tiene_permiso_menu(request.user, "facultades", require_write=False)
        return tiene_permiso_menu(request.user, "facultades", require_write=True)


class EsSecretarioAcademico(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.method in permissions.SAFE_METHODS:
            return (
                tiene_permiso_menu(request.user, "facultades")
                or tiene_permiso_menu(request.user, "sedes")
                or tiene_permiso_menu(request.user, "carreras")
                or tiene_permiso_menu(request.user, "planes")
                or tiene_permiso_menu(request.user, "areas")
                or tiene_permiso_menu(request.user, "configuracion.tipos-materia")
            )
        return (
            tiene_permiso_menu(request.user, "sedes", require_write=True)
            or tiene_permiso_menu(request.user, "carreras", require_write=True)
            or tiene_permiso_menu(request.user, "planes", require_write=True)
            or tiene_permiso_menu(request.user, "areas", require_write=True)
            or tiene_permiso_menu(request.user, "configuracion.tipos-materia", require_write=True)
        )


class EsDirectorCarrera(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.method in permissions.SAFE_METHODS:
            return tiene_permiso_menu(request.user, "materias", require_write=False)
        return tiene_permiso_menu(request.user, "materias", require_write=True)


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

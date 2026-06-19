from rest_framework import permissions


def tiene_permiso_menu(user, menu_key, require_write=False):
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    from .models import GroupMenuPermission
    user_groups = user.groups.all()
    # Si los grupos del usuario no tienen NINGÚN permiso configurado,
    # el sistema está "sin configurar" para ese usuario → unrestricted
    if not GroupMenuPermission.objects.filter(group__in=user_groups).exists():
        return True
    field = "can_write" if require_write else "can_read"
    return GroupMenuPermission.objects.filter(
        group__in=user_groups,
        menu_key=menu_key,
        **{field: True},
    ).exists()


class TienePermisoLectura(permissions.BasePermission):
    menu_key = None

    def has_permission(self, request, view):
        if not self.menu_key:
            return True
        if request.method in permissions.SAFE_METHODS:
            return tiene_permiso_menu(request.user, self.menu_key, require_write=False)
        return tiene_permiso_menu(request.user, self.menu_key, require_write=True)

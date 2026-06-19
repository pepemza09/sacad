from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .permissions import tiene_permiso_menu
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.http import HttpResponseRedirect
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group
from .models import Profile, AllowedDomain, GroupMenuPermission
from .serializers import UserSerializer, ProfileSerializer, EmailTokenObtainSerializer, AllowedDomainSerializer, GroupMenuPermissionSerializer, GroupWithPermissionsSerializer

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_zoom(request):
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=request.user)
    zoom = request.data.get("zoom_level")
    if zoom is None:
        return Response({"error": "Indicá el nivel de zoom."}, status=status.HTTP_400_BAD_REQUEST)
    zoom = float(zoom)
    if zoom < 50 or zoom > 200:
        return Response({"error": "El zoom debe estar entre 50 y 200."}, status=status.HTTP_400_BAD_REQUEST)
    profile.zoom_level = zoom
    profile.save(update_fields=["zoom_level"])
    return Response({"zoom_level": zoom})


@api_view(["POST"])
@permission_classes([AllowAny])
def email_login(request):
    serializer = EmailTokenObtainSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    code = request.data.get("code")
    if not code:
        return Response(
            {"error": "Código de autorización requerido."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(
        {"message": "Usá /accounts/google/login/ para el flujo completo de OAuth."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception:
        pass
    return Response({"message": "Sesión cerrada"}, status=status.HTTP_200_OK)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_detail(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


def google_complete(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/signin")

    profile = Profile.objects.filter(user=request.user).first()
    if profile and profile.approval_status != Profile.ApprovalStatus.APPROVED:
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/auth/pending")

    refresh = RefreshToken.for_user(request.user)
    url = (
        f"{settings.FRONTEND_URL}/auth/callback"
        f"?access={str(refresh.access_token)}"
        f"&refresh={str(refresh)}"
    )
    return HttpResponseRedirect(url)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def users_list(request):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.usuarios")):
        return Response({"detail": "No tenés permiso para ver esta lista."}, status=status.HTTP_403_FORBIDDEN)

    status_filter = request.query_params.get("status")
    users_qs = User.objects.all().order_by("-date_joined")

    if status_filter in [s.value for s in Profile.ApprovalStatus]:
        user_ids = Profile.objects.filter(approval_status=status_filter).values("user_id")
        users_qs = users_qs.filter(id__in=user_ids)

    data = [
        {
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "date_joined": u.date_joined,
            "approval_status": getattr(u, "profile", None).approval_status if hasattr(u, "profile") and u.profile else None,
            "approved_at": getattr(u, "profile", None).approved_at if hasattr(u, "profile") and u.profile else None,
            "rejected_at": getattr(u, "profile", None).rejected_at if hasattr(u, "profile") and u.profile else None,
            "groups": list(u.groups.values_list("name", flat=True)),
            "is_superuser": u.is_superuser,
        }
        for u in users_qs
    ]
    return Response(data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def approve_user(request, user_id):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.usuarios", require_write=True)):
        return Response({"detail": "No tenés permiso para aprobar usuarios."}, status=status.HTTP_403_FORBIDDEN)
    user = get_object_or_404(User, id=user_id)
    profile, _ = Profile.objects.get_or_create(user=user)
    user.is_active = True
    if not user.groups.exists():
        role = Group.objects.filter(name="Director Carrera").first()
        if role:
            user.groups.add(role)
    user.save()
    profile.approval_status = Profile.ApprovalStatus.APPROVED
    profile.approved_at = timezone.now()
    profile.rejected_at = None
    profile.save()
    return Response({"detail": f"Usuario {user.email} aprobado."})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def reject_user(request, user_id):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.usuarios", require_write=True)):
        return Response({"detail": "No tenés permiso para rechazar usuarios."}, status=status.HTTP_403_FORBIDDEN)
    user = get_object_or_404(User, id=user_id)
    profile, _ = Profile.objects.get_or_create(user=user)
    user.is_active = False
    user.save()
    profile.approval_status = Profile.ApprovalStatus.REJECTED
    profile.rejected_at = timezone.now()
    profile.approved_at = None
    profile.save()
    return Response({"detail": f"Usuario {user.email} rechazado."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_users(request):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.usuarios")):
        return Response({"detail": "No tenés permiso para ver esta lista."}, status=status.HTTP_403_FORBIDDEN)
    users = User.objects.filter(is_active=False).values("id", "email", "first_name", "last_name", "date_joined")
    return Response(list(users))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def allowed_domains(request):
    require_write = request.method == "POST"
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.dominios", require_write=require_write)):
        return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        serializer = AllowedDomainSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    qs = AllowedDomain.objects.all()
    return Response(AllowedDomainSerializer(qs, many=True).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_allowed_domain(request, domain_id):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.dominios", require_write=True)):
        return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)
    domain = get_object_or_404(AllowedDomain, id=domain_id)
    domain.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def groups_list(request):
    require_write = request.method == "POST"
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.roles", require_write=require_write)):
        return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"detail": "El nombre del grupo es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)
        if Group.objects.filter(name=name).exists():
            return Response({"detail": "Ya existe un grupo con ese nombre."}, status=status.HTTP_409_CONFLICT)
        group = Group.objects.create(name=name)
        return Response({"id": group.id, "name": group.name}, status=status.HTTP_201_CREATED)

    groups = Group.objects.all().values("id", "name")
    return Response(list(groups))


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def rename_group(request):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.roles", require_write=True)):
        return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)
    group = get_object_or_404(Group, id=request.data.get("id"))
    name = request.data.get("name", "").strip()
    if not name:
        return Response({"detail": "El nombre es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)
    if Group.objects.filter(name=name).exclude(id=group.id).exists():
        return Response({"detail": "Ya existe un grupo con ese nombre."}, status=status.HTTP_409_CONFLICT)
    group.name = name
    group.save()
    return Response({"id": group.id, "name": group.name})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_group(request, group_id):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.roles", require_write=True)):
        return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)
    group = get_object_or_404(Group, id=group_id)
    group.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_user_groups(request, user_id):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.roles", require_write=True)):
        return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)
    target_user = get_object_or_404(User, id=user_id)
    group_names = request.data.get("groups", [])
    groups = Group.objects.filter(name__in=group_names)
    target_user.groups.set(groups)
    target_user.save()
    return Response({
        "detail": f"Roles de {target_user.email} actualizados.",
        "groups": list(target_user.groups.values_list("name", flat=True)),
    })


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def group_menu_permissions(request, group_id):
    require_write = request.method == "PUT"
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.roles", require_write=require_write)):
        return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)
    group = get_object_or_404(Group, id=group_id)

    if request.method == "PUT":
        GroupMenuPermission.objects.filter(group=group).delete()
        for item in request.data:
            GroupMenuPermission.objects.create(
                group=group,
                menu_key=item["menu_key"],
                can_read=item.get("can_read", False),
                can_write=item.get("can_write", False),
            )

    permissions = GroupMenuPermission.objects.filter(group=group)
    serializer = GroupMenuPermissionSerializer(permissions, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_menu_permissions(request):
    user_groups = request.user.groups.all()
    # Sin grupo asignado → configured=true con permissions={} → frontend no muestra nada
    if not user_groups:
        return Response({"permissions": {}, "configured": True})
    permissions = GroupMenuPermission.objects.filter(group__in=user_groups)
    result: dict[str, dict[str, bool]] = {}
    for p in permissions:
        if p.menu_key not in result:
            result[p.menu_key] = {"can_read": False, "can_write": False}
        result[p.menu_key]["can_read"] = result[p.menu_key]["can_read"] or p.can_read
        result[p.menu_key]["can_write"] = result[p.menu_key]["can_write"] or p.can_write
    user_configured = permissions.exists()
    return Response({"permissions": result, "configured": user_configured})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_groups_with_permissions(request):
    if not (request.user.is_staff or tiene_permiso_menu(request.user, "configuracion.roles")):
        return Response({"detail": "No tenés permiso."}, status=status.HTTP_403_FORBIDDEN)
    groups = Group.objects.all().prefetch_related("menu_permissions")
    serializer = GroupWithPermissionsSerializer(groups, many=True)
    return Response(serializer.data)

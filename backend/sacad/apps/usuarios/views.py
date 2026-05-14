from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.http import HttpResponseRedirect
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group
from .models import Profile, AllowedDomain
from .serializers import UserSerializer, ProfileSerializer, EmailTokenObtainSerializer, AllowedDomainSerializer

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
        return Response({"error": "zoom_level es requerido"}, status=status.HTTP_400_BAD_REQUEST)
    zoom = float(zoom)
    if zoom < 50 or zoom > 200:
        return Response({"error": "zoom_level debe estar entre 50 y 200"}, status=status.HTTP_400_BAD_REQUEST)
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
            {"error": "Código de autorización requerido"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(
        {"message": "Use /accounts/google/login/ para el flujo completo OAuth"},
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
    if not request.user.is_staff:
        return Response({"detail": "No tienes permiso para ver esta lista."}, status=status.HTTP_403_FORBIDDEN)

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
    if not request.user.is_staff:
        return Response({"detail": "No tienes permiso para aprobar usuarios."}, status=status.HTTP_403_FORBIDDEN)
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
    if not request.user.is_staff:
        return Response({"detail": "No tienes permiso para rechazar usuarios."}, status=status.HTTP_403_FORBIDDEN)
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
    if not request.user.is_staff:
        return Response({"detail": "No tienes permiso para ver esta lista."}, status=status.HTTP_403_FORBIDDEN)
    users = User.objects.filter(is_active=False).values("id", "email", "first_name", "last_name", "date_joined")
    return Response(list(users))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def allowed_domains(request):
    if not request.user.is_staff:
        return Response({"detail": "No tienes permiso."}, status=status.HTTP_403_FORBIDDEN)

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
    if not request.user.is_staff:
        return Response({"detail": "No tienes permiso."}, status=status.HTTP_403_FORBIDDEN)
    domain = get_object_or_404(AllowedDomain, id=domain_id)
    domain.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def groups_list(request):
    if not request.user.is_staff:
        return Response({"detail": "No tienes permiso."}, status=status.HTTP_403_FORBIDDEN)
    groups = Group.objects.all().values("id", "name")
    return Response(list(groups))


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_user_groups(request, user_id):
    if not request.user.is_staff:
        return Response({"detail": "No tienes permiso."}, status=status.HTTP_403_FORBIDDEN)
    target_user = get_object_or_404(User, id=user_id)
    group_names = request.data.get("groups", [])
    groups = Group.objects.filter(name__in=group_names)
    target_user.groups.set(groups)
    target_user.save()
    return Response({
        "detail": f"Roles de {target_user.email} actualizados.",
        "groups": list(target_user.groups.values_list("name", flat=True)),
    })

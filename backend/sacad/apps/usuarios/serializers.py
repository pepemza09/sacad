from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from .models import Profile, AllowedDomain

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    foto = serializers.ImageField(source="profile.foto", read_only=True)
    zoom_level = serializers.FloatField(source="profile.zoom_level", read_only=True)
    group_names = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "groups", "group_names", "foto", "zoom_level", "is_superuser"]
        read_only_fields = ["id", "is_staff", "group_names", "zoom_level", "is_superuser"]

    def get_group_names(self, obj):
        return list(obj.groups.values_list("name", flat=True))


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["foto", "approval_status", "approved_at", "rejected_at"]
        read_only_fields = ["approval_status", "approved_at", "rejected_at"]


class LoginSerializer(serializers.Serializer):
    code = serializers.CharField()


class EmailTokenObtainSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Credenciales inválidas.")
        if not check_password(password, user.password):
            raise serializers.ValidationError("Credenciales inválidas.")
        if not user.is_active:
            raise serializers.ValidationError("Cuenta desactivada.")
        attrs["user"] = user
        return attrs


class AllowedDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedDomain
        fields = ["id", "domain", "created_at"]
        read_only_fields = ["id", "created_at"]

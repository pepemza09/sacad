from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from . import views

urlpatterns = [
    path("me/", views.me, name="auth-me"),
    path("login/", views.email_login, name="auth-login"),
    path("google/", views.google_login, name="google-login"),
    path("google/complete/", views.google_complete, name="google-complete"),
    path("logout/", views.logout, name="auth-logout"),
    path("profile/", views.profile_detail, name="auth-profile"),
    path("token/", TokenObtainPairView.as_view(), name="token-obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("users/", views.users_list, name="users-list"),
    path("pending-users/", views.pending_users, name="pending-users"),
    path("approve-user/<int:user_id>/", views.approve_user, name="approve-user"),
    path("reject-user/<int:user_id>/", views.reject_user, name="reject-user"),
    path("allowed-domains/", views.allowed_domains, name="allowed-domains"),
    path("allowed-domains/<int:domain_id>/", views.delete_allowed_domain, name="delete-allowed-domain"),
    path("groups/", views.groups_list, name="groups-list"),
    path("groups/rename/", views.rename_group, name="rename-group"),
    path("groups/permissions/", views.all_groups_with_permissions, name="groups-with-permissions"),
    path("groups/<int:group_id>/", views.delete_group, name="delete-group"),
    path("groups/<int:group_id>/permissions/", views.group_menu_permissions, name="group-menu-permissions"),
    path("groups/me/permissions/", views.my_menu_permissions, name="my-menu-permissions"),
    path("users/<int:user_id>/groups/", views.update_user_groups, name="update-user-groups"),
    path("update-zoom/", views.update_zoom, name="update-zoom"),
]

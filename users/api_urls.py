from django.urls import path
from . import api_views

urlpatterns = [
    path('users/', api_views.api_users_list, name='api_users_list'),
    path('users/update-role/', api_views.api_user_update_role, name='api_user_update_role'),
    path('users/my-permissions/', api_views.api_current_user_permissions, name='api_current_user_permissions'),
    path('users/<int:user_id>/', api_views.api_user_details, name='api_user_details'),
    path('test-role-update/', api_views.api_test_role_update, name='api_test_role_update'),
    path('csrf-token/', api_views.api_csrf_token, name='api_csrf_token'),
]
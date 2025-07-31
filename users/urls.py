from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from django.views.decorators.csrf import ensure_csrf_cookie

urlpatterns = [
    path('login/', views.EnterpriseLoginView.as_view(), name='login'),
    path('logout/', views.custom_logout, name='logout'),
    path('profile/', views.profile, name='profile'),
]
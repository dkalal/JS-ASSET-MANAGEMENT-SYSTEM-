"""
URL configuration for assetms project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from assets.views import (
    asset_create, get_dynamic_fields, AssetListView, AssetDetailView, AssetScanView, asset_by_code, AssetDetailByUUIDView, asset_export, AssetBulkImportView, download_import_template, dashboard_summary_api, dashboard_activity_api, dashboard_chart_data_api,
    recent_added_assets_api, recent_scans_api, recent_transfers_api, recent_maintenance_api, full_audit_log_api, user_assets_api, user_activity_api
)
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from django.views.generic import TemplateView
from reports.views import reports_dashboard, generate_report
from audit.views import audit_dashboard
from users.views import api_create_user, profile
from assets.views import AssetUpdateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('assets/register/', asset_create, name='asset_register'),
    path('api/dynamic-fields/', get_dynamic_fields, name='get_dynamic_fields'),
    path('assets/', AssetListView.as_view(), name='asset_list'),
    path('assets/<int:pk>/', AssetDetailView.as_view(), name='asset_detail'),
    path('scan/', AssetScanView.as_view(), name='asset_scan'),
    path('api/asset-by-code/', asset_by_code, name='asset_by_code'),
    path('assets/<uuid:uuid>/', AssetDetailByUUIDView.as_view(), name='asset_detail_by_uuid'),
    path('dashboard/', TemplateView.as_view(template_name='dashboard.html'), name='dashboard'),
    path('dashboard_summary_api/', dashboard_summary_api, name='dashboard_summary_api'),
    path('dashboard_activity_api/', dashboard_activity_api, name='dashboard_activity_api'),
    path('dashboard_chart_data_api/', dashboard_chart_data_api, name='dashboard_chart_data_api'),
    path('login/', auth_views.LoginView.as_view(template_name='assets/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    path('assets/export/', asset_export, name='asset_export'),
    path('test-modal/', TemplateView.as_view(template_name='test_modal.html'), name='test_modal'),
    path('assets/bulk-import/', AssetBulkImportView.as_view(), name='asset_bulk_import'),
    path('assets/download-import-template/', download_import_template, name='download_import_template'),
    path('reports/', reports_dashboard, name='reports_dashboard'),
    path('reports/generate/', generate_report, name='generate_report'),
    path('audit/', audit_dashboard, name='audit_dashboard'),
    path('recent-added-assets-api/', recent_added_assets_api, name='recent_added_assets_api'),
    path('recent-scans-api/', recent_scans_api, name='recent_scans_api'),
    path('recent-transfers-api/', recent_transfers_api, name='recent_transfers_api'),
    path('recent-maintenance-api/', recent_maintenance_api, name='recent_maintenance_api'),
    path('full-audit-log-api/', full_audit_log_api, name='full_audit_log_api'),
    path('api/create-user/', api_create_user, name='api_create_user'),
    path('api/user-assets/', user_assets_api, name='user_assets_api'),
    path('api/user-activity/', user_activity_api, name='user_activity_api'),
    path('profile/', profile, name='profile'),
    path('password_change/', auth_views.PasswordChangeView.as_view(), name='password_change'),
    path('password_change/done/', auth_views.PasswordChangeDoneView.as_view(), name='password_change_done'),
    path('assets/', include('assets.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

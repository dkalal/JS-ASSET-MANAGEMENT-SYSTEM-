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
from django.urls import path
from assets.views import asset_create, get_dynamic_fields, AssetListView, AssetDetailView, AssetScanView, asset_by_code, AssetDetailByUUIDView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('assets/register/', asset_create, name='asset_register'),
    path('api/dynamic-fields/', get_dynamic_fields, name='get_dynamic_fields'),
    path('assets/', AssetListView.as_view(), name='asset_list'),
    path('assets/<int:pk>/', AssetDetailView.as_view(), name='asset_detail'),
    path('scan/', AssetScanView.as_view(), name='asset_scan'),
    path('api/asset-by-code/', asset_by_code, name='asset_by_code'),
    path('assets/<uuid:uuid>/', AssetDetailByUUIDView.as_view(), name='asset_detail_by_uuid'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

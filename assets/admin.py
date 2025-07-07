from django.contrib import admin
from .models import AssetCategory, Asset

@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('pk', 'category', 'status', 'assigned_to', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('description',)

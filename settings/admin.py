from django.contrib import admin
from .models import ThemeSetting, BackupRestore

@admin.register(ThemeSetting)
class ThemeSettingAdmin(admin.ModelAdmin):
    list_display = ('primary_color', 'secondary_color', 'accent_color', 'background_color', 'updated_at')

@admin.register(BackupRestore)
class BackupRestoreAdmin(admin.ModelAdmin):
    list_display = ('backup_file', 'created_at', 'restored')
    list_filter = ('restored',)

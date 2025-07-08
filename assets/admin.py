from django.contrib import admin
from .models import AssetCategory, Asset, AssetCategoryField
from django.forms.models import BaseInlineFormSet

class AssetCategoryFieldInline(admin.TabularInline):
    model = AssetCategoryField
    extra = 1
    min_num = 1
    fields = ('key', 'label', 'type', 'required')

@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    inlines = [AssetCategoryFieldInline]
    exclude = ('dynamic_fields',)

    def save_formset(self, request, form, formset, change):
        super().save_formset(request, form, formset, change)
        # After saving fields, update dynamic_fields JSON
        category = form.instance
        fields = category.fields.all()
        schema = {}
        for f in fields:
            schema[f.key] = {
                'type': f.type,
                'label': f.label,
                'required': f.required,
            }
        category.dynamic_fields = schema
        category.save()

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('pk', 'category', 'status', 'assigned_to', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('description',)

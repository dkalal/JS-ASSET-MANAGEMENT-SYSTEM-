from django.contrib import admin
from .models import AssetCategory, Asset, AssetCategoryField
from django.forms.models import BaseInlineFormSet
from import_export import resources
from import_export.admin import ImportExportModelAdmin

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
        # Ensure required dynamic fields exist
        category = form.instance
        required_fields = [
            {'key': 'serial_number', 'label': 'Serial Number', 'type': 'text'},
            {'key': 'model', 'label': 'Model', 'type': 'text'},
            {'key': 'purchase_date', 'label': 'Purchase Date', 'type': 'date'},
            {'key': 'condition', 'label': 'Condition', 'type': 'text'},
            {'key': 'location', 'label': 'Location', 'type': 'text'},
        ]
        for field in required_fields:
            if not category.fields.filter(key=field['key']).exists():
                AssetCategoryField.objects.create(
                    category=category,
                    key=field['key'],
                    label=field['label'],
                    type=field['type'],
                    required=True
                )
        # After saving fields, update dynamic_fields JSON
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

class AssetResource(resources.ModelResource):
    class Meta:
        model = Asset
        fields = ('id', 'category__name', 'status', 'assigned_to__username', 'created_at', 'updated_at')
        export_order = fields

    def dehydrate(self, asset):
        # Flatten dynamic_data for export
        data = {}
        for k, v in asset.dynamic_data.items():
            data[f'dyn_{k}'] = v
        return data

@admin.register(Asset)
class AssetAdmin(ImportExportModelAdmin):
    resource_class = AssetResource
    list_display = ('pk', 'category', 'status', 'assigned_to', 'created_at', 'purchase_value', 'purchase_date', 'depreciation_method', 'useful_life_years')
    list_filter = ('status', 'category', 'depreciation_method')
    search_fields = ('description',)
    actions = ['export_as_pdf']
    fieldsets = (
        (None, {
            'fields': ('category', 'status', 'assigned_to', 'description', 'purchase_value', 'purchase_date', 'depreciation_method', 'useful_life_years', 'qr_code', 'images', 'documents', 'dynamic_data')
        }),
    )
    def export_as_pdf(self, request, queryset):
        # TODO: Implement PDF export with branding
        self.message_user(request, 'PDF export coming soon!')
    export_as_pdf.short_description = 'Export selected as PDF'

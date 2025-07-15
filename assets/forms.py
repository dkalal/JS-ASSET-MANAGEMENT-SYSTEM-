from django import forms
from .models import Asset
from django.core.exceptions import ValidationError
from django.http import QueryDict
import json

class AssetForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = [
            'category', 'status', 'assigned_to', 'description',
            'purchase_value', 'purchase_date', 'depreciation_method', 'useful_life_years',
            'qr_code', 'images', 'documents', 'dynamic_data'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
        }

    def clean_images(self):
        image = self.cleaned_data.get('images')
        if image:
            if image.size > 2*1024*1024:
                raise ValidationError('Image file too large (max 2MB).')
            if not image.content_type.startswith('image/'):
                raise ValidationError('File is not an image.')
        return image

    def clean_documents(self):
        doc = self.cleaned_data.get('documents')
        if doc:
            if doc.size > 5*1024*1024:
                raise ValidationError('Document file too large (max 5MB).')
            if not doc.content_type in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                raise ValidationError('Only PDF or Word documents are allowed.')
        return doc

    def clean(self):
        cleaned_data = super().clean()
        # Validate always-required dynamic fields
        dyn_data = self.data.get('dynamic_data')
        import json
        if isinstance(dyn_data, list):
            dyn_data = dyn_data[0] if dyn_data else '{}'
        try:
            dyn_data = json.loads(dyn_data) if dyn_data else {}
        except Exception:
            dyn_data = {}
        required_keys = ['serial_number', 'model', 'purchase_date', 'condition', 'location']
        missing = [k for k in required_keys if not dyn_data.get(k)]
        if missing:
            from django.core.exceptions import ValidationError
            raise ValidationError(f"Missing required fields: {', '.join(missing)}")
        # Depreciation validation
        purchase_value = cleaned_data.get('purchase_value')
        purchase_date = cleaned_data.get('purchase_date')
        useful_life_years = cleaned_data.get('useful_life_years')
        depreciation_method = cleaned_data.get('depreciation_method')
        if purchase_value or purchase_date or useful_life_years:
            # If any depreciation field is set, require all
            if not (purchase_value and purchase_date and useful_life_years and depreciation_method):
                raise forms.ValidationError('All depreciation fields (value, date, method, useful life) are required for depreciable assets.')
            if purchase_value <= 0:
                raise forms.ValidationError('Purchase value must be positive.')
            if useful_life_years <= 0:
                raise forms.ValidationError('Useful life must be positive.')
        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        # Handle dynamic fields from hidden input
        request = self.initial.get('request')
        if request:
            dyn_data = request.POST.get('dynamic_data')
            if dyn_data:
                import json
                instance.dynamic_data = json.loads(dyn_data)
        if commit:
            instance.save()
            self.save_m2m()
        return instance 
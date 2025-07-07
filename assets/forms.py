from django import forms
from .models import Asset
from django.core.exceptions import ValidationError

class AssetForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = ['category', 'status', 'description', 'assigned_to', 'images', 'documents']
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
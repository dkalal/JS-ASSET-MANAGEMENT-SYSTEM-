from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import JSONField
import uuid

# Create your models here.

class AssetCategoryField(models.Model):
    FIELD_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
    ]
    category = models.ForeignKey('AssetCategory', on_delete=models.CASCADE, related_name='fields')
    key = models.CharField(max_length=50, help_text='Field key (e.g., serial_number)')
    label = models.CharField(max_length=100, help_text='Field label (e.g., Serial Number)')
    type = models.CharField(max_length=20, choices=FIELD_TYPES, default='text')
    required = models.BooleanField()

    class Meta:
        unique_together = ('category', 'key')
        verbose_name = 'Dynamic Field'
        verbose_name_plural = 'Dynamic Fields'

    def __str__(self):
        return f"{self.label} ({self.key})"

class AssetCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    dynamic_fields = models.JSONField(blank=True, default=dict, help_text="JSON schema for dynamic fields (auto-managed)")

    def __str__(self):
        return self.name

class Asset(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Maintenance'),
        ('retired', 'Retired'),
        ('lost', 'Lost'),
    ]
    category = models.ForeignKey(AssetCategory, on_delete=models.CASCADE, related_name='assets')
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    dynamic_data = models.JSONField(default=dict, blank=True, help_text="Values for dynamic fields")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    images = models.ImageField(upload_to='asset_images/', blank=True, null=True)
    documents = models.FileField(upload_to='asset_docs/', blank=True, null=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category.name} Asset #{self.pk}"

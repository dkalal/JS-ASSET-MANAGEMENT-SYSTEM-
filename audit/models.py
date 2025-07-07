from django.db import models
from django.conf import settings
from assets.models import Asset

# Create your models here.

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('view', 'View'),
        ('edit', 'Edit'),
        ('move', 'Move'),
        ('delete', 'Delete'),
        ('create', 'Create'),
        ('error', 'Error'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    asset = models.ForeignKey(Asset, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user} {self.action} {self.asset} at {self.timestamp}"

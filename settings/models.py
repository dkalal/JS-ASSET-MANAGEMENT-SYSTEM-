from django.db import models

# Create your models here.

class ThemeSetting(models.Model):
    primary_color = models.CharField(max_length=7, default="#00A6EB")
    secondary_color = models.CharField(max_length=7, default="#176B87")
    accent_color = models.CharField(max_length=7, default="#04364A")
    background_color = models.CharField(max_length=7, default="#B4E9FC")
    logo = models.ImageField(upload_to='branding/', blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Theme Setting ({self.pk})"

class BackupRestore(models.Model):
    backup_file = models.FileField(upload_to='backups/')
    created_at = models.DateTimeField(auto_now_add=True)
    restored = models.BooleanField()

    def __str__(self):
        return f"Backup {self.pk} at {self.created_at}"

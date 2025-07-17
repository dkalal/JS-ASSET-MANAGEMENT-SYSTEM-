from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ADMIN = 'admin'
    MANAGER = 'manager'
    USER = 'user'
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (MANAGER, 'Manager'),
        (USER, 'User'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=USER)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True, help_text='User avatar/profile image')
    phone_number = models.CharField(max_length=32, blank=True, null=True, help_text='Contact phone number')

    # NOTE: After adding profile_image and phone_number, run makemigrations and migrate.

    def __str__(self):
        return f"{self.username} ({self.role})"

    def get_role_display(self):
        return dict(self.ROLE_CHOICES).get(str(self.role), self.role)

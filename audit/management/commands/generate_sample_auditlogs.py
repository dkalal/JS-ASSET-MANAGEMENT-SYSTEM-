from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from audit.models import AuditLog
from assets.models import Asset
from django.utils import timezone
import random

class Command(BaseCommand):
    help = 'Generate sample AuditLog entries for dashboard testing.'

    def handle(self, *args, **options):
        User = get_user_model()
        users = list(User.objects.all())
        assets = list(Asset.objects.all())
        if not users:
            self.stdout.write(self.style.WARNING('No users found. Please create at least one user.'))
            return
        if not assets:
            self.stdout.write(self.style.WARNING('No assets found. Please create at least one asset.'))
            return
        actions = [
            ('create', 'Asset created via dashboard'),
            ('scan', 'Asset scanned for inventory'),
            ('assign', 'Asset assigned to user'),
            ('maintenance', 'Asset sent for maintenance'),
        ]
        now = timezone.now()
        for i in range(10):
            user = random.choice(users)
            asset = random.choice(assets)
            action, details = random.choice(actions)
            related_user = random.choice(users) if action == 'assign' else None
            log = AuditLog.objects.create(
                user=user,
                action=action,
                asset=asset,
                timestamp=now - timezone.timedelta(minutes=random.randint(0, 1440)),
                details=details,
                related_user=related_user,
                metadata={"source": "sample_command"}
            )
            self.stdout.write(self.style.SUCCESS(f'Created log: {log}'))
        self.stdout.write(self.style.SUCCESS('Sample AuditLog entries generated.'))
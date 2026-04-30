import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Delete and recreate the superuser from DJANGO_SUPERUSER_* environment variables."

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not username:
            raise CommandError("DJANGO_SUPERUSER_USERNAME is not set.")
        if not password:
            raise CommandError("DJANGO_SUPERUSER_PASSWORD is not set.")

        deleted, _ = User.objects.filter(username=username).delete()
        if deleted:
            self.stdout.write(f"Deleted existing user '{username}'.")

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(
            self.style.SUCCESS(f"Superuser '{username}' created successfully.")
        )

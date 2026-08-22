from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        # Enregistre les signaux (création auto du profil).
        from . import models  # noqa: F401

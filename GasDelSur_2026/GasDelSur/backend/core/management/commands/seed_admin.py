from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from core.models import Users


class Command(BaseCommand):
    """
    Crea el usuario administrador inicial si no existe ningún admin todavía.
    Reemplaza la lógica que antes vivía en initDB() (project/src/lib/db.ts),
    que corría en el navegador contra localStorage. Ahora esto se ejecuta
    una vez en el servidor:

        python manage.py seed_admin
    """
    help = 'Crea el usuario administrador inicial (admin@gasdelsur.cl) si no existe ninguno.'

    def handle(self, *args, **options):
        if Users.objects.filter(role='admin').exists():
            self.stdout.write(self.style.WARNING('Ya existe al menos un administrador. No se crea ninguno nuevo.'))
            return

        Users.objects.create(
            name='Administrador',
            rut='11.111.111-1',
            email='admin@gasdelsur.cl',
            phone='+56 9 0000 0000',
            role='admin',
            password_hash=make_password('admin123'),
        )
        self.stdout.write(self.style.SUCCESS(
            'Administrador creado → email: admin@gasdelsur.cl / rut: 11.111.111-1 / password: admin123'
        ))

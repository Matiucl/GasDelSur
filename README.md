# Gas del Sur

## Requisitos previos

Antes de ejecutar el proyecto es necesario tener instalado:

* Python 3.12 o superior
* Node.js 20 o superior
* PostgreSQL 16 o superior
* Git

## Configuración de la base de datos

Opcional: Tener instalado un gestor/visualizador de bases de datos. Se recomienda DBeaver para inspeccionar y administrar la base de datos PostgreSQL.

1. Crear una base de datos PostgreSQL llamada:

```sql
CREATE DATABASE gasdelsur;
```

2. Configurar las credenciales de PostgreSQL en:

```text
backend/gasdelsur_api/settings.py
```

o en el archivo `.env` correspondiente.

Ejemplo:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'gasdelsur',
        'USER': 'postgres',
        'PASSWORD': 'tu_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Ejecución del Backend (Django)

Abrir una terminal:

```bash
cd backend

pip install -r requirements.txt

python manage.py migrate

python manage.py loaddata core/fixtures/products.json

python manage.py seed_admin

python manage.py runserver
```

El backend quedará disponible en:

```text
http://localhost:8000
```

## Ejecución del Frontend (React + Vite)

Abrir una segunda terminal:

```bash
cd project

npm install

npm run dev
```

El frontend quedará disponible en:

```text
http://localhost:5173
```

## Usuario Administrador Inicial

Al ejecutar como se pedía en Ejecución del Backend:

```bash
python manage.py seed_admin
```

se crea automáticamente un usuario administrador.

Credenciales:

```text
Rut: 11.111.111-1
Contraseña: admin123
```

Esto permitirá iniciar sesión como administrador para poder crear choferes dentro de esta vista

## Datos incluidos

El proyecto incluye:

* Código fuente completo.
* Base de datos PostgreSQL mediante migraciones Django.
* Productos iniciales cargados mediante fixtures.
* Usuario administrador inicial generado automáticamente.
* Frontend React + Vite.
* Backend Django REST Framework.

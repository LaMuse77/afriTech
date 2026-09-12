#!/bin/bash
set -e

echo "→ Attente de la base de données..."
# Optionnel : attendre que Postgres soit prêt (si tu utilises DATABASE_URL)
# python -c "
# import time, os, django
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fin.settings')
# django.setup()
# from django.db import connection
# for i in range(30):
#     try:
#         connection.ensure_connection()
#         print('DB prête')
#         break
#     except Exception:
#         time.sleep(1)
# else:
#     print('Timeout DB')
#     exit(1)
# "

echo "→ Migrations..."
python fin/manage.py migrate --noinput

echo "→ Collectstatic..."
python fin/manage.py collectstatic --noinput || true

echo "→ Démarrage Gunicorn..."
exec gunicorn fin.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
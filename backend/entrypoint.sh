#!/bin/bash
set -e

echo "Creating migrations..."
python manage.py makemigrations --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Creating default groups and admin user..."
python manage.py crear_admin

echo "Loading demo data..."
python manage.py poblar_demo

echo "Loading official 2026 study plans..."
python manage.py cargar_planes_2026

echo "Starting server..."
exec gunicorn sacad.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 9 \
  --threads 4 \
  --worker-class gthread \
  --worker-connections 1000 \
  --max-requests 10000 \
  --max-requests-jitter 2000 \
  --timeout 120 \
  --keep-alive 65 \
  --access-logfile - \
  --error-logfile -

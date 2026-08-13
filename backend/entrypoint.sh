#!/bin/bash
set -e

if [ "${DJANGO_SETTINGS_MODULE:-sacad.settings.development}" = "sacad.settings.production" ]; then
  echo "Producción: se omiten makemigrations (las migraciones deben estar versionadas en el repo)."
else
  echo "Creating migrations..."
  python manage.py makemigrations --noinput
fi

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear --no-post-process

if [ "$#" -gt 0 ]; then
  echo "Starting server (comando custom)..."
  exec "$@"
fi

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

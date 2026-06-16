#!/bin/bash
set -e

echo "Creating migrations..."
python manage.py makemigrations --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear --no-post-process

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

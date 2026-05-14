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

echo "Starting server..."
exec gunicorn sacad.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120

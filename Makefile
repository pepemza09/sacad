.PHONY: help build up down dev-backend dev-frontend logs migrate shell backup restore

help:
	@echo "SACAD - Sistema de Administración de Carreras, Actividades y Docentes"
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make build        - Construye todas las imágenes Docker"
	@echo "  make up           - Inicia todos los servicios (dev)"
	@echo "  make prod         - Inicia en modo producción"
	@echo "  make down         - Detiene todos los servicios"
	@echo "  make dev-backend  - Inicia backend localmente (sin Docker)"
	@echo "  make dev-frontend - Inicia frontend localmente (sin Docker)"
	@echo "  make logs         - Muestra logs de los servicios"
	@echo "  make migrate      - Ejecuta migraciones de Django"
	@echo "  make shell        - Abre shell de Django"
	@echo "  make backup       - Realiza backup de la base de datos"
	@echo "  make restore      - Restaura backup de la base de datos"

build:
	docker compose build

up:
	docker compose up -d

prod:
	docker compose -f docker-compose.prod.yml up -d

down:
	docker compose down

dev-backend:
	cd backend && python manage.py runserver 0.0.0.0:8000

dev-frontend:
	cd frontend && npm run dev

logs:
	docker compose logs -f

makemigrations:
	docker compose exec backend python manage.py makemigrations

migrate:
	docker compose exec backend python manage.py migrate

shell:
	docker compose exec backend python manage.py shell_plus

backup:
	@echo "Creando backup de la base de datos..."
	docker compose exec db pg_dump -U $$DB_USER -d $$DB_NAME -F c -f /backups/sacad_$$(date +%Y%m%d_%H%M%S).dump
	@echo "Backup completado."

restore:
	@echo "Uso: make restore FILE=backups/sacad_20240101_120000.dump"
	docker compose exec db pg_restore -U $$DB_USER -d $$DB_NAME -c /$$FILE

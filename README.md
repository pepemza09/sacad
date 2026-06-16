# SACAD — Sistema de Administración de Carreras, Actividades y Docentes

Sistema de gestión académica para la Facultad de Ciencias Económicas (UNCuyo). Desarrollado con Django REST Framework + React + PostgreSQL.

## Stack

| Capa     | Tecnología                                           |
| -------- | ---------------------------------------------------- |
| Backend  | Python 3.12, Django 5.1, Django REST Framework 3.15  |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4        |
| Base     | PostgreSQL 16 Alpine                                 |
| Proxy    | Nginx                                                |
| Orquest  | Docker Compose                                       |

## Requisitos

- Docker y Docker Compose

## Inicio rápido

```bash
git clone https://github.com/pepemza09/sacad.git
cd sacad
cp .env.example .env
docker compose up -d
```

### Cargar datos de prueba

Una vez que los servicios estén levantados:

```bash
docker compose exec backend python manage.py seed_data
```

Esto crea: superuser, facultad "FCE", sede "Mendoza", carrera "Contador Público", plan 2026, 8 áreas curriculares, 35 materias.

### Credenciales por defecto

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@sacad.edu` | `admin123` | Superuser (todos los permisos) |

## Sidebar

- **Dashboard** — Resumen del sistema
- **Facultades** — CRUD de facultades
- **Sedes** — CRUD de sedes
- **Carreras** — CRUD de carreras
- **Planes de Estudio** — CRUD de planes con títulos intermedios
- **Áreas** — CRUD de áreas curriculares (por plan)
- **Materias** — CRUD de materias (por plan, con área y tipo)
- **Equivalencias** — Equivalencias entre materias (con consulta N:M)
- **Configuración**
  - Tipos de Materia — CRUD de tipos
  - Dominios permitidos — Gestionar dominios de email
  - Roles de usuarios — Asignar roles
  - Autorización de usuarios — Aprobar/rechazar usuarios

## Configuración

### Variables de entorno (`.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `SECRET_KEY` | Clave secreta de Django | `change-this-to-...` |
| `DEBUG` | Modo debug | `False` |
| `ALLOWED_HOSTS` | Hosts permitidos | `sacad.localhost,localhost` |
| `DB_NAME` | Nombre de la base de datos | `sacad` |
| `DB_USER` | Usuario de la base de datos | `sacad` |
| `DB_PASSWORD` | Contraseña de la base de datos | `sacad` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | _(requerido)_ |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth | _(requerido)_ |
| `FRONTEND_URL` | URL del frontend | `http://localhost` |
| `SACAD_DOMAIN_RESTRICTION` | Dominio requerido para registro Google | `@fce.uncu.edu.ar` |

> **Google OAuth:** Configurar en Google Cloud Console la URI de redirección `http://localhost/accounts/google/login/callback/`.

## Roles y permisos

| Rol | Puede escribir |
|-----|---------------|
| Admin Universidad | Facultades |
| Secretario Académico | Sedes, Carreras, Planes, Áreas, Tipos de Materia |
| Director Carrera | Materias, Correlatividades |

Los botones de crear/editar/eliminar se ocultan en el frontend según el rol del usuario.

## Modelo de datos

```
Facultad ──┬── Sede
           └── Carrera ── PlanEstudio ──┬── Area
                                        ├── Materia ── TipoMateria
                                        └── Correlatividad

Equivalencia: materias_origen (M:N) ──>> materias_destino (M:N), por plan_destino
```

- Las **Áreas** pertenecen a un plan de estudio (FK `PlanEstudio`)
- Las **Materias** pertenecen a un plan y opcionalmente a un área (FK `Area` con `SET_NULL`)
- Las **Correlatividades** se definen entre materias del mismo plan
- Las **Equivalencias** relacionan materias de distintos planes (origen → destino)

## Protecciones de datos

Ninguna entidad con dependencias puede eliminarse. El backend responde con `409 Conflict` y un mensaje en `response.data.detail`:

- **Facultad** protegida si tiene sedes o carreras
- **Sede** protegida si tiene carreras
- **Carrera** protegida si tiene planes
- **Plan** protegido si tiene materias
- **Área** protegida si tiene materias
- **Materia** protegida si tiene correlativas o equivalencias
- **Tipo de Materia** protegido si tiene materias

## Comandos útiles

### Make

```bash
make build    # Construir imágenes
make up       # docker compose up -d
make down     # docker compose down
make logs     # Logs en tiempo real
make migrate  # Ejecutar migraciones
make shell    # shell_plus de Django
make backup   # Backup de BD
```

### Reconstruir frontend tras cambios

```bash
docker compose build frontend && docker compose up -d frontend
```

### Recargar datos de prueba

```bash
docker compose exec backend python manage.py seed_data
```

### Shell de Django

```bash
docker compose exec backend python manage.py shell
```

## Plan 2026 (Contador Público FCE)

| Año | Período | Códigos |
|-----|---------|---------|
| 1 (Bimestres/Cuat) | 1er/2do/3er Bim, 2do Cuat | 510201–510207 |
| 2 (Cuatrimestres) | 1er/2do Cuat | 520201–520209 |
| 3 (Cuatrimestres) | 1er/2do Cuat | 530201–530207 |
| 4 (Cuatrimestres) | 1er/2do Cuat | 540201–540207 |
| Optativas | — | 570201–570205 |

## Zoom de interfaz

Cada usuario puede ajustar el zoom (75%–200%) desde el header. Se persiste en `Profile.zoom_level` y escala las unidades `rem` de Tailwind.

## Desarrollo local (sin Docker)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Frontend
cd frontend
npm install
npm run dev
```

## Actualización y migración de datos

### Flujo seguro de actualización

Cuando se tira nuevo código con cambios en el modelo de datos (nuevos campos, tablas o relaciones), seguir estos pasos para no perder datos:

```bash
# 1. Respaldo de la base de datos actual
docker compose exec db pg_dump -U sacad sacad > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Bajar servicios
docker compose down

# 3. Tirar el nuevo código (git pull, etc.)

# 4. Reconstruir imágenes si hubo cambios en dependencias
docker compose build

# 5. Levantar servicios
docker compose up -d

# 6. Las migraciones se ejecutan automáticamente vía entrypoint.sh
#    (makemigrations --noinput + migrate)
```

El entrypoint del backend ejecuta `makemigrations --noinput && migrate` en cada inicio, por lo que las nuevas migraciones se aplican automáticamente sin intervención manual.

> **Importante:** si se agrega un campo con `null=False` y sin `default` a una tabla con datos existentes, la migración fallará. En ese caso hay que:
> 1. Agregar el campo con `null=True` o un `default`
> 2. Hacer `makemigrations` y `migrate`
> 3. Poblar el campo en los registros existentes vía `data migration` o shell
> 4. Cambiar a `null=False` en una migración posterior

### Backup y restauración manual

```bash
# Backup
docker compose exec -T db pg_dump -U sacad sacad > sacad_backup.sql

# Restaurar (borra todo y carga el backup)
docker compose exec -T db psql -U sacad -d sacad < sacad_backup.sql

# También se puede usar el comando make
make backup
```

### Scripts automatizados

```bash
# Backup (opcional: directorio destino, default ./backups/)
./scripts/backup.sh
./scripts/backup.sh /ruta/para/guardar

# Restaurar (pide confirmación)
./scripts/restore.sh backups/sacad_20260616_120000.sql
```

### Escenarios que pueden causar pérdida de datos

| Situación | Riesgo | Solución |
|-----------|--------|----------|
| `docker compose down -v` | BORRA el volumen de PostgreSQL (pérdida total) | NO usar `-v` a menos que se quiera resetear |
| `python manage.py flush` | Borra todos los datos pero mantiene estructura | Útil para recargar seed data desde cero |
| Migración con campo NOT NULL sin default en tabla existente | Falla con error | Agregar `null=True` primero o dar un default |
| Renombrar un campo | Django no detecta el rename, crea campo nuevo + elimina viejo (pérdida de datos) | Hacer `migrate --empty` + `RenameField` manual |
| Eliminar una tabla/modelo | Borra todos los datos permanentemente | Hacer backup antes de eliminar |

### Seed data (idempotente)

El comando `seed_data` usa `get_or_create`, por lo que es seguro ejecutarlo múltiples veces sin duplicar registros:

```bash
docker compose exec backend python manage.py seed_data
```

## Producción

```bash
make prod
# o
docker compose -f docker-compose.prod.yml up -d
```

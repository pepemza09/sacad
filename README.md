# SACAD - Sistema de Administración de Carreras, Actividades y Docentes

Sistema de Administración de Carreras, Actividades y Docentes. Desarrollado con Django REST Framework + React + PostgreSQL.

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
# Clonar el repositorio
git clone https://github.com/pepemza09/sacad.git
cd sacad

# Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores correspondientes

# Construir e iniciar todos los servicios
docker compose up -d
```

La aplicación estará disponible en http://localhost.

### Credenciales por defecto

- **Email:** `admin@sacad.edu`
- **Contraseña:** `admin123`

## Configuración

### Variables de entorno (`.env`)

| Variable              | Descripción                       | Valor por defecto       |
| --------------------- | --------------------------------- | ----------------------- |
| `SECRET_KEY`          | Clave secreta de Django           | `change-this-to-...`    |
| `DEBUG`               | Modo debug                        | `False`                 |
| `ALLOWED_HOSTS`       | Hosts permitidos                  | `sacad.localhost,localhost` |
| `DB_NAME`             | Nombre de la base de datos        | `sacad`                 |
| `DB_USER`             | Usuario de la base de datos       | `sacad`                 |
| `DB_PASSWORD`         | Contraseña de la base de datos    | `sacad`                 |
| `GOOGLE_CLIENT_ID`    | Client ID de Google OAuth          | _(requerido)_           |
| `GOOGLE_CLIENT_SECRET`| Client Secret de Google OAuth      | _(requerido)_           |
| `FRONTEND_URL`        | URL del frontend                   | `http://localhost`      |
| `SACAD_DOMAIN_RESTRICTION` | Dominio requerido para registro Google | `@fce.uncu.edu.ar` |

> **Google OAuth:** Configurar en Google Cloud Console la URI de redirección `http://localhost/accounts/google/login/callback/` (o la URL correspondiente en producción).

### Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto y configurar la pantalla de consentimiento OAuth
3. Crear credenciales OAuth 2.0 (tipo Aplicación web)
4. Agregar `http://localhost/accounts/google/login/callback/` como URI de redirección autorizada
5. Copiar Client ID y Client Secret al `.env`

## Comandos útiles (Make)

```bash
make build    # Construir imágenes Docker
make up       # Iniciar servicios
make down     # Detener servicios
make logs     # Ver logs en tiempo real
make migrate  # Ejecutar migraciones
make shell    # Abrir shell de Django
make backup   # Backup de la base de datos
```

## Arquitectura

```
sacad/
├── backend/                    # Django REST API
│   ├── sacad/apps/
│   │   ├── academica/          # Facultades, Sedes, Carreras, Planes, Materias
│   │   ├── usuarios/           # Auth, perfiles, roles, dominios permitidos
│   │   └── equivalencias/      # Equivalencias entre materias
│   ├── entrypoint.sh           # Script de inicio (migraciones + seed)
│   └── Dockerfile
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   ├── context/            # Contextos (Auth, Sidebar, Theme)
│   │   ├── layout/             # Header, Sidebar, Layout
│   │   └── pages/              # Páginas del sistema
│   ├── nginx.conf              # Configuración de Nginx
│   └── Dockerfile
├── docker-compose.yml          # Orquestación de servicios
├── Makefile                    # Comandos de gestión
└── .env.example                # Template de variables de entorno
```

## Sidebar

- **Dashboard** — Resumen del sistema
- **Académica**
  - Facultades — CRUD de facultades
  - Sedes — CRUD de sedes (asociadas a facultad)
  - Carreras — CRUD de carreras (asociadas a facultad y sedes)
  - Planes de Estudio — CRUD de planes con títulos intermedios
  - Materias — CRUD de materias
- **Equivalencias** — Equivalencias entre materias
- **Configuración**
  - Autorización de usuarios — Aprobar/rechazar/desactivar usuarios
  - Dominios permitidos — Gestionar dominios de email para registro
  - Roles de usuarios — Asignar roles a usuarios

## Roles

| Rol                    | Permisos en backend                                 | Botones visibles en frontend                     |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Admin Universidad      | CRUD de facultades, sedes, carreras, planes          | Facultades, Sedes, Carreras, Planes (Agregar/Editar/Eliminar) |
| Secretario Académico   | CRUD de sedes, carreras, planes, equivalencias       | Sedes, Carreras, Planes (Agregar/Editar/Eliminar) |
| Director Carrera       | CRUD de materias y correlatividades                  | Solo páginas de consulta                         |
| Docente / pendiente    | Solo lectura                                         | Ningún botón de escritura                        |

## Zoom de interfaz

Cada usuario puede ajustar el nivel de zoom (75%–200%) desde el control en el header. El nivel se persiste en el backend (`Profile.zoom_level`) y se aplica vía `fontSize` sobre `<html>`, escalando las unidades `rem` de Tailwind. Al iniciar sesión se restaura automáticamente.

## Permisos en frontend

Los botones de crear, editar y eliminar se ocultan condicionalmente según `user.group_names` e `is_superuser`. El serializer expone `group_names` (array de strings) para que el frontend pueda evaluar permisos sin depender de IDs numéricos.

## Auto-asignación de rol

Al aprobar un usuario desde "Autorización de usuarios", si este no tiene ningún grupo asignado se le asigna automáticamente el rol **Director Carrera**, garantizando que tenga al menos permisos básicos de escritura (materias).

## Protecciones de datos

Las entidades con dependencias no pueden eliminarse:

- Una **facultad** no se elimina si tiene sedes o carreras asociadas
- Una **sede** no se elimina si tiene carreras asociadas
- Una **carrera** no se elimina si tiene planes de estudio asociados
- Un **plan de estudio** no se elimina si tiene materias asociadas

## Desarrollo local (sin Docker)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Frontend
cd frontend
npm install
npm run dev
```

## Producción

```bash
make prod
# o
docker compose -f docker-compose.prod.yml up -d
```

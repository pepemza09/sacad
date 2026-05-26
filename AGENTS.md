# SACAD — Contexto del Proyecto

## Stack

| Capa     | Tecnología                                           |
| -------- | ---------------------------------------------------- |
| Backend  | Python 3.12, Django 5.1, Django REST Framework 3.15  |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4        |
| Base     | PostgreSQL 16 Alpine                                 |
| Proxy    | Nginx                                                |
| Orquest  | Docker Compose                                       |

## Estructura del proyecto

```
sacad/
├── backend/
│   ├── sacad/
│   │   ├── settings/         # base.py, development.py, production.py
│   │   ├── urls.py           # Rutas raíz (admin, api/auth/, api/ academica + equivalencias, accounts/)
│   │   ├── celery.py         # Placeholder (vacio)
│   │   └── apps/
│   │       ├── academica/    # Facultades, Sedes, Carreras, Planes, Materias, Correlatividades
│   │       ├── usuarios/     # Auth, Profile, AllowedDomain, Google OAuth
│   │       └── equivalencias/# Equivalencias entre materias + motor de resolución en cascada
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/              # client.ts (axios + JWT interceptors), services.ts
│   │   ├── context/          # AuthContext, SidebarContext, ThemeContext
│   │   ├── hooks/            # useApiData, useGoBack, useModal
│   │   ├── layout/           # AppLayout, AppSidebar, AppHeader, SidebarWidget, Backdrop
│   │   ├── components/       # ui/, form/, common/, charts/, etc.
│   │   ├── pages/
│   │   │   ├── SACAD/        # Páginas reales de la app (ver abajo)
│   │   │   ├── AuthPages/    # SignIn, SignUp, AuthCallback, AuthPending
│   │   │   └── ...
│   │   └── icons/            # SVGs como componentes React
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
├── spec.json                 # Especificación completa del proyecto
└── .env.example
```

## Enlaces rápidos

- **Frontend páginas SACAD**: `frontend/src/pages/SACAD/`
- **Backend models**: `backend/sacad/apps/academica/models.py`
- **Backend serializers**: `backend/sacad/apps/academica/serializers.py`
- **Backend views**: `backend/sacad/apps/academica/views.py`
- **Backend permissions**: `backend/sacad/apps/academica/permissions.py`
- **Backend filtros**: `backend/sacad/apps/academica/filters.py`
- **Backend usuarios views**: `backend/sacad/apps/usuarios/views.py`
- **Backend usuarios adapter (Google OAuth)**: `backend/sacad/apps/usuarios/adapters.py`
- **Backend equivalencias engine**: `backend/sacad/apps/equivalencias/engine.py`
- **Frontend API services**: `frontend/src/api/services.ts`
- **Frontend AuthContext**: `frontend/src/context/auth/AuthContext.tsx`
- **Frontend App.tsx (rutas)**: `frontend/src/App.tsx`
- **Especificación completa**: `spec.json`

## Backend — Modelos

### academica

| Modelo | Campos clave | Relaciones |
|--------|-------------|------------|
| `Facultad` | codigo (unique), nombre_corto, nombre, decano (FK->User), activa | — |
| `Sede` | codigo, nombre, facultad (FK), activa, direccion, localidad | unique_together: (facultad, codigo) |
| `Carrera` | facultad (FK), codigo, codigo_ministerial, nombre_corto, nombre, titulo_otorga, duracion_anos, nivel, modalidad, sedes (M2M), director (FK->User), activa | unique_together: (facultad, codigo) |
| `TituloIntermedio` | nombre, duracion_anos | Independiente, M2M desde PlanEstudio |
| `PlanEstudio` | carrera (FK), codigo, version, titulo_otorga, duracion_anos, año_inicio_implementacion, vigente, titulos_intermedios (M2M) | unique_together: (carrera, codigo) |
| `Materia` | plan_estudio (FK), codigo, nombre, año, cuatrimestre (1/2/anual), carga_horaria_semanal, carga_horaria_total, tipo (obligatoria/optativa/electiva), contenidos_minimos | unique_together: (plan_estudio, codigo) |
| `Correlatividad` | materia (FK), materia_requerida (FK), tipo (cursar/aprobar/regular) | unique_together: (materia, materia_requerida, tipo). Valida mismo plan_estudio |

### usuarios

| Modelo | Campos clave |
|--------|-------------|
| `Profile` | user (OneToOne), foto, approval_status (pending/approved/rejected), approved_at, rejected_at, zoom_level (50-200) |
| `AllowedDomain` | domain (unique), created_at |

### equivalencias

| Modelo | Campos clave |
|--------|-------------|
| `Equivalencia` | plan_destino (FK), materias_origen (M2M), materias_destino (M2M), tipo (total/parcial), resolucion, porcentaje, observaciones, activa |

## Backend — APIs

### Autenticación (`/api/auth/`)
| Endpoint | Método | Permiso | Descripción |
|----------|--------|---------|-------------|
| `/me/` | GET | Auth | Usuario actual |
| `/login/` | POST | AllowAny | Email+password → JWT |
| `/google/` | POST | AllowAny | Placeholder Google OAuth |
| `/google/complete/` | GET | — | Callback Google → redirect con JWT |
| `/logout/` | POST | Auth | Blacklist refresh token |
| `/profile/` | GET/PUT/PATCH | Auth | Foto de perfil |
| `/update-zoom/` | PATCH | Auth | Zoom level (50-200) |
| `/token/` | POST | AllowAny | JWT pair |
| `/token/refresh/` | POST | AllowAny | Refresh JWT |
| `/token/verify/` | POST | AllowAny | Verify JWT |
| `/users/` | GET | Staff | Lista usuarios |
| `/users/<id>/groups/` | PATCH | Staff | Asignar grupos |
| `/pending-users/` | GET | Staff | Usuarios pendientes |
| `/approve-user/<id>/` | PATCH | Staff | Aprobar (auto-asigna Director Carrera) |
| `/reject-user/<id>/` | PATCH | Staff | Rechazar |
| `/allowed-domains/` | GET/POST | Staff | CRUD dominios |
| `/allowed-domains/<id>/` | DELETE | Staff | Eliminar dominio |
| `/groups/` | GET | Staff | Lista grupos |

### Académica (`/api/`)
| Endpoint | ViewSet | Permiso escritura |
|----------|---------|-------------------|
| `/facultades/` | FacultadViewSet | Admin Universidad |
| `/sedes/` | SedeViewSet | Secretario Académico |
| `/carreras/` | CarreraViewSet | Secretario Académico |
| `/planes/` | PlanEstudioViewSet | Secretario Académico |
| `/planes/<id>/arbol-curricular/` | @action GET | Auth |
| `/materias/` | MateriaViewSet | Director Carrera |
| `/materias/<id>/correlativas/` | @action GET | Auth |
| `/correlatividades/` | CorrelatividadViewSet | Director Carrera |
| `/dashboard/stats/` | Function GET | Auth |

### Equivalencias (`/api/`)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/equivalencias/` | GET/POST | CRUD |
| `/equivalencias/<id>/` | PUT/DELETE | CRUD |
| `/equivalencias/consultar/` | GET | Resolución en cascada |
| `/equivalencias/validar/` | POST | Validar ciclos |

## Backend — Permisos

| Clase | Lógica | Aplica a |
|-------|--------|----------|
| `EsAdminUniversidad` | superuser OR group "Admin Universidad" | Facultad write |
| `EsSecretarioAcademico` | superuser OR groups ["Admin Universidad", "Secretario Académico"] | Sede, Carrera, Plan write |
| `EsDirectorCarrera` | superuser OR groups ["Admin Universidad", "Secretario Académico", "Director Carrera"] | Materia, Correlatividad write |

## Frontend — Páginas y estado

### ✅ Completas (CRUD operativo)
| Página | Archivo | Rutas |
|--------|---------|-------|
| Dashboard | `pages/SACAD/SACADDashboard.tsx` | `/` |
| Facultades | `pages/SACAD/FacultadesPage.tsx` | `/facultades` |
| Sedes | `pages/SACAD/SedesPage.tsx` | `/sedes` |
| Carreras | `pages/SACAD/CarrerasPage.tsx` | `/carreras` |
| Planes de Estudio | `pages/SACAD/PlanesPage.tsx` | `/planes` |
| Configuración | `pages/SACAD/ConfiguracionPage.tsx` | `/configuracion` |
| Autorización usuarios | `pages/SACAD/AutorizacionUsuariosPage.tsx` | `/configuracion/usuarios` |
| Dominios permitidos | `pages/SACAD/GestionDominiosPage.tsx` | `/configuracion/dominios` |
| Roles de usuarios | `pages/SACAD/GestionRolesPage.tsx` | `/configuracion/roles` |
| Perfil | `pages/SACAD/ProfilePage.tsx` | `/profile` |
| Búsqueda | `pages/SACAD/SearchPage.tsx` | `/buscar` |

### ❌ Solo lectura (falta CRUD)
| Página | Archivo | Ruta |
|--------|---------|------|
| Materias | `pages/SACAD/MateriasPage.tsx` | `/materias` |
| Equivalencias | `pages/SACAD/EquivalenciasPage.tsx` | `/equivalencias` |

## Frontend — API Layer

- **Base URL**: `import.meta.env.VITE_API_URL || '/api'`
- **Cliente**: Axios con interceptor JWT (lee `sessionStorage.access_token`)
- **Refresh automático**: Response interceptor captura 401, refresca con `/auth/token/refresh/`
- **Servicios**: `api/services.ts` → `academicaApi`, `equivalenciasApi`, `authApi`
- **Páginas CRUD** llaman `apiClient` directamente para POST/PUT/DELETE

## Frontend — Auth Flow

1. **Google OAuth**: Click → `/accounts/google/login/` → Google → callback `/api/auth/google/complete/` → redirect a frontend `/auth/callback?access=X&refresh=Y`
2. **Email**: POST `/auth/login/` con email+password → JWT
3. **Tokens**: `sessionStorage` (se borran al cerrar browser)
4. **Nuevos usuarios Google**: Se crean con `is_active=False`, redirect a `/auth/pending`
5. **Aprobación**: Staff → PATCH `/auth/approve-user/<id>/` → auto-asigna grupo "Director Carrera" si no tiene grupos

## Frontend — Layout

- **AppLayout**: SidebarProvider > AppSidebar + AppHeader + Outlet
- **Sidebar**: 290px expanded, 90px collapsed, hover expand
- **Header**: Search (⌘K), ZoomControl, ThemeToggle, NotificationDropdown, UserDropdown
- **Zoom**: Se persiste en `Profile.zoom_level` (50-200%), se aplica como `fontSize` en `<html>`

## Frontend — Convenciones de código

- **Estilos**: Tailwind CSS v4 con `@theme` en `index.css`
- **Modal**: Componente `Modal` + hook `useModal`
- **Tablas**: `rounded-xl border bg-white` wrapper + `table` estándar
- **Botones**: `Button` component con `size="sm"`, variant `primary`/`outline`
- **Form inputs**: `InputField` (wrapper) o `<input>` directo con clases
- **Breadcrumb**: Componente `PageBreadcrumb` con `items` array
- **CRUD pattern**: Modal para create/edit, Modal para delete confirmation
- **Permisos condicionales**: `canWrite = user?.is_superuser || user?.group_names?.includes("Rol")`
- **Manejo de errores**: Catch axios error → mapear `response.data` a `FieldErrors`

## Backend — Convenciones de código

- **ViewSets**: `ModelViewSet` con `get_serializer_class()` para list vs detail
- **Permissions**: `get_permissions()` method que retorna distintas clases por acción
- **Protected delete**: `destroy()` catches `ProtectedError` → 409
- **Serializers**: List serializers separados con counts via `SerializerMethodField`
- **Filtros**: `django-filters` FilterSets con `DjangoFilterBackend`

## Comandos útiles

```bash
make build       # docker compose build
make up          # docker compose up -d
make down        # docker compose down
make logs        # docker compose logs -f
make migrate     # docker compose exec backend python manage.py migrate
make shell       # docker compose exec backend python manage.py shell_plus
make dev-backend # cd backend && python manage.py runserver 0.0.0.0:8000
make dev-frontend # cd frontend && npm run dev
```

## Especulación CRUD Materias (próxima tarea lógica)

La página `MateriasPage.tsx` actualmente solo muestra una tabla read-only. Para implementar CRUD completo:

1. **Formulario (Modal)** con campos:
   - plan_estudio (buscador dropdown)
   - codigo, nombre
   - año (number)
   - cuatrimestre (select: 1, 2, anual)
   - carga_horaria_semanal, carga_horaria_total
   - tipo (select: obligatoria, optativa, electiva)
   - contenidos_minimos (textarea)
2. **Gestión de correlatividades** (pestaña/tabla dentro del modal o página separada)
3. **Permisos**: `canWrite` condicionado a "Admin Universidad", "Secretario Académico", o "Director Carrera"
4. **DELETE** con protección: backend chequea si tiene correlativas
5. **Endpoint**: POST/PUT/DELETE `/materias/<id>/` (ya existe en backend)

## Especulación CRUD Equivalencias (próxima tarea lógica)

La página `EquivalenciasPage.tsx` actualmente solo tiene consulta y lista read-only. Para CRUD:

1. **Formulario (Modal)** con campos:
   - plan_destino (buscador)
   - materias_origen (multi-select de materias)
   - materias_destino (multi-select de materias)
   - tipo (total/parcial)
   - porcentaje (solo si parcial)
   - resolucion, observaciones
   - activa (switch)
2. **Endpoint**: POST/PUT/DELETE `/equivalencias/<id>/` (ya existe en backend, con `equivalenciasApi`)

## Archivos clave para referencia al implementar CRUD

```typescript
// Patrón estándar de CRUD (ej: FacultadesPage.tsx)
// - useApiData para fetch
// - useModal para control del modal
// - form state + editingId + errors
// - handleSubmit con POST/PUT
// - handleDelete con confirmación
// - canWrite condicional
```

```python
# Patrón backend (ej: FacultadViewSet)
# - ModelViewSet
# - get_serializer_class() para list vs detail
# - get_permissions() por acción
# - destroy con ProtectedError catch
```

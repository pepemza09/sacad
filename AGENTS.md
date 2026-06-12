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
│   │       ├── academica/    # Facultades, Sedes, Carreras, Planes, Materias, Correlatividades, TipoMateria
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
├── spec.json                 # Especificación completa del proyecto (ligeramente desactualizada)
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
| `TipoMateria` | nombre (unique), activo | — |
| `Materia` | plan_estudio (FK), codigo, nombre, año, cuatrimestre (1/2/anual), creditos, periodo, carga_horaria_semanal, carga_horaria_total, tipo (FK->TipoMateria), contenidos_minimos | unique_together: (plan_estudio, codigo) |
| `Correlatividad` | materia (FK), materia_requerida (FK), tipo (cursar/cursado/aprobar/aprobacion/regular) | unique_together: (materia, materia_requerida, tipo). Valida mismo plan_estudio |

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
| Endpoint | ViewSet | Permiso lectura | Permiso escritura |
|----------|---------|----------------|-------------------|
| `/facultades/` | FacultadViewSet | Auth | Admin Universidad |
| `/sedes/` | SedeViewSet | Auth | Secretario Académico |
| `/carreras/` | CarreraViewSet | Auth | Secretario Académico |
| `/planes/` | PlanEstudioViewSet | Auth | Secretario Académico |
| `/planes/<id>/arbol-curricular/` | @action GET | Auth | — |
| `/materias/` | MateriaViewSet | Auth | Director Carrera |
| `/materias/<id>/correlativas/` | @action GET | Auth | — |
| `/correlatividades/` | CorrelatividadViewSet | Director Carrera | Director Carrera |
| `/tipos-materia/` | TipoMateriaViewSet | Auth | Secretario Académico |
| `/dashboard/stats/` | Function GET | Auth | — |

### Equivalencias (`/api/`)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/equivalencias/` | GET/POST | CRUD |
| `/equivalencias/<id>/` | PUT/DELETE | CRUD |
| `/equivalencias/consultar/` | GET | Resolución en cascada (BFS) |
| `/equivalencias/validar/` | POST | Validar ciclos |

## Backend — Permisos

| Clase | Lógica | Aplica a |
|-------|--------|----------|
| `EsAdminUniversidad` | superuser OR group "Admin Universidad" | Facultad write |
| `EsSecretarioAcademico` | superuser OR groups ["Admin Universidad", "Secretario Académico"] | Sede, Carrera, Plan, TipoMateria write |
| `EsDirectorCarrera` | superuser OR groups ["Admin Universidad", "Secretario Académico", "Director Carrera"] | Materia, Correlatividad write |

## Backend — Serializers

| ViewSet | List Serializer | Detail/Create Serializer |
|---------|----------------|-------------------------|
| FacultadViewSet | FacultadListSerializer (con carreras_count, sedes_count) | FacultadSerializer (full) |
| SedeViewSet | SedeListSerializer | SedeSerializer |
| CarreraViewSet | CarreraListSerializer | CarreraSerializer |
| PlanEstudioViewSet | PlanEstudioListSerializer (con materias_count) | PlanEstudioSerializer |
| MateriaViewSet | MateriaSerializer | MateriaDetailSerializer (con correlativas, requisito_de) |
| CorrelatividadViewSet | CorrelatividadSerializer (único) | CorrelatividadSerializer |
| TipoMateriaViewSet | TipoMateriaSerializer (único) | TipoMateriaSerializer |
| EquivalenciaViewSet | EquivalenciaSerializer (único) | EquivalenciaSerializer |

## Backend — Filtros (django-filters)

| FilterSet | Model | Campos |
|-----------|-------|--------|
| FacultadFilter | Facultad | activa, nombre (icontains) |
| SedeFilter | Sede | activa, facultad (exact), nombre (icontains) |
| CarreraFilter | Carrera | facultad, activa, nivel, modalidad, codigo_ministerial (icontains), nombre_corto (icontains) |
| PlanEstudioFilter | PlanEstudio | carrera (exact), vigente (exact), año_inicio_implementacion (exact/gte/lte) |
| MateriaFilter | Materia | plan_estudio (exact), codigo (exact/icontains), nombre (icontains), año, cuatrimestre, creditos (exact/gte/lte), periodo, tipo (tipo__id) |
| CorrelatividadViewSet | — | Sin filtros |
| EquivalenciaViewSet | — | Filtro manual por plan_destino, materia_origen en get_queryset() |

## Frontend — Páginas y estado

### ✅ CRUD completo
| Página | Archivo | Ruta |
|--------|---------|------|
| Dashboard | `pages/SACAD/SACADDashboard.tsx` | `/` |
| Facultades | `pages/SACAD/FacultadesPage.tsx` | `/facultades` |
| Sedes | `pages/SACAD/SedesPage.tsx` | `/sedes` |
| Carreras | `pages/SACAD/CarrerasPage.tsx` | `/carreras` |
| Planes de Estudio | `pages/SACAD/PlanesPage.tsx` | `/planes` |
| Materias | `pages/SACAD/MateriasPage.tsx` | `/materias` |
| Equivalencias | `pages/SACAD/EquivalenciasPage.tsx` | `/equivalencias` |
| Tipos de Materia | `pages/SACAD/GestionTiposMateriaPage.tsx` | `/configuracion/tipos-materia` |
| Dominios permitidos | `pages/SACAD/GestionDominiosPage.tsx` | `/configuracion/dominios` |
| Roles de usuarios | `pages/SACAD/GestionRolesPage.tsx` | `/configuracion/roles` |
| Perfil | `pages/SACAD/ProfilePage.tsx` | `/profile` |

### ✅ Gestión (sin CRUD tradicional)
| Página | Archivo | Ruta |
|--------|---------|------|
| Configuración (hub) | `pages/SACAD/ConfiguracionPage.tsx` | `/configuracion` |
| Autorización usuarios | `pages/SACAD/AutorizacionUsuariosPage.tsx` | `/configuracion/usuarios` |
| Búsqueda | `pages/SACAD/SearchPage.tsx` | `/buscar` |

### ❌ No existe (pendiente)
| Funcionalidad | Estado |
|--------------|--------|
| Gestión de correlatividades (UI) | No existe. Backend: `CorrelatividadViewSet` CRUD + `materias/<id>/correlativas/` GET. Frontend: `services.ts` tiene `createCorrelatividad`, `deleteCorrelatividad`, `materiaCorrelativas` pero sin usar. |
| Vista detalle de materia | No existe. Backend: `MateriaDetailSerializer` con correlativas y requisito_de. Frontend: `materiaDetalle(id)` en services.ts sin usar. |

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

## Backend — Gaps conocidos

1. ~~**MateriaViewSet.destroy()** no captura `ProtectedError`~~ ✅ Ahora protege contra correlativas y equivalencias.
2. **CorrelatividadViewSet** requiere `EsDirectorCarrera` incluso para lectura (global), a diferencia de otros viewsets que usan `IsAuthenticated` para lectura.
3. **EquivalenciaViewSet** usa filtro manual en `get_queryset()` en vez de `django-filters`.
4. **CorrelatividadViewSet** no tiene filtros.
5. No hay endpoint de stats de equivalencias expuesto (el engine tiene `get_stats_plan()`).
6. **TipoMateriaViewSet.destroy()** ahora captura `ProtectedError` correctamente.

## Frontend — Gaps conocidos

1. **No hay UI de correlatividades** — Mayor gap. No hay forma de gestionar correlatividades (crear/eliminar prerrequisitos). Backend soporta CRUD completo.
2. ~~**EquivalenciasPage** — Botones create/edit/delete visibles a todos los usuarios autenticados (falta `canWrite`).~~ ✅ Ahora con `canWrite`.
3. **MateriasPage** — No hay filtro por plan_estudio (el backend lo soporta).
4. **EquivalenciasPage** — No hay filtro por plan_destino en la lista registrada.
5. **Servicios no utilizados** — `academicaApi.createMateria`, `updateMateria`, `deleteMateria`, `createCorrelatividad`, `deleteCorrelatividad` definidos en `services.ts` pero no usados (las páginas llaman `apiClient` directamente).

## Proximas tareas lógicas

### 1. UI de Correlatividades
- Agregar sección dentro del modal de Materia (o página separada)
- Listar correlativas actuales via `GET /materias/{id}/correlativas/`
- Agregar nueva correlativa: seleccionar materia + tipo (cursar/cursado/aprobar/aprobacion/regular)
- Eliminar correlativa via `DELETE /correlatividades/{id}/`
- Permisos: solo `EsDirectorCarrera`

### 2. Seed data disponible
- `backend/seed_all.py` — carga Plan 2019 (46 materias), Plan 2026 (30 oblig + 5 opt = 35 materias, Título Intermedio), 20 correlatividades (Ordenanza 12/2025-CD), 27 equivalencias (21 1:1 + 6 N:1)
- Para recargar: `docker compose cp seed_all.py backend:/app/ && docker compose exec backend python /app/seed_all.py`

### 3. Plan 2026 — Códigos
| Año | Período | Códigos |
|-----|---------|---------|
| 1 (Bimestres/Cuat) | 1er/2do/3er Bim, 2do Cuat | 510201–510207 |
| 2 (Cuatrimestres) | 1er/2do Cuat | 520201–520209 |
| 3 (Cuatrimestres) | 1er/2do Cuat | 530201–530207 |
| 4 (Cuatrimestres) | 1er/2do Cuat | 540201–540207 |
| Optativas | — | 570201–570205 |

### 4. Correlatividades Plan 2026 — Reglas de promoción
Para cursar materias de segundo año → aprobar 4 espacios de 1er año.
Para cursar tercer año → 100% 1er año aprobado + 4 espacios de 2do año.
Para cursar cuarto año → 100% hasta 2do año aprobado + 4 espacios de 3er año.

**Correlativas complejas:** `540207 Práctica Profesional` ← `530203 + 530205 + 530206 + 540201` (séxtuple). `540202 Control Estratégico` ← `530204 + 520208` (doble).

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

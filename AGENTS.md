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
│   │   ├── urls.py           # Rutas raíz (admin, api/auth/, api/ academica + equivalencias + docentes, accounts/)
│   │   ├── celery.py         # Placeholder (vacio)
│   │   └── apps/
│   │       ├── academica/    # Facultades, Sedes, Carreras, Planes, Materias, Correlatividades, TipoMateria, Area
│   │       ├── usuarios/     # Auth, Profile, AllowedDomain, Google OAuth
│   │       ├── equivalencias/# Equivalencias entre materias + motor de resolución en cascada
│   │       ├── docentes/     # Docentes (CRUD completo con CUIT/CUIL, legajo)
│   │       └── nomenclador/  # Disciplinas, Subdisciplinas, Especialidades (jer. 3 niveles)
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
├── docker-compose.podman.yml # Podman variant (frontend on 8080)
├── Makefile
├── spec.json                 # Especificación completa del proyecto (ligeramente desactualizada)
└── .env.example
```

## Enlaces rápidos

- **Frontend páginas SACAD**: `frontend/src/pages/SACAD/`
- **Backend docentes models**: `backend/sacad/apps/docentes/models.py`
- **Backend docentes serializers**: `backend/sacad/apps/docentes/serializers.py`
- **Backend docentes views**: `backend/sacad/apps/docentes/views.py`
- **Backend academica models**: `backend/sacad/apps/academica/models.py`
- **Backend academica serializers**: `backend/sacad/apps/academica/serializers.py`
- **Backend academica views**: `backend/sacad/apps/academica/views.py`
- **Backend permissions**: `backend/sacad/apps/academica/permissions.py`
- **Backend usuarios permissions (tiene_permiso_menu)**: `backend/sacad/apps/usuarios/permissions.py`
- **Backend filtros**: `backend/sacad/apps/academica/filters.py`
- **Backend usuarios views**: `backend/sacad/apps/usuarios/views.py`
- **Backend usuarios adapter (Google OAuth)**: `backend/sacad/apps/usuarios/adapters.py`
- **Backend equivalencias engine**: `backend/sacad/apps/equivalencias/engine.py`
- **Backend nomenclador views**: `backend/sacad/apps/nomenclador/views.py`
- **Backend nomenclador urls**: `backend/sacad/apps/nomenclador/urls.py`
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
| `Area` | plan_estudio (FK), nombre, orden | unique_together: (plan_estudio, nombre). Creado DESPUÉS de TipoMateria en models.py |
| `Materia` | plan_estudio (FK), codigo, nombre, año, cuatrimestre (1/2/anual), creditos, periodo, carga_horaria_semanal (null=True), carga_horaria_total, tipo (FK->TipoMateria, null=True), area (FK->Area, SET_NULL), contenidos_minimos | unique_together: (plan_estudio, codigo) |
| `Correlatividad` | materia (FK), materia_requerida (FK), tipo (cursar/cursado/aprobar/aprobacion/regular) | unique_together: (materia, materia_requerida, tipo). Valida mismo plan_estudio |

### docentes

| Modelo | Campos clave | Relaciones |
|--------|-------------|------------|
| `Docente` | apellido, nombre, dni (unique), cuit_cuil (unique, null=True), legajo, legajo_en_tramite, email, telefono, facultad (FK->Facultad), activo | — |
| `Cargo` | codigo (unique), descripcion, activo | — |
| `Dedicacion` | codigo (unique), descripcion, activo | — |
| `Caracter` | codigo (unique), descripcion, requiere_fecha (ninguna/inicio/fin/ambas), activo | — |
| `CargoDocente` | docente (FK), materia (FK), cargo (FK), dedicacion (FK), caracter (FK), fecha_inicio (null), fecha_fin (null), activo (default=True) | FK a Docente, Materia, Cargo, Dedicacion, Caracter. `save()` setea activo=False si fecha_fin pasó |

### usuarios

| Modelo | Campos clave |
|--------|-------------|
| `Profile` | user (OneToOne), foto, approval_status (pending/approved/rejected), approved_at, rejected_at, zoom_level (50-200) |
| `AllowedDomain` | domain (unique), created_at |
| `GroupMenuPermission` | group (FK->Group), menu_key (str), can_read, can_write | unique_together: (group, menu_key). 14 menús definidos en `GroupMenuPermission.MENU_KEYS`. |

### nomenclador

| Modelo | Campos clave | Relaciones |
|--------|-------------|------------|
| `Disciplina` | codigo (unique), nombre, descripcion | — |
| `Subdisciplina` | codigo (unique), nombre, descripcion, disciplina (FK) | FK → Disciplina |
| `Especialidad` | codigo (unique), nombre, descripcion, subdisciplina (FK) | FK → Subdisciplina |

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
| `/users/` | GET | Staff / configuracion.usuarios read | Lista usuarios |
| `/users/<id>/groups/` | PATCH | Staff / configuracion.usuarios write | Asignar grupos |
| `/pending-users/` | GET | Staff / configuracion.usuarios read | Usuarios pendientes |
| `/approve-user/<id>/` | PATCH | Staff / configuracion.usuarios write | Aprobar (asigna primer grupo disponible) |
| `/reject-user/<id>/` | PATCH | Staff / configuracion.usuarios write | Rechazar |
| `/deactivate-user/<id>/` | PATCH | Staff / configuracion.usuarios write | Desactivar usuario |
| `/allowed-domains/` | GET/POST | Staff / configuracion.dominios read/write | CRUD dominios |
| `/allowed-domains/<id>/` | DELETE | Staff / configuracion.dominios write | Eliminar dominio |
| `/groups/` | GET/POST | Staff / configuracion.roles read/write | Lista / crear grupos |
| `/groups/rename/` | PATCH | Staff / configuracion.roles write | Renombrar grupo |
| `/groups/<id>/` | DELETE | Staff / configuracion.roles write | Eliminar grupo |
| `/groups/<id>/permissions/` | GET/PUT | Staff / configuracion.roles read/write | Permisos de menú del grupo |
| `/groups/me/permissions/` | GET | Auth | Permisos del usuario actual |
| `/groups/permissions/` | GET | Staff / configuracion.roles read | Todos los grupos con permisos |

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
| `/areas/` | AreaViewSet | Auth | Secretario Académico |
| `/dashboard/stats/` | Function GET | Auth | — |
| `/docentes/` | DocenteViewSet | Auth (via menu_key "docentes" read) | Auth (via menu_key "docentes" write) |
| `/cargos-docentes/` | CargoDocenteViewSet | Auth (via menu_key "docentes" read) | Auth (via menu_key "docentes" write) |
| `/cargos/` | CargoViewSet | Auth (via menu_key "configuracion.designaciones" read) | Auth (via menu_key "configuracion.designaciones" write) |
| `/dedicaciones/` | DedicacionViewSet | Auth (via menu_key "configuracion.designaciones" read) | Auth (via menu_key "configuracion.designaciones" write) |
| `/caracteres/` | CaracterViewSet | Auth (via menu_key "configuracion.designaciones" read) | Auth (via menu_key "configuracion.designaciones" write) |

### Equivalencias (`/api/`)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/equivalencias/` | GET/POST | CRUD |
| `/equivalencias/<id>/` | PUT/DELETE | CRUD |
| `/equivalencias/consultar/` | GET | Resolución en cascada (BFS) |
| `/equivalencias/validar/` | POST | Validar ciclos |

### Nomenclador (`/api/`)
| Endpoint | ViewSet | Permiso |
|----------|---------|---------|
| `/entradas/` | Function GET/POST | configuracion.nomenclador read/write. GET: solo nodos hoja. POST: crea jerarquía. |
| `/disciplinas/` | DisciplinaViewSet | configuracion.nomenclador read/write |
| `/subdisciplinas/` | SubdisciplinaViewSet | configuracion.nomenclador read/write |
| `/especialidades/` | EspecialidadViewSet | configuracion.nomenclador read/write |

## Backend — Permisos

| Clase | Lógica | Aplica a |
|-------|--------|----------|
| `EsAdminUniversidad` | `is_superuser OR tiene_permiso_menu(user, "facultades", require_write=True)` | Facultad write |
| `EsSecretarioAcademico` | `is_superuser OR tiene_permiso_menu(user, "sedes"/"carreras"/etc, require_write=True)` | Sede, Carrera, Plan, TipoMateria, Area write |
| `EsDirectorCarrera` | `is_superuser OR tiene_permiso_menu(user, "materias", require_write=True)` | Materia, Correlatividad write |
| `DocenteViewSet` | `is_superuser OR tiene_permiso_menu(user, "docentes", require_write=True)` para write; `tiene_permiso_menu(user, "docentes", require_read=True)` para read | Docentes CRUD |
| Nomenclador views | `tiene_permiso_menu(user, "configuracion.nomenclador", require_read/write)` | Disciplina, Subdisciplina, Especialidad CRUD |

No hay hardcoding de nombres de grupo (`"Admin Universidad"`, `"Secretario Académico"`, `"Director Carrera"`) en ninguna permission class. Todo pasa por `GroupMenuPermission`.

Las vistas de `usuarios/views.py` (groups, roles, dominios, usuarios) verifican `is_staff OR tiene_permiso_menu(user, menu_key, require_write)` en lugar de solo `is_staff`. El helper `tiene_permiso_menu()` está en `usuarios/permissions.py`.

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
| AreaViewSet | AreaSerializer (con plan_estudio_codigo, materias_count) | AreaSerializer |
| EquivalenciaViewSet | EquivalenciaSerializer (único) | EquivalenciaSerializer |
| DocenteViewSet | DocenteSerializer (único) | DocenteSerializer |
| CargoDocenteViewSet | CargoDocenteSerializer (con nested display fields) | CargoDocenteSerializer |
| CargoViewSet | CargoSerializer (único) | CargoSerializer |
| DedicacionViewSet | DedicacionSerializer (único) | DedicacionSerializer |
| CaracterViewSet | CaracterSerializer (único) | CaracterSerializer |
| DisciplinaViewSet | DisciplinaSerializer | DisciplinaSerializer |
| SubdisciplinaViewSet | SubdisciplinaSerializer | SubdisciplinaSerializer |
| EspecialidadViewSet | EspecialidadSerializer | EspecialidadSerializer |

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
| DocenteViewSet | — | SearchFields: apellido, nombre, dni. Filtro GET `?activo=true/false`. |
| CargoDocenteViewSet | — | SearchFields: docente__apellido, docente__nombre, materia__nombre, materia__codigo |

## Frontend — Páginas y estado

### ✅ CRUD completo
| Página | Archivo | Ruta |
|--------|---------|------|
| Dashboard | `pages/SACAD/SACADDashboard.tsx` | `/` |
| Facultades | `pages/SACAD/FacultadesPage.tsx` | `/facultades` |
| Sedes | `pages/SACAD/SedesPage.tsx` | `/sedes` |
| Carreras | `pages/SACAD/CarrerasPage.tsx` | `/carreras` |
| Planes de Estudio | `pages/SACAD/PlanesPage.tsx` | `/planes` |
| Áreas | `pages/SACAD/AreasPage.tsx` | `/areas` |
| Materias | `pages/SACAD/MateriasPage.tsx` | `/materias` |
| Docentes | `pages/SACAD/DocentesPage.tsx` | `/docentes` |
| Equivalencias | `pages/SACAD/EquivalenciasPage.tsx` | `/equivalencias` |
| Tipos de Materia | `pages/SACAD/GestionTiposMateriaPage.tsx` | `/configuracion/tipos-materia` |
| Dominios permitidos | `pages/SACAD/GestionDominiosPage.tsx` | `/configuracion/dominios` |
| Roles de usuarios | `pages/SACAD/GestionRolesPage.tsx` | `/configuracion/roles` |
| Perfil | `pages/SACAD/ProfilePage.tsx` | `/profile` |
| Cargos de Personas | `pages/SACAD/CargosPersonasPage.tsx` | `/cargos-personas` |
| Designaciones | `pages/SACAD/GestionDesignacionesPage.tsx` | `/configuracion/designaciones` |
| Nomenclador | `pages/SACAD/GestionNomencladorPage.tsx` | `/configuracion/nomenclador` |

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
- **Páginas CRUD** llaman `apiClient` directamente para POST/PUT/DELETE (NO usan `academicaApi` desde services.ts)
- **Permisos**: hook `useMenuPermissions()` expone `canRead(menuKey)` y `canWrite(menuKey)` basado en `GET /auth/groups/me/permissions/`

## Frontend — Auth Flow

1. **Google OAuth**: Click → `/accounts/google/login/` → Google → callback `/api/auth/google/complete/` → redirect a frontend `/auth/callback?access=X&refresh=Y`
2. **Email**: POST `/auth/login/` con email+password → JWT
3. **Tokens**: `sessionStorage` (se borran al cerrar browser)
4. **Nuevos usuarios Google**: Se crean con `is_active=False`, redirect a `/auth/pending`
5. **Aprobación**: Staff → PATCH `/auth/approve-user/<id>/` → asigna el primer grupo disponible (`Group.objects.first()`) si el usuario no tiene grupos.
6. **Bloqueo sin grupo**: Si el usuario está aprobado pero no tiene grupos → `UserSerializer.needs_group=True` → `ProtectedRoute` lo redirige a `/auth/pending?reason=group` con mensaje "Sin grupo asignado". No puede entrar al sistema hasta que un admin le asigne un grupo.

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
- **CRUD pattern**:
  - Modal para create/edit: `<Modal isOpen={modal.isOpen} onClose={closeModal} className="max-w-[500px] m-4">`
  - Título + descripción en el header del modal
  - Campos de formulario con `<label>` + `<input>` + mensaje de error
  - Botones Cancelar + "Crear X" / "Guardar cambios" al fondo (flex justify-end)
  - Modal independiente para delete confirmation (pregunta + botones "Eliminar" / "Cancelar")
- **Permisos condicionales**: `canWrite = user?.is_superuser || canWriteMenu("menuKey")` donde `canWriteMenu` viene de `useMenuPermissions()`
- **Manejo de errores**: Catch axios error → try `err.response.data` key mapping a `FieldErrors`; si no tiene estructura de campos, mostrar `err.response?.data?.detail || err.message` como error general del formulario.
- **Modal crece con `max-w-[90vw]`** en lugar de `!w-[90vw]` para cascada correcta
- **Búsqueda de FK en modales**: dropdown con `useRef` + `handleClickOutside` + filtro local
- **Grid en modales anchos**: para modales de 90vw, usar `grid grid-cols-4 gap-4` con `col-span-2` para campos largos (ej: facultad). Dentro del grid, inputs pueden ir en filas de 4 campos (apellido, nombre, dni, cuit_cuil en una misma fila).
- **Delete handler**: `handleDelete` debe mostrar `err.response.data.detail` si existe, sino mensaje hardcodeado genérico.

## Backend — Convenciones de código

- **ViewSets**: `ModelViewSet` con `get_serializer_class()` para list vs detail (cuando aplica). Cada ViewSet define sus propios permisos y filtros.
- **Permissions**: `get_permissions()` method que retorna distintas clases por acción, o chequea `tiene_permiso_menu()` directamente dentro del ViewSet con método propio (usando `request.user` y `self.action`).
- **Protected delete**: NO se usa `raise ProtectedError(msg, queryset)`. En su lugar, se captura `IntegrityError` o se verifica manualmente y se retorna `Response({"detail": msg}, 409)`.
- **Serializers**: List serializers separados con counts via `SerializerMethodField` (cuando hay diferencia entre list y detail).
- **Filtros**: `django-filters` FilterSets con `DjangoFilterBackend` o SearchFilter + ordering.
- **CUIT/CUIL**: validación con regex `^\d{2}-\d{8}-\d{1}$` en serializer (DRF `RegexValidator`). Campo `null=True` para permitir múltiples vacíos con `unique=True`.
- **Voseo**: Todos los mensajes de error usan "vos" (ej: "Completá", "seleccioná", "tenés"). No usar "tú" ni "usted".
- **No necesitás makemigrations manual**: el entrypoint del container ya ejecuta `makemigrations --noinput` al arrancar. Si hay cambios en models.py, se generan automáticamente. En desarrollo local, `makemigrations` solo se corre si se quiere trackear migraciones.
- **Importante backend**: el código fuente del backend se copia dentro de la imagen Docker. NO hay bind mount cached. Para que un cambio en backend surta efecto, hay que hacer `docker compose build backend && docker compose up -d backend`. No alcanza con restart.
- **No hay seed data**: los seeders fueron eliminados. Para probar hay que cargar datos manualmente desde el frontend o restaurar el backup con `loaddata`.
- **seed*.py están gitignored**: cualquier archivo que coincida con `seed*.py` bajo `management/commands/` no se trackea.

## Frontend — Gaps conocidos

1. **No hay UI de correlatividades** — Mayor gap. No hay forma de gestionar correlatividades (crear/eliminar prerrequisitos). Backend soporta CRUD completo.
2. ~~**EquivalenciasPage** — Botones create/edit/delete visibles a todos los usuarios autenticados (falta `canWrite`).~~ ✅ Ahora con `canWrite`.
3. ~~**Nomenclador** — Tabla plana con búsqueda unificada, uppercase, padStart.~~ ✅ Implementado.
4. **MateriasPage** — No hay filtro por plan_estudio (el backend lo soporta).
5. **EquivalenciasPage** — No hay filtro por plan_destino en la lista registrada.
6. **Servicios no utilizados** — `academicaApi.createMateria`, `updateMateria`, `deleteMateria`, `createCorrelatividad`, `deleteCorrelatividad` definidos en `services.ts` pero no usados (las páginas llaman `apiClient` directamente).

## Frontend — Cambios recientes (histórico para agentes)

- **Area model** creado con FK plan_estudio, fields nombre + orden, unique_together (plan_estudio, nombre). Agregado después de TipoMateria en models.py. Materia.area FK SET_NULL.
- **Migrations 0001-0004** creadas y aplicadas: 0001 inicial, 0002 tipomateria, 0003 area_materia_area, 0004 remove_idx.
- **AreaAdmin** registrado en admin.py.
- **AreaSerializer** con plan_estudio_codigo + materias_count como read-only (SerializerMethodField y Source).
- **AreaViewSet** en views.py: full CRUD, filtro por plan_estudio (django-filters `AreaFilter`), delete chequea materias_count.
- **URLs**: router `registrar_router(r"areas", AreaViewSet)` en urls.py.
- **EquivalenciasDisplaySerializer**: materias_origen_display y materias_destino_display ahora devuelven `plan_estudio` (id) y `plan_estudio_codigo` (string) además de id, codigo, nombre.
- **EquivalenciasPage**: formato de línea única: `origen1, origen2 (plan) >> destino (plan)`. Badge `Total`/`Parcial` con colores.
- **Delete en views.py**: TODOS los `destroy()` fueron limpiados — se eliminó `raise ProtectedError(msg, queryset)` (que devolvía una tupla fea como mensaje). Ahora retornan `Response({"detail": mensaje}, 409)`. Afecta a Facultad, Sede, Carrera, PlanEstudio, Materia, TipoMateria, Area.
- **MateriasPage handleDelete**: antes hardcodeaba "No se puede..." ahora lee `err.response.data.detail`.
- **Modal width fix**: MateriasPage dejó de usar `isFullscreen` + `!w-[90vw]`. Ahora usa `max-w-[90vw]` en className y `w-full` de contentClasses se limita naturalmente.
- **Button placement fix**: MateriasPage movió submit a la par de Cancelar abajo del modal. Grid cambió de `grid-cols-3` a `grid-cols-2`.
- **seed_data command**: `backend/sacad/apps/academica/management/commands/seed_data.py`. Idempotente (get_or_create). Carga superuser, facultad, sedes, carrera, título intermedio, plan 2026, tipo materia, 8 áreas, 35 materias. Forzado en git con `git add -f`.
- **AreasPage**: convertida de formulario inline a `<Modal>`, siguiendo el mismo patrón de PlanesPage (useModal, closeModal que resetea estado, botones al fondo).
- **Sidebar**: agregado "Áreas" entre "Planes de Estudio" y "Materias". Ruta `/areas` en App.tsx entre `/planes` y `/materias`.
- **GroupMenuPermission model**: modelo `GroupMenuPermission` con group (FK), menu_key (str con choices de 13 menús iniciales), can_read, can_write. unique_together (group, menu_key). Migración 0002.
- **Backend permisos por menú**: todas las vistas de `usuarios/views.py` ahora verifican `tiene_permiso_menu()` (en `usuarios/permissions.py`) además de `is_staff`. Las permission classes de `academica/permissions.py` (`EsAdminUniversidad`, `EsSecretarioAcademico`, `EsDirectorCarrera`) también verifican `GroupMenuPermission`.
- **EquivalenciaViewSet**: protegido para escritura con `tiene_permiso_menu("equivalencias", require_write=True)`.
- **Frontend useMenuPermissions hook**: hook que expone `canRead(key)` y `canWrite(key)` desde `GET /auth/groups/me/permissions/`.
- **Frontend AppSidebar**: filtrado por `canRead()` — solo muestra menús con permiso de lectura (o escritura, que implica lectura).
- **Frontend pages**: las 11 páginas CRUD actualizadas para combinar `user?.group_names` con `canWriteMenu("menuKey")` en su lógica de `canWrite`.
- **UserDropdown**: simplificado a solo "Mi Perfil" y "Cerrar Sesión".
- **Refactor permisos**: eliminado todo hardcoding de nombres de grupo en backend (`academica/permissions.py`) y frontend (todas las pages). `canWrite` ahora solo usa `user?.is_superuser || canWriteMenu("key")`, sin `user?.group_names?.includes(...)`.
- **`tiene_permiso_menu()`**: si el usuario no tiene grupos → `False`. Si sus grupos no tienen ningún permiso activo → `True` (unrestricted). Si tienen permisos activos → chequea clave específica.
- **`my_menu_permissions()`**: `configured` es per‑user. Sin grupos → `{"permissions": {}, "configured": true}`. Grupos sin permisos activos → `{"permissions": {}, "configured": false}`.
- **`useMenuPermissions()`**: `canRead` y `canWrite` envueltas en `useCallback` con `[configured, perms]` para evitar referencias inestables. Polling cada 30s via `setInterval(refetch, 30000)`.
- **Bug sidebar submenu**: el `useEffect` que auto‑cerraba submenús dependía de `[location, isActive, visibleNavItems]`. Como `visibleNavItems` cambia de referencia en cada render (por `useCallback` de `canRead`), el efecto se disparaba siempre y cerraba el submenu recién abierto. Fix: depender solo de `[location.pathname, isActive]` e iterar `navItems` en vez de `visibleNavItems`.
- **`needs_group`**: campo en `UserSerializer`. Si el usuario no es superuser y no tiene grupos → `needs_group=True`. `ProtectedRoute` redirige a `/auth/pending?reason=group`. `AuthPending` muestra mensaje distinto según `reason`.
- **`createuser` command**: `python manage.py createuser email@ejemplo.com --password x` crea superadmin + Profile APPROVED. No crea grupos.
- **Modelo Materia**: `carga_horaria_semanal` → `null=True, blank=True`, `tipo` → `null=True, blank=True`. Migración `0005`.
- **`approve_user()`**: eliminada referencia a "Director Carrera". Asigna primer grupo disponible.
- **Pipeline CI/CD**: usa `docker compose down --remove-orphans` en vez de `docker rm -f`.
- **GestionRolesPage**: eliminado `GROUP_COLORS` hardcodeado y placeholder "Secretario Académico".
- **Docentes app**: app `sacad.apps.docentes` creada con modelo `Docente` (apellido, nombre, dni unique, cuit_cuil unique+nullable, legajo, legajo_en_tramite, email, telefono, facultad FK, activo). DocenteSerializer, DocenteViewSet, DocenteAdmin. URL `/api/docentes/`. Sidebar: categoría "Docentes" con sub-item "Ver Docentes". Ruta `/docentes`.
- **DocentesPage**: CRUD completo con tabla responsive, modal 90vw con grid 4-columnas, búsqueda de facultad vía dropdown con click-outside, confirmación de eliminación.
- **Error handling DocentesPage**: muestra errores de campo (cada input con su mensaje rojo) y errores generales (non-field, connection) en un banner al inicio del formulario.
- **cuit_cuil nullable**: `null=True` agregado a `cuit_cuil` en Docente model para evitar colisión de `unique` con strings vacías. Migración `0002_alter_docente_cuit_cuil`.
- **Menu keys**: agregado `("docentes", "Docentes")` a `GroupMenuPermission.MENU_KEYS` (ahora 14 opciones). Migración `0003_alter_groupmenupermission_menu_key` en usuarios.
- **Podman support**: `docker-compose.podman.yml` con frontend en puerto 8080 (podman rootless no puede bind < 1024). `FRONTEND_URL` default `http://localhost:8080`. Makefile targets `podman-up` / `podman-down`.
- **Backend container rebuild note**: el código backend está baked en la imagen Docker (no hay bind mount cached). Para cambios en backend, siempre: `docker compose build backend && docker compose up -d backend`. Los cambios en models.py generan migraciones automáticas por el entrypoint.
- **CargoDocente model**: modelo `CargoDocente` creado con FK a Docente, Materia, Cargo, Dedicación, Carácter + fechas. Serializer con nested display fields. ViewSet con select_related y permisos docentes. URL `/api/cargos-docentes/`. Migración 0005.
- **CargosPersonasPage**: página CRUD completa con modal 90vw, desplegables buscables para docente y materia (input + dropdown + filtro inline + click-outside), selects cascada, fechas condicionales según `caracter.requiere_fecha`. Ruta `/cargos-personas`, sidebar subítem "Docentes > Cargos".
- **CargoDocente.activo**: campo `activo` agregado a CargoDocente (BooleanField default=True). `save()` override que setea `activo=False` si `fecha_fin` está en el pasado. Migración 0006.
- **desactivar_cargos_vencidos command**: management command `desactivar_cargos_vencidos` que desactiva cargos con `fecha_fin < today`. Corre a demanda.
- **Toggle switch activo**: CargosPersonasPage ahora tiene Switch "Cargo activo" en el modal + columna "Activo" en tabla con badge verde/rojo.
- **Columna Vigencia**: tabla de cargos muestra fechas inicio/fin con formato `dd.mm.aaaa` en columna "Vigencia".
- **formatDate utility**: creado `frontend/src/utils/dateFormat.ts` con función `formatDate(dateStr)` que retorna `dd.mm.yyyy`. Usado en CargosPersonasPage, GestionDominiosPage y AutorizacionUsuariosPage.
- **DocenteViewSet.destroy()**: agregado `destroy()` que impide eliminar Docente si tiene CargoDocente asociado (retorna 409 con detail). Verifica manualmente antes de borrar.
- **SedeViewSet.destroy()**: agregado check de `cargos_docentes` que impide eliminar Sede si hay CargoDocente vinculado (retorna 409).
- **Nomenclador endpoint plano `/api/entradas/`**: creado `entradas_nomenclador` view function que lista (GET, solo nodos hoja) y crea (POST) entradas de nomenclador en formato plano. Helper `_serializar_entrada()`. Ruta registrada en `nomenclador/urls.py`.
- **GestionNomencladorPage rediseñada**: tabla plana sin columna Tipo, formulario inline con 3 inputs de código (2 chars c/u, padStart onBlur), input de nombre en uppercase (onChange .toUpperCase()), búsqueda unificada sin filtros por nivel, DELETE corregido a `/${tipo}/${pk}/`.
- **Materias ordering**: `ordering = ["codigo", "plan_estudio__carrera__codigo", "nombre"]` en MateriaViewSet.
- **Materias paginación**: agregado estado `page`, llamado paginado a la API, UI con Anterior/Siguiente y contador de registros en MateriasPage.tsx. Se resetea a página 1 al cambiar búsqueda.
- **CSS minify warning fix**: deshabilitado `build.cssMinify` en `vite.config.ts` para eliminar warnings de `:is()` vacío generados por Tailwind v4.
- **Backup dumpdata**: creado `backups/sacad_data.json` (75 registros, excluye contenttypes/auth.Permission/admin.LogEntry/sessions) y copiado a `/tmp/sacad_data.json` en el container.

## Próximas tareas lógicas

### 1. UI de Correlatividades
- Agregar sección dentro del modal de Materia (o página separada)
- Listar correlativas actuales via `GET /materias/{id}/correlativas/`
- Agregar nueva correlativa: seleccionar materia + tipo (cursar/cursado/aprobar/aprobacion/regular)
- Eliminar correlativa via `DELETE /correlatividades/{id}/`
- Permisos: solo `EsDirectorCarrera` (via GroupMenuPermission "materias")

### 2. Backup de datos cargados
- Existe `backups/sacad_data.json` (75 registros) con datos reales cargados desde el frontend.
- Para restaurar: `docker compose exec backend python manage.py loaddata /tmp/sacad_data.json`.
- La copia en /tmp/ del container es la más reciente.

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

### 5. Verificar permisos en producción
- victor.costa@fce.uncu.edu.ar tiene `is_staff=False`, grupo "administrador", `can_write=True` en todos los menús.
- Verificar que pueda crear/editar/eliminar en todos los módulos (facultades, sedes, carreras, planes, áreas, materias, docentes, equivalencias, tipos-materia, dominios, roles, usuarios).
- Verificar que un usuario sin permisos no pueda escribir ni vea menús restringidos.

### 6. Verificar permisos en producción
- victor.costa@fce.uncu.edu.ar tiene `is_staff=False`, grupo "administrador", `can_write=True` en todos los menús.
- Verificar que pueda crear/editar/eliminar en todos los módulos (facultades, sedes, carreras, planes, áreas, materias, docentes, equivalencias, tipos-materia, dominios, roles, usuarios).
- Verificar que un usuario sin permisos no pueda escribir ni vea menús restringidos.

### 7. MateriasPage — filtro por plan de estudio
- El backend ya soporta filtro `?plan_estudio=X` via `MateriaFilter`
- El frontend no expone este filtro en la UI

### 8. Docentes — próximas mejoras posibles
- Flat sidebar: eliminar categoría "Docentes" con sub-item, poner "Docentes" directamente en nav principal
- Filtro adicional por facultad en DocentesPage
- Exportar lista de docentes a CSV/Excel
- Vista detalle de docente con materias que dicta

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

# Inicialización y carga de datos de prueba (Seed Data)
docker compose exec backend python manage.py crear_admin
docker compose exec backend python manage.py poblar_demo
docker compose exec backend python manage.py cargar_planes_2026

# Reconstruir backend tras cambios en código Python
docker compose build backend && docker compose up -d backend

# Reconstruir frontend tras cambios
docker compose build frontend && docker compose up -d frontend

# Podman (alternativa a Docker Desktop)
make podman-up
make podman-down

# Shell de Django
docker compose exec backend python manage.py shell

# Backup / Restore
docker compose exec backend python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission -e admin.LogEntry -e sessions > backups/sacad_data.json
docker compose cp backups/sacad_data.json backend:/tmp/sacad_data.json
docker compose exec backend python manage.py loaddata /tmp/sacad_data.json
```

## Workflow de cambios en la base de datos

Cada vez que se modifique el modelo de datos (nuevos campos, tablas, relaciones), **siempre** seguir este orden para no perder datos:

```bash
# 1. RESPALDAR datos actuales
./scripts/backup.sh

# 2. APLICAR cambios de estructura
#    - Editar models.py
#    - (Opcional) docker compose build backend
#    - docker compose exec backend python manage.py makemigrations
#    - docker compose exec backend python manage.py migrate

# 3. VERIFICAR que los datos siguen intactos
#    - Navegar por el frontend o consultar la API
```

**Nunca hacer flush antes de migrar.** Las migraciones de Django están diseñadas para transformar la estructura sin tocar los datos existentes. El orden correcto es:

1. Backup
2. Migrar (makemigrations + migrate)
3. Verificar

Si una migración falla por conflictos de datos (ej: campo NOT NULL sin default en tabla con registros):
- Agregar `null=True` temporalmente
- Migrar
- Poblar el campo desde shell/manage.py
- Hacer segunda migración con `null=False`

**Solo hacer flush cuando se quiera empezar de cero explícitamente** (nunca como paso de una actualización).

**Nota sobre migraciones generadas por entrypoint:** el entrypoint del container ejecuta `makemigrations` automáticamente. Si se genera una migración nueva (ej: `0003_alter_*`) y no está trackeada en git, el container igual funciona pero al hacer `git pull` en otro lado habrá que regenerar o copiar esa migración. Después de cada cambio en models.py, copiar las migraciones del container al host o commitearlas.

## Notas para agentes futuros

1. **Voseo obligatorio**: todos los mensajes de error del backend y del frontend deben usar "vos". Ej: "Completá los datos", "Seleccioná un plan", "No tenés permiso". NO usar "tú", "usted", "complete", "seleccione".
2. **Equivalencias engine**: BFS con `issubset()` para N:1. Soporta 1:1, 1:N, N:1. No soporta cascada multi-hop (solo single-hop, la BFS se usa para encontrar caminos, no para transitividad múltiple de equivalencias).
3. **No usar ProtectedError**: en ningún view. Siempre `Response({"detail": mensaje}, 409)`.
4. **Modal pattern**: `max-w-[...]` en className (no `!w-[...]`), contentClasses tiene `w-full` fijo. Los botones de formulario siempre van al fondo (flex justify-end), nunca en medio de los campos.
5. **Seed scripts gitignored**: cualquier archivo que coincida con `seed*.py` bajo `management/commands/` está en `.gitignore`. El comando `seed_data.py` fue eliminado del repositorio.
6. **DB actualmente con datos**: hay un backup en `backups/sacad_data.json` con 75 registros (facultades, sedes, carreras, planes, materias, áreas, nomenclador, usuarios, grupos, permisos). Restaurar con `loaddata` si la DB está vacía.
7. **Permisos por menú**: los grupos ahora tienen `GroupMenuPermission` con permisos de lectura/escritura por menú. La lógica de autorización backend para vistas normales es: `is_staff OR tiene_permiso_menu()`. Para ViewSets de académica: `superuser OR GroupMenuPermission` (sin hardcoding de nombres de grupo). En frontend: `useMenuPermissions().canWrite("menuKey")` combinado con `user?.is_superuser`.
8. **UserDropdown**: solo muestra "Mi Perfil" y "Cerrar Sesión". No hay notificaciones reales implementadas.
9. **canWrite en frontend**: ahora solo usa `user?.is_superuser || canWriteMenu("menuKey")`. Sin `user?.group_names?.includes(...)`. El hook `useMenuPermissions` usa `useCallback` para `canRead`/`canWrite` con dependencias `[configured, perms]` para evitar referencias inestables. Tiene polling cada 30s via `setInterval(refetch, 30000)`.
10. **Bug sidebar submenu**: el `useEffect` que auto‑abre/cierra submenús según la ruta actual NO debe depender de `visibleNavItems` (cambia en cada render). Usar `navItems` estático y depender solo de `[location.pathname, isActive]`.
11. **`needs_group`**: `UserSerializer` incluye campo `needs_group=True` si el usuario no es superuser y no tiene grupos. `ProtectedRoute` redirige a `/auth/pending?reason=group`. El usuario no puede ingresar hasta tener grupo.
12. **`createuser` command**: `python manage.py createuser email@ejemplo.com --password x` crea superadmin + Profile APPROVED. No crea grupos ni permisos.
13. **Materia**: `carga_horaria_semanal` y `tipo` son `null=True, blank=True` desde migración 0005.
14. **Docente.cuit_cuil**: tiene `null=True` además de `unique=True`. Esto permite que múltiples docentes tengan CUIT/CUIL vacío sin violar la restricción unique (Django no compara NULLs).
15. **Grupos de menú**: hoy son 16 menús: dashboard, facultades, sedes, carreras, planes, areas, materias, docentes, equivalencias, configuracion, configuracion.usuarios, configuracion.dominios, configuracion.roles, configuracion.tipos-materia, configuracion.designaciones, configuracion.nomenclador.
16. **Backend rebuild**: el código fuente del backend está baked en la imagen Docker (no hay bind mount cached). `docker compose restart backend` NO toma cambios de código. Siempre usar `docker compose build backend && docker compose up -d backend`.
17. **DocentesPage CRUD pattern**: modal 90vw con grid `grid-cols-4`. Facultad ocupa `col-span-2` (selector con dropdown búscable). Luego fila de 4: apellido, nombre, dni, cuit_cuil (con guiones automáticos). Luego fila incompleta: legajo+checkbox, email, telefono. Switch activo/inactivo al fondo. Errores de API se muestran tanto por campo como en un banner general. Errores de conexión se muestran como banner "Error de conexión".
18. **Menu keys migration**: al agregar un nuevo menu_key a `GroupMenuPermission.MENU_KEYS`, el entrypoint genera una migración `AlterField(choices=...)`. Esta migución debe ser copiada del container al host y commiteada. Si no se commitea, en otro entorno se regenerará automáticamente.
19. **CargoDocente.activo**: modelo CargoDocente tiene campo `activo` (BooleanField default=True). Se desactiva automáticamente en `save()` si `fecha_fin < date.today()`. El management command `desactivar_cargos_vencidos` hace la limpieza batch a demanda.
20. **formatDate utility**: `frontend/src/utils/dateFormat.ts` exporta `formatDate(dateStr: string | null): string` que convierte fechas ISO a formato `dd.mm.yyyy`. Usar en todos los displays de fecha. No cambiar el formato de intercambio de la API (sigue siendo ISO 8601 YYYY-MM-DD).
21. **CargosPersonasPage pattern**: modal 90vw, grid `grid-cols-2` para persona+materia (desplegables con búsqueda inline + click-outside), grid `grid-cols-3` para cargo+dedicación+carácter (selects), fechas condicionales según `caracter.requiere_fecha`. Switch "Cargo activo" antes de los botones. Tabla con columnas: Persona, Materia, Cargo, Dedicación, Carácter, Vigencia (fechas dd.mm.aaaa), Carrera/Plan, Facultad, Activo (badge), Acciones.
22. **Nomenclador endpoint plano `/api/entradas/`**: GET retorna solo nodos hoja (Disciplinas sin hijos, Subdisciplinas sin hijos, todas las Especialidades). POST crea jerarquía automáticamente (Disciplina → Subdisciplina → Especialidad) si no existen, usando el mismo nombre como descripción.
23. **GestionNomencladorPage**: tabla plana sin columna Tipo. Códigos con padStart(2,"0") en onBlur. Nombre en uppercase via onChange. Los endpoints individuales (`/disciplinas/`, `/subdisciplinas/`, `/especialidades/`) se mantienen para compatibilidad.
24. **Materias ordering**: `MateriaViewSet` ordena por `["codigo", "plan_estudio__carrera__codigo", "nombre"]`.
25. **Materias paginación**: MateriasPage usa paginación desde backend (PAGE_SIZE=50). Estado `page` resetea a 1 al cambiar búsqueda.
26. **CSS minify**: `build.cssMinify: false` en `vite.config.ts` para evitar warnings de Tailwind v4 `:is()` vacío.
27. **Backup dumpdata**: `backups/sacad_data.json` generado con `dumpdata --natural-foreign --natural-primary`. Excluye contenttypes, auth.Permission, admin.LogEntry, sessions. Copiado a `/tmp/sacad_data.json` en el container para restore vía `loaddata`.

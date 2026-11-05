# ICMSA OS frontend
Derived directly from official WEB MODEL 1.1.0; see WEB_MODEL_PROVENANCE.md.
Core API client, session verification, token revocation flow, hooks, modal, protected router
and existing tests are retained. src/domain owns ICMSA navigation and institutional modules.

The server /api/v1/access supplies role permissions and resource field contracts. UI hiding is
only convenience: every API validates permission and geography. Resource pages include search,
status filters, ordering, pagination, form validation and loading/error/empty states.
Organization is loaded once, mapped locally and rendered as a position tree including vacancies.
Process assignments support drag/drop and a keyboard-accessible selector.
Process detail contains structured steps and employee/position/area assignment controls.
Indicators store manual measurements and immutable period history; no fabricated data.

Vercel: import this repository, framework Vite, npm ci, npm run build, output dist.
Set VITE_BACKEND_URL to the HTTPS Render origin, without /api/v1. Rebuild after changing it.
Never place DB/JWT/provider secrets in VITE_* values. Existing vercel.json supplies SPA routing
and security headers. Configure the backend exact CORS origin before use.
No hosting project or production deployment has been created by this implementation.


## Organigrama: réplica de KPIs Web (esquema 0.5)

La vista activa `/portal/organigrama` reutiliza directamente el componente
`Kevins4l/KPIS_FRONT/src/components/OrganizationPage.jsx`, adaptado al backend de ICMSA.
La pantalla tiene **solo cuatro formularios**:
- Agregar usuario: nombre, correo, contraseña temporal (mínimo 12 caracteres), rol miembro/administrador.
- Agregar área: nombre y área superior opcional.
- Agregar puesto: área, nombre de puesto y puesto superior.
- Asignar persona: usuario y puesto.

Debajo se despliega un organigrama de tarjetas y conectores. Cada tarjeta permite
cambiar puesto, área, superior y ocupante; ver procesos responsables/relacionados;
y editar asignaciones en tres columnas por arrastrar/soltar. Ya **no existe**
administración de departamentos en esta pantalla ni componentes anteriores
`OrgDirectory`, `DepartmentManager`, `PositionTree` o `PositionModal`.

La API del área está en `/api/v1/organization/kpis` y los comandos correspondientes
`/api/v1/organization/{units,positions,users}`. Los usuarios creados en este
flujo tienen cuenta real de acceso y expediente de personal vinculado. El rol
"Administrador" equivale a superadministrador y por ello solo puede emitirlo
un superadministrador; no debe utilizarse para usuarios comunes.

### Compatibilidad y activación
ICMSA conserva `departments.id` únicamente como compatibilidad interna de
módulos escolares anteriores, **nunca como un campo visible o requerido en el
organigrama**. Las áreas disponen de `parent_area_id` (migración de esquema 0.5).
Los registros antiguos y el historial no se borran automáticamente.

El menú administrativo solo ofrece Organigrama. Los demás módulos permanecen
en rutas protegidas y pueden recuperarse sin perder datos; el portal del alumno
no cambia. Requiere frontend y backend actualizados y la migración 0.5 aplicada.
El CI ejecuta pruebas de interfaz, permisos y creación de áreas sin departamentos.

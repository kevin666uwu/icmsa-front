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


## Organigrama de KPIs Web (noviembre de 2026)
La pantalla de Organización de ICMSA comparte el diseño visual de `Kevins4l/KPIS_FRONT/src/components/OrganizationPage.jsx`: formularios compactos de administración, árbol de puestos con tarjetas y conectores, contadores de procesos, edición contextual mediante modal y tablero de asignación de procesos en tres columnas con arrastrar y soltar (más selector accesible).

### Diferencias necesarias por el dominio escolar
- Las personas del organigrama se toman de `employees`, no de las cuentas de acceso `users`; sus credenciales se administran por separado.
- Cada puesto se adscribirá a un departamento, con área funcional opcional. Las relaciones de reporte pueden conectar distintos departamentos (por ejemplo Dirección → jefaturas).
- Las asignaciones y su historial se gestionan mediante la API existente de ICMSA: `/employees/{id}/position`, `/positions/{id}/editor` y `/employees/{id}/processes`.
- El tablero muestra los procesos heredados y guarda únicamente las asignaciones directas del empleado, sin convertir permisos heredados en permisos directos.
- Los formularios respetan el acceso institucional. Solo `super_admin` puede crear personal sin plaza desde esta pantalla.
- La vista requiere un backend actualizado con la migración departamental 0.4 aplicada. Despliegue frontend exitoso no garantiza que el backend esté migrado.

### Revisión
Validar jerarquía de departamentos, expansión de tarjetas, edición de puestos, proceso en las tres columnas, permisos restringidos y visualización móvil.


## Navegación simplificada de Organización (noviembre de 2026)

El menú interno muestra únicamente **Organización → Organigrama** y mantiene **Operación → Procesos** como módulo separado. Se eliminaron los accesos laterales redundantes de Personal, Departamentos, Áreas y Puestos, sin eliminar sus tablas ni endpoints. En la misma página de Organigrama existe una sección desplegable **Gestionar estructura y vacantes**, con catálogos y edición de departamentos, áreas, personal, puestos, plazas vacantes y puestos inactivos. Los formularios de alta y asignación de KPIs Web permanecen en la vista de Organigrama.

Servicios Escolares y Servicios Estudiantiles son departamentos institucionales, por lo que se retiraron del menú administrativo como entradas independientes. Sus registros de trámites/casos no se borraron; los enlaces anteriores a esas páginas siguen siendo compatibles si un usuario tiene autorización. El portal del alumno mantiene los accesos a trámites, documentos y saldos.

Los enlaces guardados a rutas de organización antiguas abren ahora Organigrama. Indicadores, asistencia, academia, admisión, biblioteca y administración conservan sus entradas y permisos independientes.

**No se modificó el esquema de base de datos para esta simplificación de navegación.** Sigue siendo necesario desplegar y migrar el backend 0.4 para utilizar puestos sin área. No confundir un despliegue correcto de Vercel con pruebas completas de API/BD.


## Modo de reinicio visual: solo Organigrama en el menú (noviembre 2026)

A petición del responsable del proyecto, el **menú administrativo** muestra únicamente `Organigrama` en `/portal/organigrama`. El acceso por defecto `/portal` redirige allí cuando la cuenta tiene permiso `organization.read`. Si la cuenta no cuenta con dicho permiso, su ruta inicial original sigue disponible para no bloquear el acceso.

Todos los demás módulos permanecen implementados, pero sus entradas laterales están temporalmente ocultas. Sus rutas protegidas siguen resolviéndose si el usuario cuenta con la autorización correspondiente; no se modificaron tablas ni se borraron expedientes. El menú del alumnado no cambió.

La definición del menú visible está en `src/domain/navigation.js`; las rutas antiguas están en `hiddenNavigation`. Para reintroducir funciones más adelante, mover las entradas autorizadas del catálogo oculto al visible, sin reimplementar pantallas ni endpoints.

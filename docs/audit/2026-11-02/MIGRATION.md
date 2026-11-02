# ICMSA — WEB MODEL 1.2.0

Baseline: 909a268c0cf6da17e3d60586d09a8e9a5fdb60e0.
Modelo: https://github.com/kevin666uwu/web-model-v1-frontend/releases/tag/v1.2.0.

## Conservación
Organigrama, departamentos/áreas, puestos, asignaciones, roles super_admin/director/coordinator/employee/teacher/student/viewer y scopes; auditoría propia; admisión, documentos y revisión; biblioteca; portal de alumno y perfil académico. Conservar marca, pantallas, responsive, navegación y contratos existentes. No se sustituye ninguno por admin/member del modelo. DOMAIN, schemas, SQL, RBAC, cargas de documentos y sus límites, rutas y estilos permanecen intactos. Inventario estático y hashes: baseline.json.

## Adopción
Guard build-time de variables públicas, configuración equivalente, lock reproducible actualizado. Sin modificar roles/rutas/componentes del producto; avisos moderados ESLint/minimatch sin parche quedan registrados.
No se ejecuta manualmente bootstrap o migraciones. El arranque preexistente puede inicializar esquema/adiciones compatibles; este cambio no modifica ese comportamiento.

## Evidencia y límites
Pruebas compartidas más suites actuales de organización, admisión, documentos, biblioteca y portal en CI del SHA exacto. Hashes prueban conservación de archivos, no todos los flujos productivos. Variables, despliegue Render/Vercel, aceptación móvil y accesibilidad en navegador real NO VERIFICADOS sin acceso.
Reversión: revertir únicamente commit de integración sobre main o desplegar baseline 909a268c0cf6da17e3d60586d09a8e9a5fdb60e0; no force-push ni rollback de datos, no renombrar variables.

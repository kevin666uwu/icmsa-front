# ICMSA OS — Portal institucional

Instituto de Ciencias Médicas San Ángelo. React + Vite, base oficial WEB MODEL 1.1.0.
[Procedencia](docs/WEB_MODEL_PROVENANCE.md) · [Arquitectura y Vercel](docs/ICMSA_FRONTEND.md).

## Validación
```text
npm ci
npm run lint
npm test
npm run build
node scripts/compliance.mjs
npm audit
```

## Rutas
/login, /portal, /portal/personal, /portal/organigrama, /portal/procesos,
/portal/indicadores, /portal/asistencia, /portal/alumnos,
/portal/academia/programas, /portal/academia/periodos, /portal/academia/materias,
/portal/academia/grupos, /portal/servicios-escolares, /portal/servicios-estudiantiles,
/portal/organizacion/departamentos, /portal/organizacion/areas, /portal/organizacion/puestos,
/admin/usuarios, /admin/roles, /admin/configuracion.

Navegación por permisos entregados por API; backend como autoridad final.
Árbol de plazas, vacantes, edición atómica de ocupantes, procesos por persona/puesto/área,
drag & drop con alternativa accesible, asistencia, indicadores con histórico,
alumnos, catálogos académicos y servicios. Datos siempre del backend.

## Desarrollo / hosting
VITE_BACKEND_URL debe ser el origen del backend sin /api/v1. Copiar .env.example
solo en un entorno autorizado; no versionar .env. npm run dev para desarrollo.
Vercel: build npm run build, salida dist. No hay deployments productivos realizados.
Identidad visual provisional reemplazable en src/domain/site.js e institutional.css.
No se copiaron componentes de producto ASIDEK/KPIS.

## Dependencias
Vite, Vitest y source-map-js se actualizaron en el runner GitHub para resolver
avisos detectados al importar la base oficial. El lockfile conserva versiones e integridad.
No se deshabilitó la auditoría ni se eliminaron pruebas heredadas.


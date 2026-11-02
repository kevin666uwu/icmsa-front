# Variables — kevin666uwu/icmsa-front

Commit: 909a268c0cf6da17e3d60586d09a8e9a5fdb60e0. Valores del proveedor NO VERIFICADOS. Entornos aplicables: local, pruebas, preview y producción; no implica que una variable esté configurada en todos ellos.

| Variable / propósito | Lado / visibilidad | Obligatoria / default declarado | Validación | Canónico / compatibilidad | Acción |
|---|---|---|---|---|---|
| VITE_BACKEND_URL: Origen público de la API incorporado al build | frontend; pública en bundle | No determinado; No identificado; revisar fuente | Según fuente enlazada; no inferir validación por el nombre | VITE_BACKEND_URL; Sin renombrado | Conservar nombre/valor; adoptar validación y probar antes del despliegue |
| VITE_API_TIMEOUT_MS: Tiempo de espera HTTP del frontend | frontend; pública en bundle | No determinado; No identificado; revisar fuente | Según fuente enlazada; no inferir validación por el nombre | VITE_API_TIMEOUT_MS; Sin renombrado | Conservar nombre/valor; adoptar validación y probar antes del despliegue |

## Fuentes
- VITE_BACKEND_URL: `.env.example`, `src/core/config.js`
- VITE_API_TIMEOUT_MS: `.env.example`, `src/core/config.js`

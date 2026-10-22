# WEB MODEL V1

Version 1.0.0

Base neutral React + Vite con tipografía de sistema, escala de grises, rutas protegidas, sesión, estados async y componentes accesibles. No requiere carpeta intermedia.

## Arquitectura

- `src/core`: configuración de API y punto de extensión de identidad.
- `src/services`: capa HTTP con timeout/cancelación y contratos de auth.
- `src/lib`, `src/hooks`: sesión, roles y control de solicitudes async.
- `src/app/router`: navegación y reglas de acceso genéricas.
- `src/components`: Button, Input, Select, Modal, Drawer, Tabs, Card, Table, EmptyState, LoadingState, Skeleton, ErrorState, Toast y ResponsiveContainer.
- `src/features`: login/registro, portal y administración básica de usuarios.
- `src/domain/site.js`: extensión opcional, reservada para cada derivado; contiene identidad, páginas y servicios.

La capa HTTP y los helpers de errores parten de la base existente. Se retiraron eventos y dependencias de negocio. La sesión se revalida con el backend antes de habilitar rutas privadas. El token vive en sessionStorage con namespace por proyecto: nunca se confía en roles almacenados en el navegador. El backend siempre es autoridad. sessionStorage no protege frente a XSS; no introducir HTML sin sanitizar y mantener CSP y dependencias actualizadas.

## Ejecución local

Node 24 y npm. Primero arrancar el backend y crear un admin.

```sh
npm ci
cp .env.example .env
npm run dev
```

En PowerShell usar `Copy-Item .env.example .env`. Abrir `http://localhost:5173`. `VITE_BACKEND_URL` debe ser el origin del backend sin ruta, credenciales ni query (por defecto `http://localhost:8000`). `VITE_API_TIMEOUT_MS` es 15000 por defecto. Variables VITE son públicas: nunca incluir secretos.

El registro se muestra solo si `/api/v1/config` lo permite. `/portal` requiere sesión activa y `/admin` requiere admin; este último permite listar y activar/desactivar cuentas. Creación de administradores y cambios de rol se realizan desde la API protegida o CLI inicial. No hay clientes, estadísticas ni testimonios ficticios.

## Accesibilidad

Labels asociados a inputs, navegación por teclado, skip link, foco visible, tablas con caption, notificaciones ARIA, tabs con flechas/Home/End y respeto de reduced motion. Modal y Drawer usan `<dialog>.showModal()` para foco, Escape e inercia del fondo; restauran foco al cerrar. Las pruebas jsdom verifican contratos y eventos; el comportamiento nativo de diálogo debe comprobarse también en un navegador real.

## Verificación

```sh
npm run lint
npm test
npm run build
node scripts/compliance.mjs
npm audit --audit-level=high
```

`package-lock.json` se versiona para instalaciones reproducibles. Vitest y Testing Library comprueban acceso, revalidación de sesión, cancelación de cargas, errores de API y teclado.

## Deploy Vercel

Importar este repo, rama main, raíz del proyecto actual, build `npm run build`, output `dist`. Establecer `VITE_BACKEND_URL` a la URL HTTPS de Render y `VITE_API_TIMEOUT_MS`. Agregar el origin real de Vercel a `CORS_ORIGINS` del backend. `vercel.json` incluye rewrite de SPA y cabeceras de seguridad. Su CSP permite conexiones HTTPS; después de conocer las URLs definitivas, restringir connect-src al backend exacto. Los previews de Vercel requieren allowlist explícita, no wildcard.

Las rutas directas `/portal` y `/admin` deben servir index.html. Verificar login, logout y expiración tras desplegar. Esta entrega prepara hosting; no publica sitios ni crea dominios externos.


## CORE y DOMAIN

CORE contiene configuración, autenticación, autorización, componentes y contratos genéricos. Una mejora genérica se implementa primero aquí, se prueba y recibe una versión; luego se integra en los derivados.

Los derivados agregan sus módulos en `app/domain/` (backend) o `src/domain/` (frontend) y documentación en `docs/domain/`. Esas rutas están reservadas: el upstream no debe crear ni editar archivos dentro de ellas. No modificar archivos CORE para introducir marca, reglas o datos de negocio. Cuando un cambio de core sea indispensable, enviarlo primero al modelo.

Cada aplicación debe tener su propia base de datos, credenciales, secreto JWT, issuer y audience. Nunca reutilizar una base de otra aplicación. Una clave compartida no sustituye el aislamiento. No hay datos comerciales ni servicios externos preconfigurados.

## Crear un derivado con historial compartido

Crear un repositorio remoto vacío. Clonar este modelo conservando su historial:

```sh
git clone https://github.com/kevin666uwu/web-model-v1-frontend.git NUEVO_PROYECTO
cd NUEVO_PROYECTO
git remote rename origin upstream
git remote add origin https://github.com/kevin666uwu/NUEVO_REPO.git
git switch main
git push -u origin main
git remote -v
```

No usar una descarga ZIP ni una inicialización independiente: perderían el ancestro común. Origin apunta al derivado; upstream apunta directamente a este modelo. Los remotos son configuración local y no viajan con un clon: en clones posteriores ejecutar `git remote add upstream URL_DEL_MODELO`.

## Actualizar desde WEB MODEL

Con el árbol limpio y un respaldo operativo de la base de datos si hay cambios de esquema:

```sh
git switch main
git fetch upstream
git merge upstream/main
# Resolver conflictos con revisión manual; conservar DOMAIN.
# Ejecutar todos los controles indicados abajo antes de publicar.
git push origin main
```

No usar force-push ni merges automáticos destructivos. Para abortar un merge sin resolver: `git merge --abort`. Revisar diferencias de configuración y migraciones, además de código. Comprobar que `git merge-base --is-ancestor upstream/main main` termina con código 0. Para una versión controlada se puede fusionar `vX.Y.Z` en lugar de main.

## Versionado

`.web-model-version` identifica la versión del CORE. Se usa SemVer y tags `vX.Y.Z` después de validaciones. Los cambios DOMAIN tienen commits propios y no incrementan la versión del modelo. Backend y frontend evolucionan por separado. Registrar ambas versiones en `docs/domain/model-versions.md` de cada derivado.

La versión 1.0.0 es la extracción inicial. Los cambios incompatibles requieren nueva versión mayor y una guía de migración. `init-db` no reemplaza una estrategia de migraciones para futuras modificaciones de esquema.


## 1.1.0 — Email verification

The optional /verify-email screen uses the backend's email_verification_enabled flag.
Registration confirms passwords and routes unverified accounts to a labeled six-digit
OTP input. Session refresh, server cooldown, loading, errors and explicit continuation
are supported. Unverified accounts can still login; each application owns its access policy.
No new frontend ENV or secrets are required. Apply the backend's 1.1.0 migration and
configure its SMTP EmailService and OTP_PEPPER before enabling verification there.
Disabling verification on the backend preserves the previous login flow.

EmailVerificationForm uses cancellable requests and a single-flight action guard.
The countdown is presentation only: the backend enforces issuance and expiry. Tests mock
the verification service; no real email is sent. The optional notification outbox and
provider dispatch remain backend-only; there is no client interface for event delivery.
Core styles retain keyboard focus, responsive layout and reduced-motion support.

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

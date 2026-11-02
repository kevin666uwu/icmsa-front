# WEB MODEL 1.1.0 → 1.2.0

SemVer minor: additive shared capabilities, no schema migration and no route/role changes.
Do not merge whole application files over product-specific code. Preserve the pinned baseline
and all domain/schema/dashboard/integration/deployment hashes except explicitly reviewed paths.

## Order
Verify model CI and publish v1.2.0 first. Then one project at a time: Constructora (smallest
domain), ASIDEK (resolve recorded pre-existing CI failures), Nido, ICMSA, SOPD, KPIS.
FXCKSTORE needs a targeted adapter; Paralyzed is inventoried legacy, not an automatic migration.
Do not proceed past a failed deployment. Unavailable provider access must be recorded, not invented.

## Configuration
Existing canonical names and values remain. CORS_ORIGINS accepts JSON plus CSV; exact origin
checks remain. No wildcard relaxation. No JWT rotation, issuer/audience normalization across
projects, registration or email/outbox activation.
DATABASE_TLS_ENABLED=false is backward-compatible opt-in. DATABASE_SSL_CA is a mounted CA path,
not certificate contents or a secret in Git. Enabling either creates a validating SSL context.
Existing DATABASE_URL query TLS options remain untouched when the feature is off.
ICMSA already requires production TLS: preserve its stronger behavior, do not replace its engine.
Check CA, hostname and deployment connectivity before enabling; do not disable certificate checks.

Frontend retains VITE_BACKEND_URL and VITE_API_TIMEOUT_MS. Credential-shaped VITE_* names now
fail closed without echoing values. Move secrets to server/provider secret storage, rotate any
exposed secret, remove the public name, rebuild, then verify bundle and login/API calls.
Do not remove legitimate public payment keys. No environment values were read from providers.

## Optional modules
app/optional/file_checks.py: local bounded signature inspection only. Caller must bound streaming
uploads BEFORE accumulating bytes, authorize resource access, scan malware, store privately,
sanitize filenames and implement downloads. No CURP, RENAPO, provider SDK or school dependency.
app/optional/audit_projection.py: allowlisted event metadata; no automatic logging/persistence.
It does not safely sanitize arbitrary free-text values: callers must supply controlled action/status
identifiers, never credentials in allowed fields. Retain project-specific audit ownership/transactions.
Existing email/outbox remain optional and default off; no new jobs are activated.

## Verification and rollback
Retain existing suites; add tests of parser/TLS/public configuration/optional boundaries.
Compare preserved-file Git blob hashes and route/permission inventories against baseline.
Verify Actions for the exact commit, not a previous green run. Runtime/mobile/provider verification
is distinct and must be marked unavailable when inaccessible.
Rollback: deploy the recorded pre-migration commit or revert ONLY migration commits on main,
without force-push. No DB rollback is required because this release performs no schema/data changes.
Keep previous provider names and values throughout rollout. Never revert unrelated concurrent work.

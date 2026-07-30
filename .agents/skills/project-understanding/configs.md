Workspace configuration

Key files

- `package.json` (root): runs `turbo` scripts for build/dev/lint/format/typecheck. Uses `pnpm` as package manager.
- `pnpm-workspace.yaml`: defines packages and apps (`apps/*`, `packages/*`).
- `turbo.json`: defines task orchestration, pipeline dependencies, and `globalEnv` variables.
- `tsconfig.json`: root compiler options (ESNext/moduleResolution: bundler, strict mode).

Important environment variables (referenced in `turbo.json` and packages):

- `BUILDMATE_DATABASE_URL` — Postgres connection for db and API server.
- `BETTER_AUTH_SECRET` — secret used by Better Auth for session signing.
- `BETTER_AUTH_URL` — base URL for auth callbacks (e.g., `http://localhost:3000`).
- `VITE_API_URL` — Web app API server URL.
- `VITE_DEPLOYMENT_MODE` — Web app deployment mode: `"cloud"` or `"local"`.
- `SINGLE_TENANT_MODE` — API: `"true"` for local installation, `"false"` for cloud SaaS.
- `VAT_RATE` — Oman VAT rate: `"0.05"`.
- `DEFAULT_MARGIN_FLOOR` — Default margin floor percentage: `"2.00"`.
- `QR_POINTS_PER_SCAN` — Loyalty points per QR scan: `"10"`.

Tooling and conventions

- Monorepo: pnpm workspaces + turbo for orchestration.
- Build tooling: `tsup` for packages, `vite` for web (TanStack Start), `nest build` for API.
- DB: uses `drizzle-kit` and `drizzle-orm` (see `packages/db` scripts for push/generate).
- Contracts: oRPC + Zod based contracts live in `packages/contract` and consumed by API, Web, and Mobile.
- Mobile: React Native Expo (`apps/mobile`).
- Web: TanStack Start (React 19, Vite 8) — preferred over Next.js.

Agent notes

- Do not assume a running DB: many commands require `BUILDMATE_DATABASE_URL` set.
- For codegen, several scripts use `dotenv -e ../../.env -- ...`; the repo relies on a root `.env` in some workflows.
- Every database query MUST scope by `org_id` (tenant isolation) — enforced at application layer and PostgreSQL RLS.
- Invoices are immutable after issue — use credit notes for adjustments.
- Purchase receipts are append-only — never UPDATE, only INSERT.
- Cost price never auto-updates — suggests highest recent cost, requires human approval.
- QR codes once redeemed stay redeemed — status never reverses.
- Soft deletes only — set `deleted_at`, never hard delete.
- VAT calculated per line at 5% — never on total, always 3 decimal places.
- All monetary values use `decimal.js` — never JS floating point.
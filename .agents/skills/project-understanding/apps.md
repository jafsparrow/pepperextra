Apps

Overview

- The repository is a pnpm/turbo monorepo. Apps are under `apps/` and are runnable projects.

Apps found (quick reference):

- `apps/api` — Backend API (NestJS v11, Express).
  - Purpose: Business logic, multi-tenant data, auth, price resolution, PDF generation, WhatsApp integration.
  - Main scripts:
    - `pnpm --filter api dev` (runs `nest start --watch`)
    - `pnpm --filter api build` (produces `dist` via `nest build`)
    - `pnpm --filter api start:prod` to run built code.
  - Notes: Depends on `@repo/auth`, `@repo/db`, uses Better Auth RBAC and Drizzle ORM.
  - Runs on port 3000.

- `apps/web` — Web Admin Panel (TanStack Start / React 19 / Vite 8).
  - Purpose: Tenant onboarding, catalog management, staff admin, reports, **customer portal**, warranty management.
  - Main scripts:
    - `pnpm --filter web dev` (Vite dev server on port 3001)
    - `pnpm --filter web build`
    - `pnpm --filter web preview`
  - Notes: Uses `@repo/auth` client, `@repo/contracts` for type-safe API calls, `@workspace/ui` components, TanStack Router + Query.

- `apps/mobile` — Mobile App (React Native Expo).
  - Purpose: Shop floor quotation flow, QR scanning, fulfilment station screen, offline catalog sync, WhatsApp PDF sharing.
  - Main scripts:
    - `pnpm --filter mobile dev` (Expo start)
    - `pnpm --filter mobile build`
  - Notes: Uses Expo SQLite for local catalog cache, expo-camera for QR/barcode scanning, expo-print for PDF generation.

How to run the full workspace in development

- From repo root (uses Turbo to orchestrate):

```bash
pnpm install
pnpm dev
```

Or run a single app:

```bash
pnpm --filter api dev
pnpm --filter web dev
pnpm --filter mobile dev
```

When debugging agent decisions, prefer running only the relevant app.

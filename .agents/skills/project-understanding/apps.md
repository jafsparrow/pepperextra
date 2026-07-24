Apps

Overview

- The repository is a pnpm/turbo monorepo. Apps are under `apps/` and are runnable projects.

Apps found (quick reference):

- `apps/web` — Frontend application (React + Vite + Tailwind + `@workspace/ui`).
  - Purpose: Public/admin web UI. Uses `@pepperextra/auth` and `@pepperextra/contracts`.
  - Main scripts:
    - `pnpm --filter web dev` or `pnpm --filter web start` (local via `vite dev --port 3001`)
    - `pnpm --filter web build`
    - `pnpm --filter web preview`
  - Notes: Uses React 19, TanStack Router, TanStack Query, and better-auth client packages.

  - Key files:
    - [apps/web/package.json](apps/web/package.json#L1)
    - [apps/web/src/router.tsx](apps/web/src/router.tsx#L1)
    - [apps/web/src/routes/\_\_root.tsx](apps/web/src/routes/__root.tsx#L1)
    - [apps/web/src/feature/auth/ui/components/login-form.tsx](apps/web/src/feature/auth/ui/components/login-form.tsx#L1)

- `apps/api` — Backend API (NestJS).
  - Purpose: Server-side API and orpc endpoints.
  - Main scripts:
    - `pnpm --filter api dev` (runs `nest start --watch`)
    - `pnpm --filter api build` (produces `dist` via `nest build`)
    - `pnpm --filter api start:prod` to run built code.
  - Notes: Depends on `@pepperextra/auth`, `@pepperextra/db`, uses `better-auth` and Drizzle ORM.

  - Key files:
    - [apps/api/package.json](apps/api/package.json#L1)
    - [apps/api/src/main.ts](apps/api/src/main.ts#L1)
    - [apps/api/src/organization-user/organization-user.controller.ts](apps/api/src/organization-user/organization-user.controller.ts#L1)

How to run the full workspace in development

- From repo root (uses Turbo to orchestrate):

```bash
pnpm install
pnpm dev
```

Or run a single app:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

When debugging agent decisions, prefer running only the relevant app.

Agent Instructions — how to use the project-understanding skill

When you (an AI agent) are assigned a task in this repository, follow these rules:

1. Start by reading `SKILL.md` and the module most relevant to the task.
2. Identify the scope: `apps/` (frontend/backend/mobile) vs `packages/` (shared libraries).
3. Check the nearest package/app `package.json` for scripts and dependencies.
4. If you need to run or build code, prefer the focused filter commands:
   - `pnpm --filter api dev`  (NestJS API on :3000)
   - `pnpm --filter web dev`  (TanStack Start web on :3001)
   - `pnpm --filter mobile dev` (Expo mobile)
   - `pnpm --filter <package> build`
   - Root `pnpm dev` uses Turbo to orchestrate multiple apps.
5. Environment variables: If a command references DB or auth, ensure `BUILDMATE_DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` are set. If missing, document and ask for values or use a local dev DB stub.
6. Database operations: Use `packages/db` scripts (`db:generate`, `db:push`, `studio`) and respect `dotenv -e ../../.env --` wrappers used in scripts.
7. When modifying shared packages, update dependent apps where necessary and run `pnpm --filter <app> dev` to validate.
8. Prefer minimal, reversible changes and include tests where reasonable.
9. Multi-tenancy: Every database query MUST scope by `org_id`. See `configs.md` and `04_CODING_AGENT_CONTEXT.md` section 2.1.
10. Immutability: Invoices never edited after issue — use credit notes. Purchase receipts append-only. QR codes one-way. Soft deletes only.

Ownership hints

- `apps/api` — NestJS v11 controllers, services, modules, guards under `apps/api/src`. oRPC procedures in `apps/api/src/trpc` (or equivalent).
- `apps/web` — TanStack Start (React 19) frontend. Routes under `apps/web/src/routes`, features under `apps/web/src/feature/`.
- `apps/mobile` — React Native Expo app. Screens under `apps/mobile/app/`, features under `apps/mobile/src/feature/`.
- `packages/auth` — Better Auth config, RBAC, client helpers, `OrgCtx` type for NestJS guards.
- `packages/contract` — oRPC contract definitions (input/output schemas, routers).
- `packages/db` — Drizzle schema, relations, migrations, database client factory.
- `packages/typescript` — Shared TS configs.
- `packages/ui` — shadcn/ui components for web app.

If you cannot run something due to missing secrets or infra (DB), clearly document the steps to reproduce and required env vars.
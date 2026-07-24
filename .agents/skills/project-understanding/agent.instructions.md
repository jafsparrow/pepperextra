Agent Instructions — how to use the project-understanding skill

When you (an AI agent) are assigned a task in this repository, follow these rules:

1. Start by reading `SKILL.md` and the module most relevant to the task.
2. Identify the scope: `apps/` (frontend/backend) vs `packages/` (shared libraries).
3. Check the nearest package/app `package.json` for scripts and dependencies.
4. If you need to run or build code, prefer the focused filter commands:
   - `pnpm --filter web dev`
   - `pnpm --filter api dev`
   - `pnpm --filter <package> build`
   - Root `pnpm dev` uses Turbo to orchestrate multiple apps.
5. Environment variables: If a command references DB or auth, ensure `PEPPER_DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` are set. If missing, document and ask for values or use a local dev DB stub.
6. Database operations: Use `packages/db` scripts (`db:generate`, `db:push`) and respect `dotenv -e ../../.env --` wrappers used in scripts.
7. When modifying shared packages, update dependent apps where necessary and run `pnpm --filter <app> dev` to validate.
8. Prefer minimal, reversible changes and include tests where reasonable.

Ownership hints

- `apps/web` — frontend UI and routes. Look for feature components under `apps/web/src/feature`.
- `apps/api` — NestJS controllers and orpc implementations under `apps/api/src`.
- `packages/auth` — auth configuration and client helpers used by both api and web.

If you cannot run something due to missing secrets or infra (DB), clearly document the steps to reproduce and required env vars.

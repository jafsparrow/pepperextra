Workspace configuration

Key files

- `package.json` (root): runs `turbo` scripts for build/dev/lint/format/typecheck. Uses `pnpm` as package manager.
- `pnpm-workspace.yaml`: defines packages and allows some builds.
- `turbo.json`: defines task orchestration and `globalEnv` variables.
- `tsconfig.json`: root compiler options (ESNext/moduleResolution: bundler, strict mode).

Important environment variables (referenced in `turbo.json` and packages):

- `PEPPER_DATABASE_URL` — Postgres connection for db and server.
- `BETTER_AUTH_SECRET` — secret used by better-auth.
- `BETTER_AUTH_URL` — base URL for auth callbacks if applicable.

Tooling and conventions

- Monorepo: pnpm workspaces + turbo for orchestration.
- Build tooling: `tsup` for packages, `vite` for web, `nest build` for api.
- DB: uses `drizzle-kit` and `drizzle-orm` (see `packages/db` scripts for push/generate).
- Contracts: ORPC + Zod based contracts live in `packages/contract` and consumed by both api and web.

Agent notes

- Do not assume a running DB: many commands require `PEPPER_DATABASE_URL` set.
- For codegen, several scripts use `dotenv -e ../../.env -- ...`; the repo relies on a root `.env` in some workflows.

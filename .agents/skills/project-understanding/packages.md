Packages

This repo exposes several internal packages under `packages/` used across the apps.

- Purpose: Authentication glue for apps, based on `better-auth` and Drizzle adapter.
- Important scripts: `build`, `auth:generate`, `auth:migrate`, `typecheck`.
- Exports: `.` (server auth export), `./client` (client helpers), `./roles`.

- Key files:
  - [packages/auth/src/auth.ts](packages/auth/src/auth.ts#L1)
  - [packages/auth/src/client.ts](packages/auth/src/client.ts#L1)
  - [packages/db/src/index.ts](packages/db/src/index.ts#L1)
  - [packages/contract/src/index.ts](packages/contract/src/index.ts#L1)
  - [packages/ui/src/components/button.tsx](packages/ui/src/components/button.tsx#L1)
- `@pepperextra/contracts` (packages/contract)
  - Purpose: Shared orpc/zod contracts used by API and client.
  - Important scripts: `build` (tsup), `check-types`.

- `@pepperextra/db` (packages/db)
  - Purpose: Drizzle schema, db client helpers, drizzle-cli utilities.
  - Important scripts: `db:generate`, `db:push`, `studio`, `with-env` helper.

- `@workspace/ui` (packages/ui)
  - Purpose: Shared React UI primitives, components, and styles used by `apps/web`.
  - Important scripts: `lint`, `format`, `typecheck`.

- `@pepperextra/tsconfig` (packages/typscript)
  - Purpose: central TypeScript configuration base used via `workspace:*` references.

Notes for agents

- When making code changes that affect runtime behavior, check and update affected packages and their `build` scripts.
- Prefer to run `pnpm --filter <pkg> build` and `pnpm --filter <app> dev` when validating changes locally.

# AGENTS.md — Technical Guide for AI Agents

> For business requirements and product context, read `.agents/agent.md`. This file covers **how the codebase is structured and how to work in it**.

---

## Monorepo Layout

```
pepperextra/
├── apps/
│   ├── api/              # NestJS v11 backend (Express)
│   └── web/              # TanStack Start frontend (React 19, Vite 8)
├── packages/
│   ├── auth/             # @pepperextra/auth — Better Auth config + client
│   ├── contract/         # @pepperextra/contracts — oRPC contract definitions
│   ├── db/               # @pepperextra/db — Drizzle ORM schema + client
│   ├── typscript/        # @pepperextra/tsconfig — shared TS configs
│   └── ui/               # @workspace/ui — shadcn/ui component library (61 components)
├── .agents/              # Agent skill files and project requirements
│   └── agent.md          # Full product requirements document (BRD)
└── AGENTS.md             # This file
```

**Package manager:** pnpm (v10) with workspaces
**Task runner:** Turborepo
**Module system:** ESM throughout (`"type": "module"`)
**Node target:** ES2022+

---

## Commands

```bash
pnpm build          # Build all packages and apps via Turborepo
pnpm dev            # Start all apps in dev mode (API on :3000, Web on :3001)
pnpm lint           # Lint all packages
pnpm typecheck      # Type-check all packages
pnpm format         # Format with Prettier
```

Per-app commands (run from `apps/api` or `apps/web`):

```bash
# API
pnpm dev            # nest start --watch
pnpm build          # nest build
pnpm lint           # eslint + prettier
pnpm test           # jest unit tests

# Database (from packages/db)
pnpm db:generate    # Generate Drizzle migrations
pnpm db:push        # Push schema to DB
pnpm studio         # Open Drizzle Studio
```

---

## Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `PEPPER_DATABASE_URL` | API, DB | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | API, Auth | Secret for session signing |
| `BETTER_AUTH_URL` | API, Auth | Base URL for Better Auth (`http://localhost:3000`) |
| `VITE_API_URL` | Web | API server URL (defaults to `http://localhost:3000`) |
| `VITE_DEPLOYMENT_MODE` | Web | `"cloud"` or `"local"` (defaults to `"local"`) |
| `PORT` | API | Server port (defaults to `3000`) |

Load order: `.env` → `.env.local` → `../../.env`

---

## Architecture: API (`apps/api`)

**Framework:** NestJS v11 on Express
**Module system:** `"module": "nodenext"` (ESM with file extensions in imports)

### Module Structure

```
src/
├── main.ts                      # Bootstrap: NestJS + CORS (localhost:3001, credentials)
├── app.module.ts                # Root module — wires Auth, DB, oRPC, Config
├── app.controller.ts            # GET / (health check, AllowAnonymous)
├── app.service.ts
├── db/
│   └── database.module.ts       # Provides DRIZZLE_TOKEN via ConfigService → createDatabaseClient()
├── user/
│   ├── user.module.ts
│   ├── user.controller.ts       # GET/POST /users (in-memory, dev scaffold)
│   └── user.service.ts
├── organization-user/
│   ├── organization-user.module.ts
│   ├── organization-user.controller.ts  # oRPC: create/resetPassword/ban staff
│   └── organization-user.service.ts     # Uses authService.api for user CRUD
└── planet/
    └── planet.controller.ts     # oRPC: list/galaxies (demo endpoints)
```

### Two Routing Systems

1. **NestJS REST controllers** — traditional `@Controller()` decorators (e.g. `UserController`)
2. **oRPC contract-based** — `@Implement(contracts.xxx)` decorator + `implement().handler()` (e.g. `PlanetController`, `OrganizationUserController`)

### Auth Integration

- Uses `@thallesp/nestjs-better-auth` for NestJS guard integration
- Global auth guard by default; opt out with `@AllowAnonymous()`
- Session extracted via `@Session()` decorator
- Programmatic auth via `AuthService<AuthInstance>` injection

### Key Pattern: DRIZZLE_TOKEN

```typescript
// In any module:
@Module({
  imports: [DatabaseModule],
})
export class SomeModule {
  @Inject(DRIZZLE_TOKEN) db: NodePgDatabase<any>;
}
```

---

## Architecture: Web (`apps/web`)

**Framework:** TanStack Start (React 19 + TanStack Router + Vite 8 + Nitro)
**SSR:** Enabled via `@tanstack/react-start`

### Route Structure (file-based)

```
src/routes/
├── __root.tsx                  # Root layout (ThemeProvider, Toaster)
├── _auth/                      # Auth layout (split-screen)
│   ├── login.tsx               # /login
│   ├── signup.tsx              # /signup
│   └── reset-password.tsx      # /reset-password
├── _app/                       # Authenticated app layout (sidebar + breadcrumbs)
│   ├── index.tsx               # / dashboard
│   ├── admin/                  # /admin section
│   ├── org/                    # /org section (teams, users, settings)
│   └── planets/                # /planets section
```

### Feature Organization

```
src/feature/
├── auth/                       # Login/signup forms, session hooks
├── org/                        # Organization management (add org, staff, teams)
└── branch/                     # Branch/location management

src/shared/
├── hooks/                      # authorization-hook.ts, permission-hook.ts
├── utils/orpc.ts               # oRPC client setup (OpenAPILink → API)
└── ui/                         # navbar, sidebar, permission-guard
```

### API Client

- Uses `@orpc/openapi-client` with `OpenAPILink` pointing to API
- Integrated with TanStack Query via `@orpc/tanstack-query`
- Credentials included for cookie-based auth

---

## Architecture: Auth (`packages/auth`)

**Library:** Better Auth v1.6.22 with Drizzle adapter

### Three Entry Points

| Export | File | Purpose |
|---|---|---|
| `.` | `src/auth.ts` | `createAuthInstance(dbClient, options)` — server-side |
| `./client` | `src/client.ts` | `createAuthClient()` — React client with `signIn`, `signOut`, `signUp` |
| `./roles` | `src/admin-access-control/roles.ts` | Admin role definitions |

### Organization Plugin Config

- `maxOrganizationsPerUser: 1` — each user belongs to at most 1 org
- Teams enabled
- Custom `allowUserToCreateOrganization` hook (configurable per-app)
- Custom `organizationHooks` (configurable per-app)

### Two-Tier RBAC

**Admin panel** (`admin-access-control/`): `customAdminRole`, `financeRole`
- Resources: `organization`, `user`, `billing`, `system`

**Organization** (`org-access-control/`): `staff`, `cashier`, `manager` + default system roles
- Resources: `orders`, `billing`, `kitchen`, `inventory`, `staff`, `menu`, `customers`, `reports`, `settings`

### Custom User Fields

- `customAccountType`: `"owner"` | `"staff"` (default: `"staff"`)
- `passwordResetRequired`: boolean (default: `true`, not user-settable)

---

## Architecture: Database (`packages/db`)

**ORM:** Drizzle ORM 1.0.0-rc.4
**Driver:** node-postgres (pg Pool)
**Database:** PostgreSQL

### Schema Tables (auth-schema.ts)

| Table | Key Columns |
|---|---|
| `user` | id, name, email, customAccountType, banned, passwordResetRequired |
| `session` | id, token, userId, activeOrganizationId, activeTeamId |
| `account` | id, userId, providerId, password |
| `organization` | id, name, slug (unique) |
| `team` | id, name, organizationId |
| `member` | id, organizationId, userId, role |
| `invitation` | id, organizationId, email, role, status |
| `teamMember` | id, teamId, userId |
| `verification` | id, identifier, value, expiresAt |

### Client Factory Pattern

```typescript
// createDatabaseClient() creates a new Pool + drizzle instance
// Used by: API (via DRIZZLE_TOKEN), CLI tools, auth generation
export const createDatabaseClient = (connectionString: string) => {
  const pool = new Pool({ connectionString })
  return drizzle({ client: pool, relations: authRelations })
}
```

### Relations

Defined in `schema-relations/auth-relation.ts` using `defineRelations()`:
- user → sessions, accounts, teamMembers, members, invitations
- organization → teams, members, invitations
- member → organization, user

### ⚠️ Drizzle Version Mismatch

The `@pepperextra/db` package and the `apps/api` package may resolve to different drizzle-orm versions. When importing schema tables directly into the API, you may get type incompatibility errors. Workaround: use raw SQL via `(dbClient as any).execute()` or cast through `any`.

---

## Architecture: Contracts (`packages/contract`)

**Library:** `@orpc/contract` with Zod v4 schemas

### Defined Contracts

| Namespace | Endpoints |
|---|---|
| `planet` | list, find, create, delete |
| `galaxy` | list |
| `organizationStaffUser` | create, resetPassword, ban |

### How Contracts Work

```typescript
// packages/contract/src/index.ts defines contracts using oc.route()
// API implements them with @Implement(contracts.xxx) in NestJS controllers
// Web consumes them via oRPC OpenAPI client
```

This gives **end-to-end type safety** from DB schema → API contract → frontend client.

---

## Code Conventions

### Formatting (Prettier)

- **Root:** no semicolons, double quotes, trailing commas (es5), 2-space indent, LF
- **API overrides:** single quotes, trailing commas (all)

### ESLint

- `@typescript-eslint/no-explicit-any: off` (in API — necessary for drizzle/auth type workarounds)
- Prettier enforced via `eslint-plugin-prettier`

### TypeScript

- Strict mode + `noUncheckedIndexedAccess` across all packages
- API uses `nodenext` module resolution (requires `.js` extensions in imports)
- Web uses bundler resolution with path aliases (`@/*` → `./src/*`)

### Import Conventions

```typescript
// API: Always use .js extensions (nodenext resolution)
import { UserService } from './user.service.js';
import { member } from '@pepperextra/db/auth-schema';

// Web: Path aliases
import { orpc } from '@/utils/orpc';
```

### ESM Everywhere

- All packages are `"type": "module"`
- Workspace references use `"workspace:*"` protocol

---

## Known Issues & Workarounds

1. **Drizzle version mismatch** — `@pepperextra/db` and `apps/api` may have incompatible drizzle-orm types. Use `as any` casts or raw SQL when querying auth schema tables directly from the API.

2. **UserService is in-memory** — `apps/api/src/user/` uses hardcoded data, not connected to the real DB. It's a dev scaffold.

3. **OrganizationUserService.ban()** — operates on an in-memory array, not the real auth system. Incomplete/TODO.

4. **Path collision** — `contracts.planet.list` and `contracts.galaxy.list` both map to `GET /planets`. Galaxy endpoint may not be reachable.

5. **OpenAPI/Swagger** — commented out in `main.ts` but code structure is ready.

---

## Key Files Reference

| File | What It Does |
|---|---|
| `apps/api/src/app.module.ts` | Root NestJS module — auth factory, oRPC setup, org creation hook |
| `apps/api/src/main.ts` | NestJS bootstrap with CORS |
| `apps/api/src/db/database.module.ts` | DRIZZLE_TOKEN provider pattern |
| `apps/api/src/organization-user/` | Staff user CRUD via oRPC + Better Auth API |
| `packages/auth/src/auth.ts` | `createAuthInstance()` — Better Auth config factory |
| `packages/auth/src/client.ts` | React auth client |
| `packages/auth/src/org-access-control/` | Organization RBAC roles |
| `packages/auth/src/admin-access-control/` | Admin panel RBAC roles |
| `packages/db/src/auth-schema.ts` | All database table definitions |
| `packages/db/src/schema-relations/auth-relation.ts` | Drizzle relation definitions |
| `packages/contract/src/index.ts` | oRPC contract router composition |
| `packages/contract/src/users.ts` | User/staff contracts and Zod schemas |
| `.agents/agent.md` | Full product requirements document |

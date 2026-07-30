# AGENTS.md — BuildMate Technical Guide

> For full product requirements, read `.agents/01_BRD.md`.
> For database schema, read `.agents/02_DATABASE_SCHEMA.md`.
> For feature build order, read `.agents/03_FEATURE_MODULES.md`.
> For coding rules and patterns, read `.agents/04_CODING_AGENT_CONTEXT.md`.

---

## What Is BuildMate

Mobile-first SaaS platform for building material shops. Quotation engine with live alternative brand pricing, counter fulfilment stations, tradesperson loyalty via QR codes, **unified customer model** (retail/account/contractor) with customer self-service portal, and warranty management.

---

## Monorepo Layout

Same architecture and tooling as the reference project. Only business domain and naming differ.

```
buildmate/
├── apps/
│   ├── api/              # NestJS v11 backend (Express)
│   └── web/              # TanStack Start frontend (React 19, Vite 8)
├── packages/
│   ├── auth/             # @repo/auth — Better Auth config + client
│   ├── contract/         # @repo/contracts — oRPC contract definitions
│   ├── db/               # @repo/db — Drizzle ORM schema + client
│   ├── typescript/       # @repo/tsconfig — shared TS configs
│   └── ui/               # @workspace/ui — shadcn/ui component library
├── .agents/              # Agent skill files and project requirements
│   ├── AGENTS.md         # This file
│   ├── 01_BRD.md         # Full business requirements document
│   ├── 02_DATABASE_SCHEMA.md  # BuildMate-specific tables (Better Auth tables excluded)
│   ├── 03_FEATURE_MODULES.md  # Feature build order with API routes + UI screens
│   └── 04_CODING_AGENT_CONTEXT.md  # Rules, patterns, business logic, what not to build
└── AGENTS.md             # Root pointer (copy of this file)
```

---

## Key Naming Differences From Reference Project

| Concept | Reference project | BuildMate |
|---|---|---|
| Tenant identifier | `tenant_id` | `org_id` (maps to Better Auth `organization.id`) |
| Location identifier | `location_id` | `team_id` (maps to Better Auth `team.id`) |
| Tenant table | custom `tenants` table | Better Auth `organization` + `org_metadata` extension |
| Location table | custom `locations` table | Better Auth `team` + `team_metadata` extension |
| User table | custom `users` table | Better Auth `user` + custom fields already in schema |

> Better Auth `organization` = BuildMate tenant. Better Auth `team` = BuildMate location/branch.
> Every BuildMate business table carries `org_id` and where applicable `team_id`.
> Never use `tenant_id` or `location_id` in any BuildMate table — they are `org_id` / `team_id`.

---

## Tables Provided by Better Auth — Do NOT Recreate

The following tables are already created and managed by Better Auth (see attached schema):

- `user` — with `customAccountType` (`owner` | `staff`) and `passwordResetRequired` custom fields
- `session` — with `activeOrganizationId` (= org_id) and `activeTeamId` (= team_id)
- `account`
- `verification`
- `organization` — this IS the tenant; extend via `org_metadata` table
- `team` — this IS the location/branch; extend via `team_metadata` table
- `member` — org membership with role
- `teamMember` — team membership
- `invitation`

**Only build the tables listed in `.agents/02_DATABASE_SCHEMA.md`.** Those are the BuildMate-specific business tables.

---

## Stack & Commands

Same as reference project:

```bash
pnpm build          # Build all packages
pnpm dev            # API on :3000, Web on :3001
pnpm lint
pnpm typecheck
pnpm format

# Database (from packages/db)
pnpm db:generate    # Generate Drizzle migrations
pnpm db:push        # Push schema to DB
pnpm studio         # Drizzle Studio
```

---

## Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `BUILDMATE_DATABASE_URL` | API, DB | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | API, Auth | Session signing secret |
| `BETTER_AUTH_URL` | API, Auth | `http://localhost:3000` |
| `VITE_API_URL` | Web | API server URL |
| `VITE_DEPLOYMENT_MODE` | Web | `"cloud"` or `"local"` |
| `SINGLE_TENANT_MODE` | API | `"true"` for local installation |
| `DEFAULT_MARGIN_FLOOR` | API | `"2.00"` percent |
| `QR_POINTS_PER_SCAN` | API | `"10"` (configurable per org later) |

> **Note:** VAT rate and currency are no longer env vars — they are configured per-tenant via `org_metadata.countryId` → `countries` table → `currencies` + `tax_types`. Seed data provides GCC defaults.

---

## Critical Rules (Full Detail in `04_CODING_AGENT_CONTEXT.md`)

1. **Every query scoped by `org_id`** — no exceptions, ever
2. **Invoices are immutable** after issue — use credit notes for all adjustments
3. **Purchase receipts are append-only** — never UPDATE, only INSERT
4. **Cost price never auto-updates** — suggest highest recent delivery cost, require human approval
5. **QR codes once redeemed stay redeemed** — status never reverses
6. **Soft deletes only** — set `deleted_at`, never hard delete
7. **Tax calculated per line, per tax type** — rates from `tax_types` + `org_tax_config`, summed — never on subtotal
8. **All monetary values stored as integer minor units** (baisa/fils/halala) in DB — use `decimal.js` for conversion, never JS floating point

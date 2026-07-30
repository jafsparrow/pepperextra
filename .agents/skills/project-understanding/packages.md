Packages

Overview

- Internal packages live under `packages/` and are published to the local workspace only.
- Each package has a `package.json` with a name like `@repo/<name>`.
- They are consumed via workspace protocol (`"@repo/auth": "workspace:*"`).

Packages found (quick reference):

- `@repo/auth` (`packages/auth`)
  - Purpose: Better Auth configuration, server/client instances, RBAC plugin setup, custom fields (org/team metadata), session helpers, and TypeScript types.
  - Exports:
    - `better-auth` instance (server + client)
    - RBAC permissions and roles constants
    - `OrgCtx` type for NestJS guards
    - Auth hooks (email/password, magic link, organization, team)
  - Depends on: `@repo/db`, `better-auth`, `better-auth-plugin-rbac`, `better-auth-plugin-admin`
  - Key files:
    - `packages/auth/src/auth.ts`
    - `packages/auth/src/client.ts`

- `@repo/contract` (`packages/contract`)
  - Purpose: oRPC contract definitions for type-safe API calls between API and Web/Mobile.
  - Exports:
    - Procedure routers (quotations, invoices, catalog, stock, stations, payments, warranty, loyalty, customers, suppliers, reports)
    - Input/output Zod schemas for every endpoint
    - Client factory for TanStack Query + oRPC integration
  - Depends on: `@repo/auth` (for context types), `orpc`, `zod`

- `@repo/db` (`packages/db`)
  - Purpose: Drizzle ORM schema, relations, and database client factory.
  - Schema organization (in `src/schema/`):
    - `catalog.ts` — product_groups, products, product_location_overrides, catalog_requests
    - `price-lists.ts` — price_lists, price_list_overrides
    - `tags.ts` — product_tags, product_tag_assignments
    - `stock.ts` — stock
    - `stations.ts` — fulfillment_stations, fulfillment_station_lines
    - `quotations.ts` — quotations, quotation_lines
    - `invoices.ts` — invoices, invoice_lines, invoice_counters
    - `payments.ts` — payments
    - `credit-notes.ts` — credit_notes, credit_note_lines
    - `warranty.ts` — warranty_items, invoice_warranty_lines, warranty_claims, supplier_warranty_claims
    - `customers.ts` — customers, customer_contacts, customer_sites, site_contacts
    - `suppliers.ts` — suppliers, purchase_receipts
    - `loyalty.ts` — tradespeople, loyalty_redemptions, qr_codes
    - `metadata.ts` — org_metadata, team_metadata, user_metadata
  - Better Auth tables (DO NOT MODIFY): `auth-schema.ts` defines user, session, account, verification, organization, team, member, teamMember, invitation
  - Exports:
    - `DatabaseClient` type + `createDatabaseClient()` factory
    - `DRIZZLE_TOKEN` for NestJS DI injection
    - All schema tables and relations
    - Migration utilities (`db:generate`, `db:push`, `studio`)
  - Depends on: `drizzle-orm`, `postgres` (node-postgres), `decimal.js`

- `@repo/tsconfig` (`packages/typescript`)
  - Purpose: Shared TypeScript configs (base, nextjs, nestjs, react-library, expo).
  - Exports: Pre-configured `tsconfig.json` files extended by apps and packages.

- `@workspace/ui` (`packages/ui`)
  - Purpose: shadcn/ui component library built on Radix UI + Tailwind CSS.
  - Exports: All UI components (Button, Input, Table, Dialog, etc.), utility functions (`cn`, `formatCurrency`).
  - Used by: `apps/web`
  - Depends on: `tailwind-merge`, `clsx`, `lucide-react`, `@radix-ui/*`

Package scripts (run from repo root or inside package)

```bash
# Type-check all packages
pnpm typecheck

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Format all packages
pnpm format

# Database operations (run from packages/db)
pnpm --filter db db:generate
pnpm --filter db db:push
pnpm --filter db studio
```
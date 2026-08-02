# Module Resolution Fix: drizzle-orm Dual-Identity Type Mismatch

## Summary

The NestJS API (`apps/api`) was failing TypeScript compilation with a baffling error in several services:

```
Argument of type 'import(".../drizzle-orm/sql/sql", { with: { "resolution-mode": "import" } }).SQL<unknown>'
is not assignable to parameter of type
'import(".../drizzle-orm/sql/sql").SQL<unknown>'.
```

Both types *look* like the same `drizzle-orm` `SQL` type from the **same** installed version
(`drizzle-orm@1.0.0-rc.4`), yet TypeScript treated them as incompatible and reported failures deep
inside drizzle's own types (e.g. `Property 'resolveTypes' is protected but type ... is not a class
derived from ...`).

This is a **module-resolution identity bug**, not a logic bug. The runtime code was always fine —
it is purely a compile-time phantom.

## The symptom

The tell-tale sign is the import attribute in the error message:

```
import(".../drizzle-orm/sql/sql", { with: { "resolution-mode": "import" } })
```

When you see `resolution-mode: "import"` on one side of an error but not the other, TypeScript is
resolving the *same package* through two **different type identities**:

- One resolution went through the package's `import` condition (ESM types, `*.d.ts`).
- The other went through the `require` condition (CommonJS types, `*.d.cts`).

Because the types are loaded from different files, they are distinct modules to TypeScript, and
drizzle uses `protected` members, so even structurally-identical types fail nominal-style checks.

## Root cause

### 1. drizzle-orm 1.0.0-rc.4 ships dual types

Starting with `1.0.0-rc.4`, drizzle-orm's `package.json` `exports` map provides **separate type
files per export condition**, e.g. for `./sql/sql`:

```json
"./sql/sql": {
  "import":  { "types": "./sql/sql.d.ts",  "default": "./sql/sql.js" },
  "require": { "types": "./sql/sql.d.cts", "default": "./sql/sql.cjs" },
  "types": "./sql/sql.d.ts",
  "default": "./sql/sql.js"
}
```

- An **ESM** consumer gets `sql/sql.d.ts` (tagged `resolution-mode: "import"`).
- A **CommonJS** consumer gets `sql/sql.d.cts` (no tag).

### 2. `@repo/db` was declared as CommonJS while shipping ESM

`packages/db` had **no `"type": "module"`** field, even though it ships ESM (`main: ./dist/index.mjs`,
tsup `format: ["esm"]`, no `require()` anywhere). TypeScript therefore interpreted all of its
`dist/*.d.ts` declarations as **CommonJS**.

So when the API resolved drizzle-orm **from inside** `@repo/db`'s `.d.ts` files, TypeScript used the
`require` condition -> `*.d.cts` identity.

### 3. The API is ESM

`apps/api` is `"type": "module"` with `moduleResolution: "nodenext"`. Its own
`import { eq } from 'drizzle-orm'` resolved through the `import` condition -> `*.d.ts` identity
(tagged `resolution-mode: "import"`).

### The collision

Files that mixed the two sources failed:

```ts
import { eq } from 'drizzle-orm';       // ESM identity  (resolution-mode: import)
import { orgMetadata } from '@repo/db'; // CJS identity  (drizzle via require)
...
.where(eq(orgMetadata.orgId, organizationId)) // eq(...) is ESM SQL, orgMetadata is CJS SQL
```

`eq(...)` produced the ESM `SQL`, but the query builder (typed from `@repo/db`) expected the CJS `SQL`.
Both are "the same" type but from different module identities -> incompatible.

## Why it "worked before"

1. **The services were stubs.** When `organization-settings.service.ts` and `customer.service.ts`
   were first created they were in-memory mocks with no `drizzle-orm` / `@repo/db` imports. The DB
   implementation that mixes direct drizzle-orm imports with `@repo/db` tables was only added
   later (commits `5c7c608`, `c7169cd`, `4240013`).

2. **The incremental build cache masked it.** `apps/api/tsconfig.json` uses `incremental: true`
   (`tsconfig.build.tsbuildinfo`). tsc only re-checks files whose resolved type graph changed, so the
   latent mismatch was not re-reported until the `@repo/db` schema/re-export graph was invalidated
   (new schema work + the new `category/` module).

3. **It is compile-time only.** Both identities resolve to the same physical JS at runtime, so
   `nest start` / the dev server ran fine. Only a strict `tsc` run surfaced it.

## The `dz` workaround (and why it is only partial)

In `packages/db/src/index.ts`:

```ts
export * as dz from "drizzle-orm";
```

This re-exports the entire drizzle-orm namespace under `dz` through `@repo/db`'s own identity.
Services that route all drizzle helpers through `@repo/db` are immune to the mismatch:

```ts
import { dz } from '@repo/db';
import { products } from '@repo/db';
...
.where(dz.and(dz.eq(products.id, id), dz.isNull(products.deletedAt)))
```

`product.service.ts` uses exactly this pattern and never hit the `SQL` mismatch. **However**, the
workaround only protects files that never import drizzle-orm directly; files importing
`eq` / `and` / `sql` from `'drizzle-orm'` (org-settings, category, customer, planet controller) still
broke. The real fix makes every resolution land on the same identity, so `dz` becomes unnecessary
(though it remains a harmless convenience).

## The fix

Mark `@repo/db` for what it already is: an ESM package.

```jsonc
// packages/db/package.json
{
  "name": "@repo/db",
  "type": "module",            // <-- the fix
  "main": "./dist/index.js",   // tsup emits .js (not .mjs) once the package is "type": "module"
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
    // ...subpath exports unchanged
  }
}
```

Why this works: with `"type": "module"`, `@repo/db`'s `*.d.ts` declarations are read as **ESM**, so
drizzle-orm inside them resolves through the `import` condition -> `*.d.ts` — the exact same identity
the API's direct imports use. One identity everywhere, mismatch gone.

### Why it is safe for the NestJS / NodeNext API

- The API's `tsconfig.json` (`module`/`moduleResolution: nodenext`) and `package.json` are untouched.
- The change is metadata only on the dependency; it does not alter how the API emits or resolves its
  own modules.
- Runtime loading is unaffected: Node resolves `@repo/db` via `exports["."].default` -> `dist/index.js`,
  which is ESM regardless of the `type` field.
- `@repo/db` has no `.js`/`.cjs` runtime files and no `require()`/`module.exports` in source.
- `packages/auth` (the other consumer) is already `"type": "module"`.
- `./schema`, `./auth-schema` runtime entries point at `src/*.ts` and are unchanged.

## What changed (this fix)

| File | Change |
| --- | --- |
| `packages/db/package.json` | Added `"type": "module"`; `main` and `".".default` updated `./dist/index.mjs` -> `./dist/index.js` |
| `apps/api/src/product/product.service.ts` | Fixed a separate leftover bug in `deleteProduct()`: bare `and`/`eq`/`isNull` (TS2304, never imported) -> `dz.and`/`dz.eq`/`dz.isNull` |

## How to apply / reproduce

```bash
# 1. Ensure "type": "module" is set in packages/db/package.json
# 2. Rebuild the db package (tsup) then regenerate per-file declarations (tsc):
pnpm --filter @repo/db build
rm -f packages/db/.cache/tsbuildinfo.json   # force tsc to re-emit
(cd packages/db && npx tsc)

# 3. Clear the api incremental cache and typecheck
Get-ChildItem -Path apps -Recurse -Filter *.tsbuildinfo | Remove-Item
npx tsc --noEmit -p apps/api/tsconfig.build.json
```

Expected: `tsconfig.build.json` (what `nest build` runs) passes with exit code 0. The stray errors in
`apps/api/test/app.e2e-spec.ts` (jest globals / `supertest/types`) are pre-existing, unrelated, and
excluded from the build config.

## How to spot this class of bug in the future

- Any error containing `{ with: { "resolution-mode": "import" } }` is an **ESM/CJS type-identity split**.
- Keep each workspace package's `"type"` field aligned with its real module format.
- When a package ships ESM (`.mjs`/`type: module`/`format: ["esm"]`), set `"type": "module"` in its
  `package.json`; otherwise its `.d.ts` are read as CommonJS and every dependency with conditional
  `*.d.ts` / `*.d.cts` exports (like drizzle-orm rc.4+) becomes a second, incompatible type identity.

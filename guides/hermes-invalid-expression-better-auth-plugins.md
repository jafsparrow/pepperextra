# Hermes "invalid expression encountered" — better-auth server plugins index leaked into the mobile bundle

## Summary

The mobile app (`apps/mobile`) started failing inside Expo Go with:

```
invalid expression encountered in file ...\packages\auth\src\admin-access-control\roles.ts
```

The web app was fine. This is **not** an Expo Go / Android / Hermes bug and **not** a corrupted file. It is a
**bundle-composition bug**: the native bundle was pulling in the entire better-auth **server-side** plugin
index, and Hermes — the JS engine on Android/iOS — rejected a syntax construct inside it that V8 (web) parses
fine.

"Invalid expression encountered in file X" is the Hermes **parser/compiler** error for syntax it does not
support (see e.g. https://github.com/expo/expo/issues/46064 where Hermes fails on `import(nonLiteralVar)` in
an EAS build). The error names `roles.ts` because that module is what pulls the offending code into the graph.

## The symptom

- App runs in Expo Go, then crashes with `invalid expression encountered in file .../roles.ts`.
- Web (`apps/web`) works — same shared package, different engine (V8).
- Every individual file parses fine:
  - the `@repo/auth` source (`roles.ts`, `resource-permissions.ts`, `client.ts`) transforms cleanly with the
    Expo Babel preset,
  - the compiled `dist/*.js` chunks parse fine with `hermes-parser`,
  - nothing in better-auth throws that string at runtime.
- Running `expo export --platform android` (which runs `hermesc` over the whole bundle) fails/reveals the
  offending construct — a reliable reproduction.

## Root cause

### 1. Hermes accepts less syntax than V8

Hermes is a small, targeted engine. The **web** bundle runs on V8 and tolerates the modern syntax in
better-auth's server code; **Hermes** does not, and throws `invalid expression encountered` while parsing.

### 2. `roles.ts` imported from the better-auth barrel — the whole server plugin index

```ts
// packages/auth/src/admin-access-control/roles.ts  (before)
import { createAccessControl } from "better-auth/plugins"
```

`better-auth/plugins` is the **server** entry point. Its index re-exports every plugin: admin, organization,
OAuth providers (auth0, okta, slack, …), captcha, device authorization, JWT, etc. It transitively pulls in
DB adapters, `next/headers`, `@tanstack/*/server`, test-utils, node-only code — a large tree that belongs on
the server, never inside a native client bundle. When `@repo/auth/client` was imported on mobile, Metro
bundled all of it, and Hermes choked.

### 3. The org-access control was already fixed; the admin one was the outlier

The org roles file already used the minimal entry:

```ts
// packages/auth/src/org-access-control/org-roles.ts (already correct)
import { createAccessControl } from "better-auth/plugins/access"
import { defaultRoles } from "better-auth/plugins/organization/access"
```

So the app got *past* the org roles chunk and crashed on the admin-roles chunk — the only remaining broad
import reachable from the client.

### 4. Metro bundles `dist`, not `src`

`@repo/auth`'s `exports` map points `import` at `./dist/*.js` (`types` -> `./src/*.ts` is compile-time only;
Metro never matches the `types` condition). So editing the source alone changes nothing — the package must be
**rebuilt** so Metro picks up the new chunk.

## The fix

```ts
// packages/auth/src/admin-access-control/roles.ts  (after)
import { createAccessControl } from "better-auth/plugins/access"
```

`better-auth/plugins/access` is a tiny, self-contained module (only depends on `@better-auth/core/error`)
that exports the exact same `createAccessControl` API. Swapping the import removes the entire server plugin
tree from the native bundle.

```bash
pnpm --filter @repo/auth build          # regenerate dist (tsup) — REQUIRED, Metro bundles dist
pnpm --filter @repo/auth typecheck
npx expo start --clear                  # restart Metro with cleared cache, reload Expo Go
```

## What changed (this fix)

| File | Change |
| --- | --- |
| `packages/auth/src/admin-access-control/roles.ts` | `import { createAccessControl } from "better-auth/plugins"` -> `"better-auth/plugins/access"` |
| `packages/auth/dist/*` (regenerated) | `chunk-<hash>.js` now imports only `better-auth/plugins/access` |

Verified: `expo export --platform android` completes — `hermesc` compiles the whole bundle successfully and
`createAccessControl` is present in the bytecode.

## How to reproduce / verify

```bash
# 1. Reproduce: bundle with Hermes BEFORE the fix
npx expo export --platform android --output-dir C:\Users\jafar\AppData\Local\Temp\buildextra-export

# 2. Apply the fix (import from "better-auth/plugins/access")

# 3. Rebuild the shared package (Metro bundles dist, not src)
pnpm --filter @repo/auth build
pnpm --filter @repo/auth typecheck

# 4. Re-export — hermesc succeeds, then reload the app
npx expo export --platform android --output-dir C:\Users\jafar\AppData\Local\Temp\buildextra-export
npx expo start --clear
```

Expected: the export finishes, and Expo Go loads the app with no Hermes parse error.

## How to spot this class of bug in the future

- `invalid expression encountered in file X` on Android/iOS = **Hermes rejecting syntax** in `X` (or, more
  often, something `X` imports). V8 works, Hermes doesn't.
- Keep **server-only barrels out of client bundles**. For better-auth access control on the client, always
  import from the minimal subpath entries:
  - `better-auth/plugins/access` (`createAccessControl`, `role`)
  - `better-auth/plugins/organization/access` (`defaultRoles`, `defaultStatements`, …)
  - `better-auth/plugins/admin/access` (`defaultAc`, …)
  - **never** `better-auth/plugins` (the full server index) from code that ends up in a native bundle.
- After touching shared-package source, **rebuild it** (`pnpm --filter <pkg> build`) — Metro resolves
  `@repo/*` to `dist`, not `src`.
- When a Hermes-only error names a workspace file, grep the file's transitive imports for barrel/server
  entries:
  `grep -rn "from \"better-auth/plugins\"" packages --include="*.ts"` — only server-side files
  (`auth.ts`, `auth-config.ts`) may keep it.

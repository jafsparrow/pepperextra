# BuildMate — Mobile Catalog Sync Specification

> Read this document before implementing any local caching, offline search, or sync logic on the mobile app.
> This is the canonical spec for how product catalog, price lists, and stock data move between PostgreSQL (server) and expo-sqlite (device).

### Final implementation decisions (locked)

- **Version table:** `org_catalog_versions` — not `tenant_catalog_versions`. `org_id` = Better Auth `organization.id` (see naming convention in `../AGENTS.md`; never use `tenant_id`).
- **Version bump:** PostgreSQL trigger with once-per-transaction GUC dedup, covering **all** delta-synced catalog tables (see §3). The spec's original five-table list was superseded when the delta payload expanded to every local-data table (§5).
- **Delta payload:** every local-data table the device mirrors — `products`, `product_groups`, `categories`, `product_images`, `product_alternatives`, `price_lists`, `price_list_overrides`, `product_location_overrides`, `product_tags`, `product_tag_assignments` (§5).
- **Endpoints:** org-scoped oRPC paths — `GET /organizations/{organizationId}/catalog/version`, `GET /organizations/{organizationId}/catalog/sync`, `GET /organizations/{organizationId}/catalog/stock`, `POST /organizations/{organizationId}/catalog/revalidate` (§3, §5, §6).
- **Location param:** `teamId` — BuildMate's name for the spec's `location_id`, maps to Better Auth `team.id`.
- **Alternatives ordering:** `product_alternatives.sort_order` (auto-assigned `max + 1`, **no reorder endpoint**); ordered `sort_order ASC` then `is_primary DESC`.
- **Overrides & alternatives soft delete:** `removePriceListOverride` / `removeAlternative` set `deleted_at`; reads filter it out; re-adding restores the row (upsert-restore).
- **Stock:** independent stream, full per-location refresh, never bumps the catalog version; hard live check only at commit time.

---

## 1. Design Principles

1. **SQLite is the source of truth for on-device reads.** Search, browse, and alternatives lookups never hit the network directly — they query local SQLite. The network is only involved in the sync routine itself.
2. **Staleness of a few hours is acceptable** for catalog and price data. This is not a real-time system — cost price and base price changes are deliberate admin actions, not high-frequency events. Do not build real-time/push infrastructure (websockets, background-fetch tasks) for this.
3. **Stock is advisory everywhere except at the moment of commit.** Local stock numbers guide UI badges only. The only place stock correctness is enforced is a live server round-trip at quotation confirmation / invoice conversion.
4. **Delta sync, not field-diffing.** Every sync payload sends full rows for changed records, keyed by `updated_at`. No partial-field diffing — the complexity isn't worth it at this data volume.
5. **No PowerSync / CRDT-style continuous sync.** This is a single-writer-then-server-confirms model (staff device → server), not multi-device concurrent editing. Full bidirectional conflict resolution is unnecessary complexity — do not introduce it.

---

## 2. Tech Stack for Sync Layer

| Concern                   | Technology                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| Local database            | expo-sqlite                                                                                     |
| Local ORM / query builder | Drizzle ORM                                                                                     |
| Local reactive reads      | `useLiveQuery` (Drizzle + expo-sqlite) — auto re-renders UI when underlying local tables change |
| Network calls & mutations | TanStack Query                                                                                  |

**Critical separation of concerns:**

- `useLiveQuery` is used for **all local catalog/price/stock reads** that back UI (search results, alternatives screen, pinned widget, tag product lists). These are reactive — no manual cache invalidation needed.
- TanStack Query is used **only** for network calls: the sync routine's fetch, quotation confirm, invoice conversion, and other mutations. It does **not** wrap local SQLite reads. Do not layer TanStack Query on top of `useLiveQuery` results — that is double-caching.

---

## 3. Server-Side: Version Tracking

### `org_catalog_versions` table

> Spec note: earlier drafts named this `tenant_catalog_versions` / `tenant_id`. BuildMate maps it to
> `org_catalog_versions` / `org_id` — see the naming convention in `../AGENTS.md`. Never use `tenant_id`.

```sql
org_id          text PRIMARY KEY REFERENCES organizations(id)   -- Better Auth organization.id
version         integer NOT NULL DEFAULT 1
last_changed_at timestamptz NOT NULL DEFAULT now()
```

- Bumped **once per write transaction** that touches any delta-synced catalog table: `products`,
  `product_groups`, `categories`, `product_images`, `product_alternatives`, `product_tags`,
  `product_tag_assignments`, `price_lists`, `price_list_overrides`, `product_location_overrides`.
- **Implementation: PostgreSQL trigger**, not application code. One trigger function on the ten tables
  above upserts `org_catalog_versions` and dedupes per transaction with a transaction-local GUC
  (`set_config('app.catalog_bumped', 'true', true)`), so only the first catalog write in a transaction
  increments: a single product edit = one transaction = +1; a bulk CSV import wrapped in one transaction
  = +1, not +N. The transaction boundary is the natural debounce — do not build separate batching/debounce logic.
- **Stock changes must NOT bump this version.** Stock has its own independent tracking (see Section 6) —
  folding it into the catalog version would cause the version to change on every sale, defeating the
  purpose of version-gated sync.

### NestJS Interceptor

- Runs after org context resolution (not raw middleware) so it can scope by `org_id`.
- Attaches `X-Catalog-Version: <version>` header to every API response for that org.
- This is the **passive** sync signal — piggybacks on requests that are already happening.

### `GET /organizations/{organizationId}/catalog/version`

- Cheap, standalone endpoint returning the current version for the org.
- This is the **active** sync signal — used for triggers that fire before any other request naturally occurs (see Section 4).

---

## 4. Sync Triggers

Sync check (compare local stored version vs. server version) fires on:

1. **App launch** (cold start)
2. **App foreground resume** (`AppState` `background → active` transition)
3. **Login** (covers device handoff/reinstall/replacement — cheap to bolt onto the auth round-trip that already happens)
4. **Every 30 minutes while app is in foreground** (in-app timer, not OS background task)

**Explicitly do NOT build:**

- `expo-background-fetch` / background sync tasks. OS scheduling is unreliable (especially iOS) and this data doesn't need it — a device that's asleep isn't being used for search anyway, and the foreground/launch triggers cover it the moment it wakes up.
- Any push-based (websocket, server-sent) invalidation. Not justified at this staleness tolerance.

**Passive check:** every API response already carries `X-Catalog-Version`. If it doesn't match the locally stored version, queue a background delta sync (don't block the current screen).

---

## 5. Delta Sync — Full Local Catalog

### Endpoint

```
GET /organizations/{organizationId}/catalog/sync?since=<last_sync_timestamp>&teamId=<team_id>
```

(`teamId` is BuildMate's name for the spec's `location_id` — maps to Better Auth `team.id`.)

### Behavior

- Returns all rows where `updated_at > since` for every local-data table the device mirrors:
  `products`, `product_groups`, `categories`, `product_images`, `product_alternatives`, `price_lists`,
  `price_list_overrides`, `product_location_overrides`, `product_tags`, `product_tag_assignments`.
- **Full row per changed record** — no field-level diffing. Client performs `INSERT ... ON CONFLICT DO UPDATE` (upsert) per row.
- Soft-deleted rows (`deleted_at` set) **are included** in the delta payload, not filtered out server-side.

### Client handling of soft deletes

- Do **not** physically delete the local SQLite row when `deleted_at` is present.
- Instead, set `is_active = false` locally.
- Reason: historical quotations/invoices on-device may still reference this `product_id` by foreign key and need to resolve a name/description even after discontinuation. Physically deleting breaks that.
- Discontinued products excluded from active search results and alternatives screens.
- **Exception — pinned quick-access widget:** if a pinned product becomes inactive, show it greyed-out with a "discontinued" label (not silently removed). Staff pinned it deliberately; silent disappearance reads as a bug. Provide a one-tap remove affordance.
- **Overrides and alternatives (server-side soft delete + upsert-restore):** a soft-deleted
  `price_list_overrides`, `product_location_overrides`, `product_tag_assignments`, or `product_alternatives`
  row is kept locally and marked inactive (excluded from price resolution / alternatives lists). When the
  server re-adds the same record, the client upserts → the row is re-activated — never insert a duplicate.

### Price list resolution

- `price_list_overrides` syncs as its own small table via the same delta mechanism — do not precompute or flatten a "final resolved price" server-side or client-side.
- Resolve at **read time** via local SQLite join, in this order:
  1. `price_list_overrides` (if a price list is selected on the quotation)
  2. `product_location_overrides` (location-specific base price)
  3. `products.base_price` (tenant-wide default)
- This join is cheap — price list override tables are typically hundreds of rows, not thousands.

### First-install / cache-invalid case

- If local SQLite has no stored sync cursor (first install, corrupted DB, reinstall), treat as `since = null` → server returns the full catalog. This is the only case where a full (non-delta) payload is expected.

---

## 6. Stock Sync (Decoupled from Catalog)

Stock is handled differently from products/price-lists because it changes on every sale, all day — folding it into the same version-gate would cause constant unnecessary syncs.

### Bulk stock sync (advisory, for display only)

```
GET /organizations/{organizationId}/catalog/stock?teamId=<team_id>
```

- Synced on the **same triggers** as catalog sync (launch/foreground/login/30-min timer) but as an **independent stream** — stock changes never bump `org_catalog_versions` and never gate/trigger catalog sync.
- Small payload: one row per SKU per location. Full refresh of the stock table each cycle (not delta) — the table is small enough that this is cheap, and it avoids maintaining a separate stock-specific version cursor.
- Used only for UI badges: "3 left," low-stock indicators on search/alternatives screens.
- Never treated as authoritative. Never blocks or gates any UI action.

### Hard revalidation (authoritative, at commit only)

```
POST /organizations/{organizationId}/catalog/revalidate
Body: { skuIds: [...] }  // only the SKUs in the quotation being confirmed
```

- Fired **only** at quotation confirmation / invoice conversion — not on product detail view, not on bottom-sheet open, not during browsing.
- Server checks live stock for just the SKUs in that transaction, inside the same transaction that will decrement stock on confirm.
- If a discrepancy exists (e.g. "only 2 left, quoted 5"), surface it as a blocking message at this moment — the one point where being wrong actually costs a customer relationship.
- This endpoint is **separate from the delta sync mechanism entirely** — it must never be slowed down or batched with the regular catalog/price/stock sync cycle.

### Why not gate live stock checks to "product detail view opened"

Rejected as the general pattern: it would leave the multi-product alternatives screen (the core POC screen) with no stock info unless every visible alternative triggers its own live call, and it adds a network round-trip + spinner for a stage (browsing/comparing) where the customer hasn't been promised anything yet. Live checks are reserved for the actual commit moment.

---

## 7. Staleness Indicators (implementation guidance, not yet finalized)

Recommended default thresholds if/when a "last synced" or staleness UI signal is added:

- Price data: warn if local cache is >~15 min stale relative to last known sync (loose guidance — not a hard requirement given the few-hours tolerance in Section 1).
- Stock data: warn if >~5 min stale, since it's the more volatile of the two.

These thresholds are advisory starting points, not locked decisions — revisit if real shop-floor usage shows staff being misled by stale badges.

---

## 8. Summary Table

| Table                                         | Sync trigger                                                                          | Payload shape                                        | Special handling                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `products`, `product_groups`                  | Version-gated (launch / foreground / login / 30-min timer)                            | Delta, full row per change                           | Soft-delete → `is_active = false` locally, row retained                                                                 |
| `categories`, `product_images`                | Same version-gated cadence                                                             | Delta, full row per change                           | Soft-deleted rows included in payload; marked inactive locally                                                          |
| `product_alternatives`                        | Same version-gated cadence                                                             | Delta, full row per change                           | Ordered `sort_order ASC` then `is_primary DESC`; soft-delete + upsert-restore on re-add                                 |
| `price_lists`, `price_list_overrides`         | Same version-gated cadence                                                             | Delta, full row per change                           | Overrides resolved via local join at read time, not precomputed; soft-delete + upsert-restore                           |
| `product_location_overrides`                  | Same version-gated cadence                                                             | Delta, full row per change                           | Soft-delete + upsert-restore on re-add                                                                                  |
| `product_tags`, `product_tag_assignments`     | Same version-gated cadence                                                             | Delta, full row per change                           | Team-scoped rows; soft-delete + upsert-restore on re-add                                                                |
| `stock`                                       | Same trigger cadence, but **independent version** — never gates/triggers catalog sync | Bulk refresh (not delta), small per-location payload | Advisory only. Hard live check via `POST /catalog/revalidate` at confirm-time only, scoped to transaction SKUs          |

---

## 9. What NOT to Build (for this feature)

- Background-fetch / OS-scheduled background sync tasks
- Websocket or server-push based cache invalidation
- Field-level diffing in delta payloads
- Precomputed/flattened "resolved price" tables — resolve via join at read time
- PowerSync, WatermelonDB, or other CRDT-style multi-writer sync engines
- TanStack Query wrapping local SQLite reads (use `useLiveQuery` directly for that)
- Stock version coupled to catalog version
- Live stock checks triggered by product detail view or bottom-sheet open

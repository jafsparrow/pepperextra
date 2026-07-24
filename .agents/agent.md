# Cloud POS & Restaurant Management Platform — Project Requirements

> **Purpose of this file**: Ground-truth context for coding agents working in this repo. Read this in full before touching code. It reconciles the BRD, product context notes, and the final locked architecture decisions — where they conflict, **this file wins**.

---

## 1. What We're Building

A cloud-based, multi-tenant restaurant POS and management platform, evolving an existing locally-installed NestJS/Angular POS into a full SaaS product — with a parallel self-hosted deployment option for restaurants that need on-premise/offline-tolerant operation.

Targets restaurant groups with a multi-level org hierarchy (**Owner → Brand → Location**), covering staff operations, ordering, kitchen flow, printing, cash management, and delivery.

Three ordering surfaces, one shared menu UI:
1. **Staff App** (Expo) — waiter/captain/cashier place orders, auto-confirmed
2. **QR Table Ordering** — dine-in customer, held for confirmation
3. **Delivery Web UI** — delivery customer, held for confirmation

---

## 2. Locked Technology Stack

**⚠️ This supersedes any earlier mention of Next.js in prior docs. The frontend stack was deliberately pivoted.**

| Layer | Technology | Notes |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | |
| Backend API | NestJS (modular monolith) | Google Cloud Run, auto-scales, pay-per-use |
| End-to-end types | **oRPC** | Shared contract package across backend + all frontends |
| Web (dashboard + customer ordering app) | **TanStack Start** | Replaces earlier Next.js decision |
| Admin UI | Built directly inside the TanStack Start app | Not a CMS — operational concerns (provisioning, billing, permissions, health) don't fit CMS paradigms |
| Mobile/tablet (staff app incl. KDS) | **React Native via Expo** | iOS 14+, Android 10+ |
| Database | Supabase Postgres | Shared schema, `tenant_id` on every table |
| ORM | Drizzle ORM | Type-safe |
| Multi-tenancy posture | RLS-ready design; **RLS enforcement deferred** ("defer, not abandon") since all DB access currently routes server-side through NestJS | Every query filters by `tenant_id` first; every index leads with `tenant_id` |
| Auth | **Better Auth** | Across all three client surfaces. Tenant identity locked at **Brand level**. Location-level staff access is an application-layer `staff_location_access` grant table, not a tenant boundary |
| Cache & Queues | Upstash Redis | Serverless |
| Media Storage | Cloudflare R2 | Menu images, promo videos, CDN-delivered |
| Real-time | NestJS WebSocket Gateway | Order updates, print job dispatch |
| Print Protocol | ESC/POS over TCP:9100 | react-native-tcp-socket |
| CI/CD | GitHub Actions | |
| Self-hosted | Docker Compose | RSA-signed, `/etc/machine-id`-based licensing |

### Architecture principles
- **Modular monolith for v1** — not microservices. Each NestJS module (auth, tenants, brands, locations, menu, orders, printing, delivery, staff, reports) is fully self-contained (controllers, services, DTOs, entities). Clean boundaries so microservice extraction is possible later, but that complexity is deliberately deferred — the restaurant domain logic is still solidifying.
- **Multi-tenancy (Option A now, Option B preserved)**: shared schema with `tenant_id` column on every table today. Schema is deliberately designed so a future migration to per-tenant schema (Option B) is a scripted data-copy operation, not a restructuring. Triggered only by enterprise/regulatory need — not a v1 concern.
- **Marketing site is out of scope here** and is a separate project/concern where a headless CMS would be appropriate. Do not conflate it with the in-app Admin UI.

---

## 3. Tenant & Organisational Model

Three-tier hierarchy:

| Level | Entity | Description |
|---|---|---|
| 1 | Owner Account | Top-level billing entity. One login per owner. Cross-brand visibility. |
| 2 | Brand | A restaurant concept (e.g. "Burger House"). Owns the master menu and staff pool. **This is the tenant/auth identity boundary.** |
| 3 | Location | A physical site belonging to a brand. Has its own printers, tables, delivery config. |

### Dual identity (every entity)
- **UUID** — internal primary key, all DB relations and API calls
- **Slug** — human-readable, used in public URLs and QR codes, and future subdomain routing

```
Cloud URL:  ahmedburgers.yourapp.com/order/burger-house/muscat-mall?table=7
Fallback:   yourapp.com/order/ahmedburgers/muscat-mall?table=7
```

```
Tenant (Owner Account + Billing)
  └── id: UUID
  └── slug: 'ahmedburgers'

Brand
  └── id: UUID
  └── tenant_id: UUID
  └── slug: 'burger-house'

Location
  └── id: UUID
  └── brand_id: UUID
  └── tenant_id: UUID (denormalised for faster filtering)
  └── slug: 'muscat-mall'
```

### Staff model
Staff belong to a **Brand**, not a Location. Location-level access is granted via an application-layer grant table (`staff_location_access`), not the auth/tenant boundary. A staff member may access multiple locations within the same brand but never a different owner's locations.

| Role | Scope | Key Responsibilities |
|---|---|---|
| Admin | Platform | SaaS operator. Full system access. |
| Owner | Tenant | Cross-brand reporting, billing, staff creation. |
| Manager | Location | Menu management, staff management, reports. |
| Captain | Floor section | Confirms customer QR orders, voids items, closes tables. |
| Waiter | Assigned tables | Takes orders, sends to kitchen. |
| Cashier | Counter | Processes payment, manages print hub, day start/end. |
| Kitchen Staff | Kitchen zone | Views and updates kitchen display orders. |
| Rider | Delivery | Assigned delivery orders, updates delivery status. |

### Permission matrix

| Action | Kitchen | Waiter | Captain | Cashier | Manager | Owner |
|---|---|---|---|---|---|---|
| View/update kitchen orders | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Take table orders | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Confirm customer QR orders | ❌ | ❌ | ✅* | ✅ | ✅ | ✅ |
| Void an item | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Apply discount | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Close/bill a table | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage menu | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View location reports | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage staff | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Cross-location reports | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

\* If no Captain is assigned at a location, Cashier assumes confirmation responsibility.

---

## 4. Menu Management

Menu is defined at **Brand** level and inherited by all Locations. Locations may customise their inherited menu without modifying the brand master.

| Level | Can Do |
|---|---|
| Brand (master) | Create/edit categories, items, prices, kitchen zone assignments, customisation groups |
| Location (override) | Override item price, mark item unavailable, add location-exclusive items |

### Menu item schema
- `name_en`, `name_ar` (multilingual, extensible to more locales)
- `description_en`, `description_ar`
- `contents`/ingredients (multilingual)
- `images[]` — multiple photos
- `promo_video_url` — optional short video
- `price` (base, overridable per location)
- `kitchen_zone` — which printer/display receives this item
- `customisation_groups[]`

### Customisations (modifiers)
| Property | Description |
|---|---|
| name | Group label (multilingual), e.g. "Choose toppings" |
| type | `single_select` \| `multi_select` |
| required | Whether customer must select |
| min_selections / max_selections | Bounds on number of choices |
| options[].name | Option label (multilingual) |
| options[].price_adjustment | 0.000 = free, positive = extra charge |
| options[].is_default | Pre-selected for customer |

Customisation selections print **verbatim** on KOTs.

---

## 5. Ordering Surfaces & Flow

| Surface | Entry Point | Who Uses It | Auto-confirm? |
|---|---|---|---|
| Staff App (Expo) | Role-gated page in Expo app | Waiter, Captain, Cashier | Yes — prints immediately |
| QR Table Ordering | `yourapp.com/order/{slug}?table=N` | Dine-in customer | No — held for confirmation |
| Delivery Web UI | `yourapp.com/order/{slug}` | Delivery customer | No — held for confirmation |

### Confirmation rules
- Staff-placed orders are auto-confirmed and sent to kitchen immediately.
- Customer-placed orders (QR or delivery) are held pending confirmation.
- Captain confirms floor QR orders if a Captain exists at the location; **Cashier is the fallback confirmer**.
- Cashier always handles delivery order confirmation.

### Ticket model — critical
Each customer submission is a **discrete, timestamped ticket**. Tickets from the same table are **never merged**.

```
Table 7 — 18:05 → Ticket #1: 2x Burger, 1x Fries    [confirmed] → prints
Table 7 — 18:22 → Ticket #2: 2x Juice, 1x Dessert   [confirmed] → prints
Table 7 — Bill  → Consolidated: all confirmed tickets summed
```

### Item-level rejection
Captain/Cashier may reject individual items rather than the whole ticket:
- Approved items print to kitchen immediately.
- Rejected items trigger a toast notification on the customer's QR screen ("Some items in your order are unavailable" → tap View → see specifics).
- Customer may resubmit a new ticket without the rejected items.

### Table Management
- Locations define **Sections** (e.g. Ground Floor, Rooftop, Garden, Bar).
- Each Section contains **Tables** with number/name, seating capacity, shape.
- Table statuses: `Available | Occupied | Reserved | Cleaning`.
- Each table has a unique QR code URL generated by the system.
- Visual floor map with drag-and-drop table arrangement in the manager dashboard.

> **⚠️ Build-order note**: Table Management must be implemented **before** Ordering — orders reference tables, so tables must exist first, despite any numbering in the PRD that suggests otherwise.

---

## 6. Kitchen Flow & Display

### Kitchen zones
Each menu item is assigned to a kitchen zone (e.g. Grill, Bar, Pastry). On order confirmation, the system splits the order by zone and routes each portion only to the relevant printer/display. One order may generate multiple zone-specific KOTs.

### Kitchen Display System (KDS)
Kitchen staff use the **same Expo staff app** — their role auto-routes them to the KDS page. No extra hardware/app.

- Each confirmed ticket appears as a card, chronological order, never merged.
- Kitchen staff tap **READY** when prepared.
- Captain/Waiter gets notified: "Table 4 — Grill items ready for pickup".
- Captain taps **SERVED** → ticket clears from KDS.

### Ticket aging (visual urgency)
| Time Since Confirmed | Card Colour | Meaning |
|---|---|---|
| 0–5 min | White | Normal |
| 5–10 min | Yellow | Getting late |
| 10+ min | Red | Urgent — notify captain |

### KOT vs Bill — critical distinction
| Document | Trigger | Content | Language | Print Method |
|---|---|---|---|---|
| KOT | Auto on order confirmation | Zone-specific items, table, ticket#, timestamp | English only | Raw ESC/POS text |
| Final Bill | Cashier-triggered only | All confirmed tickets consolidated, total | Arabic + English | HTML → WebView bitmap |
| Z-Report | End of day by cashier | Full day summary, cash reconciliation | English | Raw ESC/POS text |

---

## 7. Print Architecture — **the single most critical non-functional priority**

### Core architecture
The **cashier tablet is the print hub** for the entire location — no dedicated print server hardware. It holds a persistent WebSocket connection to the cloud backend and talks to all LAN-connected thermal printers directly via TCP port 9100 (raw ESC/POS).

```
Cloud → WebSocket → Cashier Tablet (Print Hub)
                         → TCP:9100 → Kitchen Printer 1 (Grill)
                         → TCP:9100 → Kitchen Printer 2 (Bar)
                         → TCP:9100 → Counter Printer
```

**Why the cashier tablet**: always powered on and in active use, already on the LAN, zero additional hardware, printer IPs configured once in cloud admin and updateable remotely.

### Arabic printing solution
ESC/POS is ASCII-only and can't natively render Arabic. Solution: render Arabic content as a **bitmap** before sending to the printer.

- **Final bills** (Arabic + English): HTML template → hidden WebView → captured as bitmap via `react-native-view-shot` → sent as ESC/POS raster image command (`GS v 0`).
- **KOTs**: English only, raw ESC/POS text — no rendering overhead.
- **This deliberately avoids server-side Puppeteer**, which previously caused a 3–4 second rendering delay. WebView bitmap was chosen for reliability and RTL fidelity.

### Paper width support
Two CSS templates, configured per printer at the location:
- 58mm: 384px width at 203dpi
- 80mm: 576px width at 203dpi

### Print reliability requirements (mandatory, non-negotiable)
- Every print job saved to a local queue on the cashier tablet before transmission.
- Failed jobs retried up to 3 times with exponential backoff.
- After 3 failures: unmissable visual alert + sound on cashier screen.
- Print jobs are **never** silently dropped.
- If internet drops but LAN is intact: already-queued jobs keep printing.
- If HTML render fails: fall back to English-only raw ESC/POS bill immediately.

### Day start / day end (cash sessions)
- Cashier opens a session with an opening float amount.
- All orders during the session link to that session.
- Z-Report: gross sales, discounts, net sales, payment method breakdown, cash reconciliation (expected vs actual), top items, orders per staff member.
- Variance between expected and actual cash is flagged with a warning.

---

## 8. Delivery

### Customer flow
1. Customer visits the location's delivery URL (`yourapp.com/order/{slug}`).
2. Browses the same menu UI used for QR dine-in (multilingual, images, videos).
3. Enters name, phone, and drops a pin or types an address.
4. System validates the address is within the location's configured delivery radius.
5. Order is held for cashier confirmation before printing to kitchen.

### Delivery configuration (per Location)
- Delivery radius (km, geo-radius from location coordinates).
- Delivery fee: flat rate or tiered by distance.
- Minimum order value (optional).

### Rider assignment & tracking
- Rider role assigned from tenant staff pool.
- Cashier/manager assigns a rider to a confirmed delivery order.
- Status progression: `Placed → Confirmed → Preparing → Out for Delivery → Delivered`.
- Third-party rider support: same model, external rider name/phone stored as reference.
- Customer can view live status on their delivery URL session.

---

## 9. Multilingual Support

| Surface | Language Support | Notes |
|---|---|---|
| Staff Expo App | English only | Kitchen/floor staff operate in English |
| QR Ordering UI | Arabic + English | Defaults to Arabic, customer can toggle |
| Delivery Web UI | Arabic + English | Defaults to Arabic, customer can toggle |
| KOT (thermal print) | English only | Industry standard in professional kitchens |
| Final Bill (thermal print) | Arabic + English | Bitmap rendering via WebView |
| Admin/Manager Dashboard | English | Phase 2: Arabic if needed |

All menu item fields (name, description, contents) are stored in multilingual variants (`_en`, `_ar`), schema designed for additional language codes later. RTL layout applies automatically when Arabic is active.

---

## 10. Payments

### Launch (manual)
Cashier handles payment manually; system records method and marks order paid. No gateway integration at launch.

| Field | Launch Value | Future Value |
|---|---|---|
| method | cash \| card | + online, thawani, omannet, stripe |
| status | pending \| paid | + refunded \| failed |
| gateway | null | thawani \| omannet \| stripe |
| gateway_transaction_id | null | populated by gateway webhook |
| collected_by | staff_id of cashier | null for online payments |

The data model is designed so future gateway integration requires no schema changes.

---

## 11. Offline Behaviour (v1)

No offline-first operation in v1 — this avoids sync-conflict complexity and prevents a flood of queued orders printing simultaneously on reconnection.

| Scenario | Behaviour |
|---|---|
| Internet drops | Red banner across all staff app screens immediately (within 5s) |
| New order creation | Blocked while offline, staff clearly informed |
| Current open tables | Visible read-only from last known state |
| Print jobs already queued | Continue retrying over LAN — printing doesn't require internet |
| Reconnection | Banner disappears, full functionality auto-restored |

Key distinction: "internet required" vs "LAN sufficient" — the cashier tablet keeps printing already-confirmed orders during an internet blip because the printer is on the same LAN. Only *new* orders from the cloud are blocked.

---

## 12. Subscription & Billing Model

| Component | Detail |
|---|---|
| Base License | Annual. 1 Brand, 1 Location, unlimited staff and orders. |
| Additional Location | Annual add-on per extra location under the same brand. |
| Additional Brand | Annual add-on per extra brand under the same owner account. |
| Monthly Option | ~20% premium over annual equivalent. |
| Trial Period | 10–15 days full access, no credit card. |
| Data on Trial Expiry | Retained. Read-only mode after 7-day grace period. |
| Grace Period Post-Expiry | 7 days, system operational with renewal prompt. |
| Local Install | Higher one-time fee + lower annual renewal. |

### Trial & onboarding
- Register with name, email, phone, country, timezone — no credit card.
- Guided setup wizard (cannot be skipped): **Brand → Location → Menu → Kitchen Zones → Staff → App Download → Test Order**.
- System considered "activated" when the first real order is placed successfully.
- Conversion prompts at day 7 and day 13 of trial.

---

## 13. Self-Hosted / Local Installation

### Overview
Same codebase, self-hosted for restaurants without reliable internet or enterprise clients needing on-premise data residency. Deployment target controlled by `DEPLOYMENT_MODE=local|cloud`.

### Deployment package
- Docker Compose file with all services (NestJS backend, web frontend, PostgreSQL, Redis).
- `install.sh` (Linux/Mac) / `install.ps1` (Windows) — installs Docker if needed, activates license, starts all services.
- `update.sh` — pulls latest images, restarts with zero downtime.
- Staff Expo app points at the local server IP — no other config needed.

### Feature delta (Cloud vs Local)
| Feature | Cloud | Local |
|---|---|---|
| Core POS / KDS / Printing / QR Ordering / Delivery / Multilingual UI / Reports | ✅ | ✅ |
| Push Notifications | ✅ | ⚠️ Polling fallback |
| Automatic Updates | ✅ | ❌ Manual update script |
| Multi-location Cloud Sync | ✅ | ❌ Single location per install |
| Offsite Data Backup | ✅ | ❌ Restaurant's responsibility |
| Access from Outside LAN | ✅ | ❌ LAN only |

### Licensing — activation flow
1. Owner purchases local license → license key + install script.
2. `install.sh` reads `/etc/machine-id` from host OS → generates machine fingerprint.
3. Script calls licensing server: `POST /activate {key, fingerprint}`.
4. Licensing server validates, ties key to fingerprint, returns RSA-signed `license.dat`.
5. `license.dat` written to `/etc/yourapp/` on host machine.
6. **`/etc/machine-id` mounted read-only into the Docker container.**

### Runtime validation (inside container)
- On every boot: app reads `/app/machine-id` (host file via volume mount).
- Generates fingerprint fresh at runtime — cannot be spoofed by copying files.
- Verifies RSA signature on `license.dat` using hardcoded public key in source.
- Checks fingerprint match and expiry date.

### Heartbeat & offline grace
- Daily heartbeat refreshes `license.dat`.
- No internet: last valid `license.dat` accepted for up to 7 days.
- After 7 days without heartbeat: warning banner only, system still operates.
- After 30 days: read-only mode.
- **System never hard-kills mid-service** — grace periods are non-negotiable.

### Anti-piracy design
- Private key lives only on the licensing server — never distributed.
- Public key baked into app source — verify only, cannot sign.
- Read-only volume mount of `/etc/machine-id` is the anti-bypass mechanism (cleaner than file-copy detection): copying `license.dat` + `docker-compose.yml` to another machine fails because that machine's actual `/etc/machine-id` differs.
- Threat model: restaurant owners, not sophisticated attackers — this level of protection is appropriate.

---

## 14. Local → Cloud Migration

Both deployment modes use identical PostgreSQL schemas with `tenant_id` on every table, so migrating a self-hosted restaurant to the cloud is:

```
pg_dump local_db | psql cloud_db
```

Data slots directly into the shared cloud schema — no transformation, no ETL, no restructuring. This is deliberate: it removes friction from the upgrade path.

---

## 15. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Print reliability | Zero silent failures. Every job queued, retried, alerted on failure. |
| KOT latency | Print within 2 seconds of order confirmation, normal conditions. |
| Bill render latency | Arabic bill bitmap rendered and printed within 1 second (WebView, not Puppeteer). |
| Offline detection | Internet loss detected and surfaced to staff within 5 seconds. |
| Multi-tenant isolation | No query may return data across tenant boundaries (enforced via Brand-scoped auth + `tenant_id` filtering server-side; RLS enforcement deferred, not abandoned). |
| Availability (cloud) | 99.9% uptime target. Cloud Run auto-scaling handles lunch/dinner peaks. |
| Mobile support | Expo app targets iOS 14+ and Android 10+. |
| Browser support | QR/delivery web UI: last 2 versions of Chrome, Safari, Firefox. |
| Paper width support | 58mm and 80mm thermal paper via separate CSS templates. |

---

## 16. Out of Scope (v1)

- Online payment gateway integration (data model ready, integration deferred)
- Microservices architecture (modular monolith ships first)
- Inventory / stock management
- Loyalty / rewards programme
- Table reservations
- Marketing site / CMS (separate concern — headless CMS appropriate there, not this repo)
- Schema-per-tenant migration (triggered only by enterprise/regulatory need)
- Offline-first operation with sync (deferred — conflict complexity)
- Third-party delivery platform integration (Talabat, etc.)
- RLS policy enforcement at the DB level (deferred while all access is server-side via NestJS; schema remains RLS-ready)

---

## 17. Execution Plan for Coding Agents

- The PRD defines **FR-1 through FR-15** as the functional requirement breakdown for implementation.
- **Sequencing override**: build **FR-9 (Table Management) before FR-6 (Ordering)**, despite the numbering — orders reference tables, so tables must exist first. Treat any FR numbering as a checklist, not a build order; confirm actual dependency order before starting each FR.
- Use the shared `oRPC` contract package as the source of truth for API types across NestJS, the TanStack Start web app, and the Expo app — do not hand-roll parallel type definitions per surface.
- Every new table must include `tenant_id` as a column and as the leading column in any composite index, even though RLS enforcement itself is deferred.
- Any print-related work should be treated as the highest-scrutiny code in the repo — see Section 7 reliability requirements before implementing.

---

## 18. Glossary

| Term | Definition |
|---|---|
| KOT | Kitchen Order Ticket. Printed per kitchen zone on order confirmation. English only. |
| KDS | Kitchen Display System. The kitchen-facing page in the Expo staff app showing live order cards. |
| ESC/POS | Escape/Point of Sale. Byte-level command language used by thermal printers. |
| Print Hub | The cashier tablet acting as WebSocket receiver and TCP print dispatcher for the location. |
| Tenant | A restaurant owner account. Top-level billing and isolation unit (identity anchored at Brand level). |
| Brand | A restaurant concept owned by a tenant. Holds the master menu and staff pool. Auth/tenant boundary. |
| Location | A physical restaurant site belonging to a brand. |
| Slug | Human-readable URL identifier (e.g. `ahmedburgers`). Paired with a UUID for internal use. |
| Z-Report | End-of-day cash session summary report printed by the cashier. |
| Captain | Senior floor staff role. Confirms customer QR orders and coordinates waiters. |
| Rider | Delivery staff role. Assigned to and fulfils delivery orders. |
| Float / Opening Float | Cash amount in the drawer at the start of a cashier session. |
| Ticket | A single customer order submission. Multiple tickets may exist per table visit, never merged. |
| Bitmap Print | Rendering HTML to an image before sending to the thermal printer. Used for Arabic content. |
| machine-id | Unique OS-generated identifier used for license fingerprinting. |
| RLS | Row Level Security. Postgres feature; schema is RLS-ready, enforcement deferred to a later phase. |

---

*This file merges and supersedes the earlier BRD and project-context notes where they conflict with locked decisions (notably: TanStack Start replaces Next.js as the web framework; RLS enforcement is deferred; Admin UI is built in-app, not via CMS).*

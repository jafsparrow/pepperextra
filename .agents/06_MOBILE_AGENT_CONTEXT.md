# BuildMate Mobile — Coding Agent Context

> Read this document before writing any code for the BuildMate **mobile app** (`apps/mobile`).
> This is the counter/shop-floor/station-staff surface — not the web admin panel.
> Companion to `04_CODING_AGENT_CONTEXT.md` (backend rules) — that document still governs
> multi-tenancy, immutability, VAT, and business logic. This document governs **mobile-specific**
> patterns: styling, auth, data contracts, offline sync, printing, and PDF delivery.

---

## 1. Confirmed Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React Native (Expo) | Native builds only — **no Expo Web** for this app (see §2) |
| Styling | Uniwind | Confirmed by Jafar. |
| Auth | Better Auth | Expo client (`@better-auth/expo` or equivalent cookie/session bridge) |
| Data contracts | Drizzle schema → Zod, exported from `packages/contracts` | Single source of truth for request/response shapes — see §5 |
| Local persistence | `expo-sqlite` | Offline catalog cache, draft quotations |
| PDF generation | Backend (NestJS) — **locked** | See §8. Mobile downloads/shares, never renders. |
| ORM (backend only) | Drizzle | Mobile never talks to Drizzle directly — only via API + contracts |

One item remains **explicitly undecided**: **thermal printer integration** (§9).

---

## 2. Why No Expo Web

This app must build for **iOS and Android only** (EAS build, not Expo Go in production). Do not add web output targets or attempt to make screens web-compatible. Three hard blockers:

1. **`expo-sqlite` has no production-ready web backend.** The offline catalog sync (§6) is a core differentiator and does not function on web.
2. **QR scanning degrades on web** — falls back to `getUserMedia` + JS decoding instead of native camera APIs, with unreliable permissions and worse performance in bright shop-floor lighting.
3. **Thermal printer SDKs are native modules** (Bluetooth/USB). No dependable cross-platform web equivalent exists.

The web admin panel (TanStack Start) is a **separate app** in `apps/web` — do not attempt to unify them beyond `packages/shared` and `packages/contracts`.

---

## 3. Monorepo Position

```
buildmate/
  apps/
    api/          → NestJS backend (owns Drizzle schema)
    web/          → TanStack Start web admin (separate app, not this doc's concern)
    mobile/       → THIS APP — React Native Expo
  packages/
    contracts/    → Zod schemas derived from Drizzle (drizzle-zod), DTOs, shared enums
    shared/       → cross-cutting types/constants not tied to DB schema
    ui/           → web-only shared components — do NOT import into mobile
```

Mobile imports from `packages/contracts` and `packages/shared` only. Never import anything from `apps/api` or `packages/ui` directly.

---

## 4. Styling — Uniwind

- Tailwind-syntax styling via `className` on RN primitives, per Uniwind's convention. No inline `StyleSheet.create` for new screens unless Uniwind genuinely can't express the requirement (rare edge cases — certain shadow/elevation combinations) — if so, isolate the exception in a `.styles.ts` file next to the component and comment why it exists.
- Design tokens are **already locked** in the BRD — implement them as theme extensions in the Uniwind config, not as ad-hoc hex values or spacing numbers inline in components:
  - High-contrast light UI as the base surface
  - Warm sand — surface/background
  - Deep amber — primary accent (CTAs, confirm actions)
  - Steel blue — alternative-brand rows on the quotation screen
  - Green — savings indicators
- All screens are designed against the primary user context: **shop staff at a counter, mobile device, bright environment.** Favor high contrast, large tap targets, minimal nested navigation. Do not introduce dense/low-contrast patterns common in generic admin UI kits.
- Dark mode: not a current requirement. Do not build it speculatively.

---

## 5. Data Contracts Pattern

`packages/contracts` exports Zod schemas generated from the Drizzle schema (`drizzle-zod`), plus request/response DTOs that wrap them. This is the **only** source of truth for shapes crossing the mobile ↔ API boundary.

```typescript
// packages/contracts — example shape
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { quotations, quotationLines } from './schema';

export const QuotationSchema = createSelectSchema(quotations);
export const CreateQuotationLineSchema = createInsertSchema(quotationLines).omit({
  id: true,
  tenant_id: true, // never sent from client — injected server-side from JWT
});
export type Quotation = z.infer<typeof QuotationSchema>;
export type CreateQuotationLine = z.infer<typeof CreateQuotationLineSchema>;
```

**Rules for mobile code:**

- Never hand-write a type that duplicates a contract schema. If a shape doesn't exist in `packages/contracts` yet, add it there first — don't define it locally in `apps/mobile`.
- Validate API responses against the contract schema at the network boundary (in the API client, not scattered in components) so a backend drift fails loudly and early rather than producing silent `undefined`s in the UI.
- `tenant_id` and `location_id` are **never** constructed or edited client-side. They arrive via the JWT/session and are injected server-side. If a contract schema includes these fields, mobile must never populate them in a request payload.
- Local SQLite cache tables should mirror contract shapes as closely as possible (see §6) so the same Zod types validate both the network payload and what gets read back out of local storage.

---

## 6. Local Catalog Sync (Offline)

- `expo-sqlite` holds a local mirror of: product catalog, product groups, alternatives, categories, product images, price lists (+ overrides), location overrides, tags, and stock snapshots.
- Delta sync using `updated_at`, matching the pattern already defined in `04_CODING_AGENT_CONTEXT.md` §6.1 — do not invent a second sync strategy.
- **UUIDs are generated client-side** (UUID v4) at record-creation time for anything created offline (e.g. a draft quotation line) — this is a locked architectural decision so offline-created records never need temp-ID reconciliation on sync.
- Search-as-you-type on the quotation screen must hit local SQLite first; API is a fallback only when the local cache is empty or stale (>1 hour), per existing rule.
- What is safe to create offline vs. what requires network, per existing rules:

| Action | Offline-capable? |
|---|---|
| Draft quotation creation, line items, alternatives view | ✅ Yes — local catalog cache |
| Confirming a quotation | ✅ Yes — queue and sync when reconnected |
| QR scan / redemption | ❌ No — anti-fraud validation must be server-side, always live |
| Fulfilment/station status updates | ❌ No — must reflect real-time across staff |
| Cost price / margin data | ⚠️ Cache last-synced value, but always show the "last updated" timestamp so staff know if it's stale |

- Show a persistent, unmissable offline indicator in the app header whenever the device has no connectivity — staff need to know when they're looking at cached data.

---

## 7. Authentication — Better Auth (Expo)

- Session/token stored via `expo-secure-store` — never `AsyncStorage` for anything auth-related.
- JWT claims consumed on mobile: `tenant_id`, `location_id` (null only for owner), `role`, `permissions[]`. Mirror the shape defined in `04_CODING_AGENT_CONTEXT.md` §3.1 exactly — do not redefine a separate claims shape for mobile.
- Role-aware UI: hide/disable screens and actions the current role can't perform (station staff never see the margin bottom sheet, salesperson never sees invoice/payment screens, etc.) per the permissions matrix in `01_BRD.md` §6.3 — but this is a UX convenience only. The API is the actual enforcement boundary; mobile must never treat client-side hiding as security.
- First-login forced password change and owner-initiated resets both need dedicated screens per existing MODULE 02 spec — don't skip the forced-change flow even though it adds a step, since staff accounts are owner-provisioned only (no self-registration).

---

## 8. PDF Generation & Delivery — **Locked: Backend-generated**

NestJS renders all PDFs (quotations, invoices, credit notes). Mobile never renders a PDF locally — it only requests, downloads, and shares one.

- One renderer serves mobile, the web admin panel, and the contractor portal — keeps OTA/VAT-compliant document formatting consistent across all three surfaces instead of maintaining three separate templates that can drift out of sync.
- Mobile flow: `POST /quotations/:id/pdf` (or `/invoices/:id/pdf`, `/credit-notes/:id/pdf`) → API returns a file URL → mobile downloads via `expo-file-system` into `FileSystem.cacheDirectory` → shares via `expo-sharing` (WhatsApp / print / email sheet). Per existing rule, PDFs are never stored permanently on-device — cache only, cleared opportunistically.
- **This requires network.** PDF generation and delivery is not part of the offline-capable action set in §6 — if a salesperson confirms a quotation offline, the PDF share step waits until connectivity returns. Surface this clearly in the UI (e.g. disable the WhatsApp/print button with an explanatory state, don't fail silently).
- `expo-print` is not part of this app's PDF pipeline. Don't introduce it for this purpose — if a genuinely separate need for on-device HTML rendering comes up later (unrelated to invoices/quotations/credit notes), treat that as a new decision, not a reuse of this pipeline.

---

## 9. Thermal Printer Integration — **OPEN DECISION**

Not yet locked — no specific printer hardware/model has been confirmed. This affects fulfilment station slip printing (MODULE 10) and any optional per-counter receipt printing.

**What's known:**
- Printer identity doubles as station/go-down identifier (`fulfillment_stations.printer_name`), already reflected in the schema.
- Must support **print and reprint on demand**, per-station, at any time (locked business requirement).

**What's not decided:** the actual printer hardware and therefore the SDK/protocol.

| Option | Notes |
|---|---|
| Bluetooth ESC/POS (most common for shop thermal printers) | Needs a native module — e.g. `react-native-ble-plx` for raw BLE, or a vendor SDK if the printer manufacturer ships one (many do, e.g. Epson, Xprinter, Zjiang) |
| Network/IP thermal printer | Simpler in some ways (no BLE pairing UX), but requires printers on the same LAN as the counter device — worth confirming shop Wi-Fi reliability first |
| USB (tablet + wired printer) | Least likely given "any phone or tablet, zero hardware cost" positioning, but technically simplest |

**Action needed before building this module:** confirm the actual printer model(s) intended for deployment. ESC/POS-over-Bluetooth via a vendor-supplied React Native SDK is the most common path for this class of hardware, but committing to an SDK before hardware is chosen risks building against the wrong API. Treat printing as a **pluggable interface** (`printStationSlip(stationId, payload)`) so the underlying transport (BLE/IP/USB) can be swapped without touching calling code in the fulfilment screens.

---

## 10. QR Scanning

- `expo-camera` with barcode scanner, QR format only.
- Debounce scans — ignore duplicate reads within 2 seconds of a successful scan.
- Always requires network — validation is server-side only (anti-fraud), never trust a local "looks valid" check.
- Visual feedback must be immediate and unambiguous:
  - 🟢 Green — valid, points awarded
  - 🔴 Red — already redeemed, show who/when
  - 🟠 Orange — invalid code
- This pattern is locked in `04_CODING_AGENT_CONTEXT.md` §6.2 — do not deviate.

---

## 11. Not Yet Decided (flagging, not blocking)

These weren't specified but will come up quickly once screens get built. Recommend locking them in a short follow-up session rather than letting them get decided implicitly file-by-file:

- **Navigation library** — Expo Router is the default fit for an Expo project of this shape, but not yet confirmed.
- **State/data-fetching** — something like TanStack Query pairs naturally with the contracts package (cache keyed by contract types, same library likely used in the web app), but not yet confirmed.
- **Form handling** — react-hook-form + the same Zod schemas from `packages/contracts` would avoid a second validation layer, but not yet confirmed.
- **Testing** — no mobile testing strategy defined yet (unit/component/e2e).

---

## 12. Security Checklist (mobile-specific, additive to §9 in `04_CODING_AGENT_CONTEXT.md`)

- [ ] Auth tokens only in `expo-secure-store`, never `AsyncStorage` or plain JS memory beyond session lifetime
- [ ] No `tenant_id` / `location_id` ever constructed or edited client-side
- [ ] Role-based UI hiding is UX only — never assume it replaces server-side permission checks
- [ ] QR scan results always validated server-side, even though decoding happens on-device
- [ ] Local SQLite cache contains no data the current role shouldn't be able to see (cache is scoped per logged-in session, cleared on logout/switch)
- [ ] Offline-queued actions (draft quotations) are replayed through the same validated API contracts on reconnect — never written directly against a different, looser local schema

---

## 13. What NOT to Build Here

- No Expo Web target (§2)
- No duplicate type definitions that should live in `packages/contracts`
- No client-side generation of `tenant_id`/`location_id`
- No printer code hard-committed to one vendor/library or transport (BLE/IP/USB) until §9 is explicitly locked with real hardware — build against the pluggable interface described there
- No local/on-device PDF rendering (`expo-print` or similar) for quotations, invoices, or credit notes — §8 is locked to backend-generated
- No dark mode, no speculative multi-language support unless separately requested

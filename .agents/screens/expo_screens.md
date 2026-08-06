# BuildMate Mobile — Screen Specification

> Shop-floor surface for the BuildMate platform (`apps/mobile`): counter sales, quotations,
> invoicing, customers & loyalty, QR scanning, and fulfilment stations.
>
> Companion docs: `01_BRD.md` (requirements) · `03_FEATURE_MODULES.md` (build order) ·
> `06_MOBILE_AGENT_CONTEXT.md` (locked mobile patterns) · `02_DATABASE_SCHEMA.md` (tables).

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Screen Specifications](#3-screen-specifications)
   - 3.1 [Home Screen](#31-home-screen)
   - 3.2 [POS — Quotation Creation (placeholder)](#32-pos--quotation-creation-placeholder)
   - 3.3 [Margin Bottom Sheet (placeholder)](#33-margin-bottom-sheet-placeholder)
   - 3.4 [Quotations Screen](#34-quotations-screen)
   - 3.5 [Invoices Screen](#35-invoices-screen)
   - 3.6 [Customers Screen](#36-customers-screen)
   - 3.7 [Customer Detail Screen](#37-customer-detail-screen)
   - 3.8 [QR Scan Screen](#38-qr-scan-screen)
   - 3.9 [Fulfilment Station (placeholder)](#39-fulfilment-station-placeholder)
4. [Local Catalog Sync (placeholder)](#4-local-catalog-sync-placeholder)
5. [Data Models & Relationships](#5-data-models--relationships)
6. [Technical Requirements](#6-technical-requirements)
7. [Implementation Phases](#7-implementation-phases)
8. [Testing Scenarios](#8-testing-scenarios)
9. [Success Metrics](#9-success-metrics)
10. [Development Notes](#10-development-notes)

---

## 1. Overview

BuildMate mobile is the **role-aware counter / shop-floor / station-staff surface** — not the web
admin panel. The full business picture (all locations, all reports, all financials) lives in the
web admin for the business owner. This app is scoped to what a person at the shop needs that day:

| User | Primary Needs |
|---|---|
| **Salesperson** | Create quotations fast, show alternative brands, discuss margin discreetly |
| **Cashier** | Convert quotations to invoices, record payments, issue receipts, process returns |
| **Station Staff** | See only their station's pending items, mark them ready |
| **Location Manager / Owner** | Supervise the location from a phone |

Role-aware UI hides screens and actions a role can't perform (BRD §6.3). This is a UX convenience
only — the API is the actual enforcement boundary.

---

## 2. Architecture Summary

### 2.1 Navigation Structure

- **Bottom tab navigation — 5 tabs:** Home, Quotations, Invoices, Customers, QR Scan.
- **Tab roots have no back button.** Back buttons appear only on screens pushed onto a route
  stack (Customer Detail, POS, Quotation/Invoice Detail, Fulfilment Station, Settings).
- **Top app bar (More ⋮):** Settings, Profile, Logout — and **Fulfilment Station**
  (2-step navigation: More → Fulfilment Station; acceptable since it's a secondary role surface).
- **Home FABs:** QR Scan (customer loyalty card) and **New Quotation** (opens the POS flow).
- **Pushed route stacks:**
  - Customers → **Customer Detail** (separate route)
  - Home FAB / Customer Detail "New Quote" → **POS** (quotation creation) → cart-list / alternatives
  - Quotations → **Quotation Detail** · Invoices → **Invoice Detail**
  - More (⋮) → **Fulfilment Station**

### 2.2 Navigation Rule

> **Back button is for new routes only.** Tab main screens never show a back button on top.

### 2.3 Technology Stack (locked)

| Layer | Technology | Notes |
|---|---|---|
| Framework | React Native (Expo) | Native builds only — **no Expo Web** (see `06_MOBILE_AGENT_CONTEXT.md` §2) |
| Styling | Uniwind | Design tokens from BRD: warm sand, deep amber, steel blue, green |
| Auth | Better Auth | Session in `expo-secure-store`; role-aware UI per BRD §6.3 |
| Data contracts | `packages/contracts` (Zod from Drizzle) | Single source of truth for request/response shapes |
| Local persistence | `expo-sqlite` | Offline catalog mirror, draft quotations |
| API | REST via contracts | Never GraphQL |
| QR scanning | `expo-camera` | QR format, debounced, server-side validation |
| PDF | Backend-generated (NestJS) | Mobile downloads (`expo-file-system`) + shares (`expo-sharing`); never renders locally |
| State / data-fetching | TanStack Query *(undecided — pending)* | Cache keyed by contract types |
| Navigation | Expo Router *(undecided — default fit)* | |
| Form handling | react-hook-form + Zod *(undecided)* | |

### 2.4 Localization & Currency

Per-tenant country → currency (OMR, AED, SAR, QAR, BHD, KWD). All monetary values are stored as
**integer minor units** (baisa, fils, halala) and converted/displayed at the boundary. Screens must
never hardcode a currency symbol or `$` amounts.

---

## 3. Screen Specifications

### 3.1 Home Screen

**Component Layout**

```
┌──────────────────────────────────────────────┐
│  BuildMate                     [More ⋮]      │
├──────────────────────────────────────────────┤
│  PINNED TAGS (horizontal scroll)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Wires   │ │  Pipes   │ │  Cement  │ ...  │
│  └──────────┘ └──────────┘ └──────────┘      │
├──────────────────────────────────────────────┤
│  RECENT QUOTATIONS                           │
│  • QT-00012 · Pending                        │
│  • QT-00011 · Confirmed                      │
├──────────────────────────────────────────────┤
│  RECENT TRANSACTIONS                         │
│  • INV-2026-00045 · OMR 45.200              │
├──────────────────────────────────────────────┤
│  RECENT QR SCANS                             │
│  • Ahmed (Plumber) · +10 pts · 2h ago        │
├──────────────────────────────────────────────┤
│                     [📷]          [🛒]       │
│                Scan Card    New Quotation    │
└──────────────────────────────────────────────┘
```

**Functional Requirements**

- **Pinned tags (quick access):** a horizontal row of the staff member's personal pinned **tag
  titles** (up to 10, stored in `user_metadata.pinnedTagIds`). Staff opt in to a subset of tags
  instead of loading every tag created.
  - Each pinned item is a **product tag**; the tag **name is the pinned title**.
  - **Tap a pinned title → opens a modal** listing the products associated with that tag.
  - Tag modal shows: product name, sale price (public), cost price + "last updated" timestamp
    (manager/owner only), stock, search/filter within the modal, and **quick add to quote**.
  - Pin/unpin tags from the tag modal or a tag list (personal preference, per staff member).
- **Recent quotations:** last 5 quotations with status indicators.
- **Recent transactions:** last 5 completed invoices with amounts.
- **Recent QR scans:** last 5 customer card scans with timestamps and points where applicable.
- **FABs:**
  - **QR Scan (left):** opens the QR scanner to scan a **customer loyalty card** (a QR of the
    customer id). Retrieves the customer profile; for tradespeople, shows points/status.
  - **New Quotation (right):** opens the **POS** flow (quotation creation).
- **App bar (More ⋮):** Settings, Profile, Logout, **Fulfilment Station**.

---

### 3.2 POS — Quotation Creation (PLACEHOLDER)

> **PLACEHOLDER — detailed design to be fleshed out.** This is the primary product differentiator
> (BRD §8.1, MODULE 06). Structure for now:

- **Two screens:** the **POS screen** (product search + add to cart, customer selection, price
  list selection) and the **cart-list screen** where the alternative-brand pricing happens.
- **Alternative-brand pricing:** products are grouped by specification; alternatives are shown
  colour-coded per brand with individual line totals and a per-alternative subtotal at the bottom.
  An **"Immediate alternative"** button swaps all applicable lines to the next-priority brand.
  Tapping an alternative subtotal confirms → unique quotation ID. Multiple confirmations allowed
  per session.
- Customer + price list selection (auto-selects the customer's default price list; fallback to
  sale price).
- The **margin bottom sheet** lives on this screen (see 3.3).
- After confirmation: PDF preview + WhatsApp share / print.

---

### 3.3 Margin Bottom Sheet (PLACEHOLDER)

> **PLACEHOLDER.** Staff-only bottom sheet opened by tapping the quotation total (BRD §8.2,
> MODULE 07). Lives in the POS screen:
>
> - Cost price, margin per line, total margin %
> - Supplier price history per SKU on tap
> - Discount input with floor enforcement (salesperson blocked below floor; owner unrestricted)
> - **Never appears on the customer-facing PDF.**

---

### 3.4 Quotations Screen

**Tab root — no back button.**

**Component Layout**

```
┌──────────────────────────────────────────────┐
│  Quotations                       [🔍]      │
├──────────────────────────────────────────────┤
│  QUOTATION SUMMARY (optional)                │
│  Total: 45 · Pending: 12 · Expired: 8        │
├──────────────────────────────────────────────┤
│  RECENT QUOTATIONS                           │
│  ┌────────────────────────────────────────┐  │
│  │ QT-00012 · Acme Corp · OMR 230.000 ⏳ │  │
│  │ QT-00011 · Retail Co · OMR 85.000 ✅  │  │
│  │ ...                                    │  │
│  └────────────────────────────────────────┘  │
│  [Load More]                                 │
└──────────────────────────────────────────────┘
```

**Functional Requirements**

- List of quotations (last 10 by default, paginated "Load More"). Each row: quotation number,
  customer, total, status, date.
- **Status per BRD/schema:** `draft` · `confirmed` · `converted_to_invoice` · `expired`.
- Search/filter: by customer, quotation number, status, date range.
- **Quotation Detail** (pushed route — back button):
  - Customer information, line items with pricing, validity period, terms & conditions.
  - Actions: **Convert to Invoice** (cashier+), **Send to Customer** (WhatsApp PDF), **Print/PDF**,
    **Edit** (while draft), **Fulfilment progress** (per-station status).

---

### 3.5 Invoices Screen

**Tab root — no back button.**

**Component Layout**

```
┌──────────────────────────────────────────────┐
│  Invoices                         [🔍]      │
├──────────────────────────────────────────────┤
│  TODAY'S SUMMARY (scoped to this location)   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Total    │ │ Received │ │ Pending  │     │
│  │ OMR 124.5│ │ OMR 98.0 │ │ OMR 26.5 │     │
│  └──────────┘ └──────────┘ └──────────┘     │
├──────────────────────────────────────────────┤
│  RECENT INVOICES                             │
│  ┌────────────────────────────────────────┐  │
│  │ INV-2026-00045 · John Doe · OMR 45.000 │  │
│  │                [paid]                  │  │
│  │ INV-2026-00044 · Jane Smith · OMR 120  │  │
│  │                [active]                │  │
│  │ ...                                    │  │
│  └────────────────────────────────────────┘  │
│  [Load More]                                 │
└──────────────────────────────────────────────┘
```

**Functional Requirements**

- **Today's summary** is scoped to **the user's own business** (their location/team). The full
  org-wide picture is available on the web admin for the business owner. Auto-refresh on new
  transactions.
- Invoice list (last 10 by default, paginated). Each row: invoice number, customer, total, status,
  date.
- **Status per BRD §8.8:** `active` · `paid` · `partially_credited` · `fully_credited` · `void`.
- Search/filter: by customer name, invoice number, status, date range.
- **Invoice Detail** (pushed route — back button):
  - Complete invoice details: line items with quantities and prices, per-line tax, VAT total,
    grand total.
  - **Payments:** record payment, **partial payment** with balance tracking, payment method
    (cash / bank transfer / cheque / store credit), payment history.
  - **Credit notes:** list against the invoice; **"Reissue remaining items as invoice"** button
    visible when `partially_credited` (BRD §8.9).
  - **Warranty lines:** linked warranty, editable terms, serial numbers.
  - **Void** (before payment only); PDF + WhatsApp share / print.

---

### 3.6 Customers Screen

**Tab root — no back button.**

**Component Layout**

```
┌──────────────────────────────────────────────┐
│  Customers                        [🔍]      │
├──────────────────────────────────────────────┤
│  [Search customers...]                      │
├──────────────────────────────────────────────┤
│  QUICK FILTERS: [All] [Account] [Contractor] │
│                 [Tradesperson]               │
├──────────────────────────────────────────────┤
│  RECENT CUSTOMERS (cached)                   │
│  ┌────────────────────────────────────────┐  │
│  │ 👤 Ahmed · Plumber · 450 pts           │  │
│  │   Last purchase: 2 days ago            │  │
│  │ 👤 Jane Smith · Last purchase: 5 days  │  │
│  │ ...                                    │  │
│  └────────────────────────────────────────┘  │
│  [View More →]                               │
└──────────────────────────────────────────────┘
```

**Functional Requirements**

- Initial load: 30 most recent customers from local cache, sorted by last purchase date (newest
  first).
- **Quick filter — Tradesperson:** shows only customers with a linked tradesperson profile.
  (Tradespeople are ultimately customers.) Additional filters for customer type where useful.
- Search: real-time; by name, phone, email, customer id; fetches updated results from server;
  shows loading states.
- Customer card: avatar/initial, full name, phone, loyalty points (tradespeople), last purchase
  date, total purchase count.
- Tap a customer → **Customer Detail** (separate route — back button).

---

### 3.7 Customer Detail Screen

**Pushed route — back button.**

**Functional Requirements**

- **Profile:** name, phone, email, type (`retail` / `account` / `contractor`), notes.
- **Tradesperson block** (when the customer is linked to a tradesperson): trade type, points
  balance, points history, quarterly redemptions.
- **Loyalty card QR:** shows the customer's QR code (encodes `customers.id`), printable — this is
  the customer loyalty card used at the counter. For tradespeople it doubles as their loyalty card.
- **Quick actions:** **New Quote** (opens POS with the customer preselected), **New Invoice**.
- **Purchase history** with invoice statuses; outstanding balance and aging (account/contractor);
  credit limit warning when approaching limit.
- **Contractor:** sites list + consolidated balance across all sites.
- Full purchase / points history is available here (not a separate screen).

---

### 3.8 QR Scan Screen

**Tab root — no back button.**

**Component Layout**

```
┌──────────────────────────────────────────────┐
│  QR Scan                                     │
├──────────────────────────────────────────────┤
│  SCAN SUMMARY                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ Scans   │ │ Points  │ │ Rewards │        │
│  │ 156     │ │ 2,340   │ │ 12      │        │
│  └─────────┘ └─────────┘ └─────────┘        │
├──────────────────────────────────────────────┤
│  RECENT QR SCANS                             │
│  ┌────────────────────────────────────────┐  │
│  │ 📱 Ahmed · Plumber · +50 pts · 2h ago  │  │
│  │ 📱 Jane Smith · 5h ago                 │  │
│  │ ...                                    │  │
│  └────────────────────────────────────────┘  │
│  [Load More]                                 │
└──────────────────────────────────────────────┘
```

**Functional Requirements**

- Scanner: `expo-camera`, QR format only, debounced (ignore duplicate reads within 2 seconds).
- **What it scans:** the **customer loyalty card QR** (encodes the customer id) — applicable to any
  customer issued a printed card. Scanning pulls up the customer profile and, for tradespeople,
  their points balance.
- **Result feedback (immediate, unambiguous):**
  - 🟢 **Green** — valid, customer profile retrieved / points awarded
  - 🔴 **Red** — already redeemed / duplicate, show who/when
  - 🟠 **Orange** — invalid code
- **Always requires network** — validation is server-side only (anti-fraud). Never trust a local
  "looks valid" check (BRD §8.15, `06_MOBILE_AGENT_CONTEXT.md` §10).
- Recent scans list + scan detail (customer info, points transaction, reward redemption status).
- Note: **product-unit QR scanning** (awarding points per physical unit, BRD §8.15) is a separate
  scan path; both reuse the same scanner component.

---

### 3.9 Fulfilment Station (PLACEHOLDER)

> **PLACEHOLDER.** Reached from the **More (⋮)** menu (2-step navigation) — not a tab.
> See BRD §8.6 / MODULE 10.
>
> - Station staff see only their station's pending items; mark items ready one by one.
> - Salesperson / manager sees live progress across all stations.
> - Print / reprint per station on demand (printer name = station = go-down identifier).

---

## 4. Local Catalog Sync (PLACEHOLDER)

> **PLACEHOLDER — implementation details to be discussed later.** Direction only for now:
>
> - `expo-sqlite` holds a local mirror of the product catalog, product groups, brand priority,
>   price lists, tags, and stock snapshots.
> - Delta sync using `updated_at`.
> - Search-as-you-type hits local SQLite first; API is the fallback.
> - Draft quotations are creatable offline and queued for sync on reconnect.
> - QR scanning and fulfilment updates stay live (network required); cost/margin data is cached
>   with a visible "last updated" timestamp.
> - Persistent, unmissable offline indicator in the app header.
>
> See `06_MOBILE_AGENT_CONTEXT.md` §6 for the locked rules.

---

## 5. Data Models & Relationships

Full schema in `02_DATABASE_SCHEMA.md`; request/response shapes in `packages/contracts`.

- **Customer** (`customers`) — retail / account / contractor. May be linked to a tradesperson.
- **Tradesperson** (`tradespeople`) — links to a customer via `customer_id`; carries trade type +
  points balance. Tradespeople are ultimately customers.
- **Product tags** (`product_tags` + `product_tag_assignments`) — pinned quick access via
  `user_metadata.pinnedTagIds`.
- **Quotation** (`quotations` + `quotation_lines`) — statuses `draft` / `confirmed` /
  `converted_to_invoice` / `expired`.
- **Invoice** (`invoices` + `invoice_lines`) — statuses `active` / `paid` /
  `partially_credited` / `fully_credited` / `void`; immutable after issue.
- **Payments** — partial payments, balance tracking, methods (cash / bank transfer / cheque /
  store credit).
- **Credit notes** — return paths A/B, "reissue remaining items" escape hatch.
- **Warranty lines** — linked warranty, serial numbers.
- **QR codes** (`qr_codes`) — per-unit product codes for points; the customer loyalty card QR is
  simply the customer id, displayed on the customer detail screen.

---

## 6. Technical Requirements

- **Role-aware UI** (BRD §6.3): salesperson never sees invoice/payment screens; station staff only
  their station queue; cashier handles invoices/payments/returns.
- **Offline indicator** in the header whenever there is no connectivity; cached cost prices always
  show "last updated".
- **PDFs:** backend-generated only — mobile downloads and shares, never renders on-device.
- **QR:** network required; server-side validation; 2-second debounce; colour feedback.
- **Money:** integer minor units; format per tenant currency — never hardcode a symbol.
- **Auth:** Better Auth; tokens in `expo-secure-store` only.
- **Navigation rule:** no back button on tab roots.

---

## 7. Implementation Phases

Maps to `03_FEATURE_MODULES.md`:

| Phase | Modules | Screens in this doc |
|---|---|---|
| 1 (POC) | 02, 04, 05, 06, 07, 08 | Auth, Home (pinned tags), POS + cart-list, margin sheet, Quotations |
| 2 | 10 | Fulfilment Station |
| 3 | 11–16 | Invoices, Invoice Detail, payments, returns, cost review |
| 4 | 18 | Warranty on Invoice Detail |
| 5 | 19–21 | Customers, Customer Detail, QR Scan, tradesperson filter |
| 7 | 23 | Camera product search |

---

## 8. Testing Scenarios

- **Roles (BRD §6.3):** each role sees only their screens/actions; station staff only their
  station; salesperson blocked below margin floor; margin sheet absent for station staff.
- **Alternatives:** swap all lines to next brand; per-alternative subtotal correct; multiple
  confirmations per session.
- **Offline:** draft quotation created offline → queues → syncs on reconnect; offline indicator
  shown; QR scan blocked without network.
- **QR:** valid / already redeemed (shows who/when) / invalid; duplicate reads debounced.
- **Invoice:** partial payment with balance; return paths A/B; "reissue remaining items" visibility
  and removal; void before payment only.
- **Navigation:** tab roots show no back button; pushed routes do.

---

## 9. Success Metrics

Per BRD §3.2:

- A customer asks "what if I go with the other brand?" — staff answers instantly from one screen,
  zero duplication.
- Tradespeople start referring contacts because of the quarterly points programme.
- Staff stop shouting across the shop floor — fulfilment runs through the app.

---

## 10. Development Notes

- Read `06_MOBILE_AGENT_CONTEXT.md` before writing any mobile code — locked decisions include:
  no Expo Web, backend-generated PDFs, `packages/contracts` as the only data source,
  `expo-secure-store` for auth, and server-side QR validation.
- Use Uniwind design tokens from the BRD (warm sand, deep amber, steel blue, green). No ad-hoc
  colours or spacing numbers.
- No dark mode, no speculative multi-language support.
- Tab roots never get a back button; back is only for pushed routes.

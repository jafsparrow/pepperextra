# BuildMate — Business Requirements Document

> **Version:** 2.0 · **Date:** July 2026 · **Author:** Jafar · **Confidential**
>
> Mobile-first quotation, operations, loyalty, billing & contractor platform for building material shops.

---

## 1. Executive Summary

BuildMate is a mobile-first SaaS platform designed specifically for building material shops. It addresses a clear gap in the market: existing ERP and POS software was not built for the building materials shop floor workflow, forcing staff to duplicate quotations, manage alternatives manually, coordinate fulfilment verbally, and handle warranty claims on paper.

### Core Product Bets

1. **Seamless alternative brand pricing on a single quotation screen** — eliminating the need to duplicate or re-create quotations when a customer asks about a different brand.
2. **Tradesperson referral growth via a QR-based loyalty programme** — giving plumbers, electricians, and painters a tangible reason to direct their clients to the shop.

### Key Selling Points
- Zero hardware cost — works on any phone or tablet from day one
- No IT setup required — operational from first login
- Full transaction loop owned by BuildMate — no external software dependencies
- VAT-compliant for Oman Tax Authority requirements out of the box

---

## 2. Problem Statement

### 2.1 Quotation Inefficiency
- When a customer asks "what if I choose the other brand?", staff must duplicate the entire quotation and manually change products — slow and error-prone.
- No way to compare alternative brand pricing on a single screen.

### 2.2 No Tradesperson Incentive
- Tradespeople (plumbers, electricians, painters) direct clients to shops with no personal benefit.
- No existing building materials software offers a loyalty or points programme for tradespeople.

### 2.3 Shop Floor & Go-Down Coordination
- In shops with multiple sections or remote go-downs, staff shout across the floor or carry paper slips to coordinate order fulfilment.
- No digital fulfilment station system exists for building material shops.

### 2.4 Financial Visibility While Traveling
- Shop owners who travel rely on staff phone calls or spreadsheets to track supplier deliveries, outstanding invoices, and cost prices.
- Cost price data becomes stale, eroding margin accuracy silently.

### 2.5 Contractor Retention
- Contractors have no self-service way to view purchase history, check site-specific spending, or track outstanding invoices.
- This reduces stickiness — contractors can switch suppliers without losing any data or history.

### 2.6 Warranty Management
- Warranty terms are written manually on paper invoices.
- No way to track serial numbers, claim history, or service job status digitally.
- Shop has no visibility on supplier warranty recovery.

---

## 3. Goals & Success Criteria

### 3.1 POC Goals (Phase 1 & 2)
- Deliver a working quotation engine with alternative brand pricing in the owner's own shop.
- Implement a fulfilment station system that eliminates verbal coordination between shop sections and go-downs.
- Validate both features with real daily usage before scaling development.

### 3.2 POC Success Criteria
- A customer asks "what if I go with the other brand?" — staff answers instantly from one screen, zero duplication.
- Tradespeople start referring contacts to the shop because of the quarterly points programme.
- Staff stop shouting across the shop floor — fulfilment runs through the app.

### 3.3 Commercial Goals
- Acquire paying shop customers after POC validation.
- Reach sufficient revenue to hire development help before Phase 3.
- Position BuildMate as the only building materials platform with alternative pricing, loyalty, fulfilment station coordination, and warranty tracking in one app.

---

## 4. Target Users

| User | Context | Primary Needs |
|---|---|---|
| **Owner / Admin** | Office or traveling, web | All locations, all reports, all financials, subscription management |
| **Location Manager** | Shop office, web or mobile | Manage location catalog, staff, reports, stock, cost prices |
| **Salesperson** | Shop floor, mobile device | Create quotations fast, show alternatives, discuss margin discreetly |
| **Cashier** | Counter, mobile or tablet | Convert quotations to invoices, record payments, issue receipts, process returns |
| **Station Staff** | Warehouse / go-down / section, mobile | See only their station's items, mark items ready |
| **Customer (Retail)** | At counter, no portal | Quick purchase, no account needed, phone for loyalty |
| **Customer (Account)** | Web portal, any device | View purchase history, invoices, credit limit, request quotations |
| **Customer (Contractor)** | Web portal, any device | Consolidated view across **all sites**, site-level history, site manager contacts, request quotations per site |
| **Tradesperson** | At counter, no app | Earn points by returning product QR codes, redeem quarterly |

---

## 5. Architecture & Technical Decisions

### 5.1 Multi-Tenancy Model

Every record in the system carries two mandatory identifiers:

- **`org_id`** — company-level security boundary. Enforces complete data isolation between different shop businesses.
- **`team_id`** — operational scoping within a tenant. Enables per-branch stock, fulfilment queues, and price overrides.

> **Critical rule:** These two dimensions must never be collapsed. Shared product catalog is scoped at tenant level. Per-branch stock and fulfilment are scoped at location level. Both must always coexist.

### 5.2 Deployment Modes

The same codebase supports two deployment modes controlled by a config flag:

| Mode | Description |
|---|---|
| **Cloud SaaS** | Multi-tenant, self-serve registration, annual subscription billing |
| **Local Installation** | Single tenant, one or more locations, on-premise for clients requiring in-house hosting |

> Local installation = cloud codebase with `SINGLE_TENANT_MODE=true`. No separate codebase maintained.

### 5.3 Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Backend API** | NestJS | Multi-tenant logic, price resolution, QR generation, billing, auth guards |
| **Web Admin Panel** | TanStack Start *(preferred)* / Next.js *(fallback — decision open)* | Tenant onboarding, catalog, staff, reports, customer portal |
| **Mobile App** | React Native Expo | Quotation flow, QR scanning, camera search, local catalog sync, WhatsApp PDF |
| **Customer Portal** | Same web app as admin, separate route | Purchase history, invoices, site management, quotation requests |
| **AI / Vision** | Cloud Vision API | Object detection for camera-based product search (Phase 6) |

### 5.4 Authentication — Better Auth

- **Library:** Better Auth with RBAC plugin
- **Organisation** maps to `org_id`
- **Team** maps to `team_id`
- Roles and resource-level `read`/`write` permissions managed via Better Auth RBAC
- Enforced at NestJS API guards and reflected at UI layer (show/hide)

### 5.5 No External Software Dependencies

BuildMate owns the full transaction loop:

```
Quotation → Confirmed Order → Invoice → Payment → Credit Note → Warranty → Customer Portal
```

No integration with Tally, QuickBooks, or any external ERP. Deliberate design decision.

### 5.6 Localization, Currency & Tax Configuration

**Multi-country ready from Day 1.** Each tenant belongs to a country (via `org_metadata.countryId`) which determines:

| Setting | Source | Examples |
|---|---|---|
| **Currency** | `countries.currencyId` → `currencies` | OMR (3 decimals), AED/SAR/QAR (2 decimals), BHD/KWD (3 decimals) |
| **Default VAT rate** | `countries.defaultVatRate` (basis points) | Oman 500 (5%), UAE 500 (5%), KSA 1500 (15%), Qatar 0, Bahrain 1000 (10%) |
| **Additional tax/charge types** | `tax_types` per country | VAT, Service Charge, Delivery Fee, Tourism Levy |

**Per-tenant overrides** via `org_tax_config`:
- Override VAT rate (e.g., VAT-exempt org)
- Enable/disable optional charges (service charge, delivery fee)
- Custom fixed amounts for delivery fees

**Storage:** All monetary values stored as **integer minor units** (baisa, fils, halala) in `bigint` columns. Conversion happens at API boundary using currency config. Never floating point.

**Tax calculation:** Per-line, per-tax-type. Grand total = Σ line totals + Σ all tax amounts. Never calculate tax on subtotal — prevents rounding drift and matches GCC tax authority requirements.

---

## 6. User Roles & Permissions

### 6.1 Role Definitions

| Role | Scope | Description |
|---|---|---|
| **Owner** | All locations (tenant-wide) | Auto-assigned at registration. Full access everywhere. Manages subscription. |
| **Location Manager** | Single location | Full access at their location — products, staff, reports, cost prices, margin, stock. Cannot see other locations. |
| **Salesperson** | Single location | Creates quotations only. Cannot convert to invoice or record payments. Limited margin visibility with floor enforced. |
| **Cashier** | Single location | Converts confirmed quotations to invoices, records payments, issues receipts, processes returns and credit notes. |
| **Station Staff** | Single location | Sees only their assigned fulfilment station screen. Marks items ready. No other access. |

### 6.2 Staff Registration Rules

1. First user to register → `is_owner: true`, `can_create_org: true`
2. Owner creates all staff accounts manually from the admin panel
3. Staff accounts → `is_owner: false`, `can_create_org: false` — permanently locked
4. Staff can never create a new organisation under the same SaaS account
5. Staff who later start their own shop must register a brand new account
6. **Ownership transfer:** deferred to a later phase

### 6.3 Permissions Matrix

| Capability | Station Staff | Salesperson | Cashier | Location Manager | Owner |
|---|---|---|---|---|---|
| View fulfilment station screen | Own station | All stations | All stations | All stations | All stations |
| Mark items ready | Own station | — | — | ✓ | ✓ |
| Create & confirm quotations | — | ✓ | — | ✓ | ✓ |
| Convert quotation to invoice | — | — | ✓ | ✓ | ✓ |
| Record payments | — | — | ✓ | ✓ | ✓ |
| Issue credit notes / process returns | — | — | ✓ | ✓ | ✓ |
| Process warranty claims | — | — | ✓ | ✓ | ✓ |
| See margin bottom sheet | — | ✓ limited | — | ✓ full | ✓ full |
| Discount below margin floor | — | Blocked | — | ✓ | Unrestricted |
| Add / edit products | — | — | — | ✓ | ✓ |
| Manage warranty catalog | — | — | — | ✓ | ✓ |
| Manage price lists | — | — | — | ✓ | ✓ |
| Record purchase receipts | — | — | — | ✓ trusted | ✓ |
| Approve cost price updates | — | — | — | Own location | ✓ all |
| Manage staff | — | — | — | ✓ | ✓ |
| View location reports | — | — | — | ✓ | ✓ all |
| Manage credit limits | — | — | — | — | ✓ |
| Toggle price visibility flag | — | — | — | — | ✓ |
| Manage subscription | — | — | — | — | ✓ |
| Pin quick-access widget | Personal | Personal | Personal | ✓ | ✓ |
| Create / manage home screen tags | — | — | — | ✓ | ✓ |
| View own site invoices (portal) | — | — | — | — | Contractor only |
| Request quotation (portal) | — | — | — | — | Contractor only |

---

## 7. Tenant Self-Serve Onboarding Flow

```
Step 1 → Register (email + password) → is_owner: true assigned
Step 2 → Create organisation (shop name, VAT number) → org_id assigned
Step 3 → Add first location (branch name) → team_id assigned
Step 4 → Upload product catalog (CSV import or manual entry)
Step 5 → Create staff accounts (assign roles and locations)
Step 6 → Configure fulfilment stations and printer assignments
Step 7 → Configure price lists and brand priorities
Step 8 → Go live — staff log in and start quoting
```

> No manual setup by the BuildMate team required. Fully self-serve from day one.

---

## 8. Feature Specifications

### 8.1 Quotation Engine with Live Alternatives

**Core POC feature. Primary product differentiator.**

- Products are grouped by specification (e.g. "3/4" PVC Pipe"). All products in the same group are alternatives to each other.
- Brand priority set via brand tags on each product. Alternatives ordered by brand priority.
- Quotation screen shows all brand alternatives colour-coded with individual line totals and per-alternative subtotal at the bottom.
- **"Immediate alternative" button** swaps all applicable line items to next priority brand simultaneously.
- Salesperson taps any alternative subtotal to confirm → unique quotation ID generated.
- Multiple confirmations allowed per session — customer can keep multiple options open.
- Confirmed quotation PDF: shop logo, VAT registration number, customer details, validity period, line items, VAT at 5%, grand total.
- Delivery via WhatsApp (primary) or print.
- Local catalog sync on device — search works without live server connection.

### 8.2 Margin Bottom Sheet & Role-Based Discount Floors

- Tapping quotation total opens a **staff-only bottom sheet** — cost price, margin per line, total margin %.
- Cost price is admin-managed. "Last updated" timestamp shown per product.
- **Supplier price history** visible on tap — last N deliveries across all suppliers for that SKU.
- Staff discount capped at configurable minimum margin floor (e.g. 2–3%). App blocks or requires owner approval below floor.
- Owner unrestricted — can go to zero or negative margin.
- Margin bottom sheet **never appears on customer-facing PDF**.

### 8.3 Quick-Access Price Widget & Home Screen Tags

**Quick-Access Widget:**
- Each staff member pins up to 10 products on their home screen for instant price lookup.
- Designed for volatile products: iron rods, copper wire, cement, nails, paint.
- Personal per staff member — not shared.

**Home Screen Tags:**
- Location Manager creates named tags (e.g. "Wires", "Pipes", "Rarely Sold").
- Products assigned to one or more tags.
- Home screen shows tag buttons → tap to see all associated products with price and stock.
- Location-specific — different branches can have different tags.
- Tags are display-only navigation shortcuts — no system logic attached.
- Only managers create/edit tags; staff read-only.

### 8.4 Product Catalog

- Shared catalog per tenant. Per-location stock and optional per-location price overrides.
- **Product groups** (spec-based) — alternatives drawn from the same group.
- **Brand tags** on each product. Admin sets brand priority per group.
- **Named price lists** override base price per SKU. Unmatched SKUs fall back to base price automatically.
- **Product aliases and synonyms** — prevent duplicate entries when same product has different names at different branches.
- **Catalog requests** — staff submit description + photo instead of creating duplicates. Admin maps or approves.
- **Warranty link** — product can be linked to a default warranty item (auto-populates on invoice).

### 8.5 Stock Tracking — Dual Mode

Each product group has a configurable `stock_tracking_mode`:

| Mode | Stock Counting | Reorder Trigger |
|---|---|---|
| `group` | Total across all brands in group | Single threshold for whole group |
| `sku` | Per brand/SKU individually | Per-SKU threshold |

- Switchable at any time by Location Manager or Owner — with a warning on mode change.
- In `sku` mode: zero-stock brands visually flagged/dimmed on alternatives screen.
- In `group` mode: stock indicator shows total group availability.
- Cross-location stock check: salesperson queries stock at other branches within same tenant.

### 8.6 Fulfilment Station System

> Adapted from restaurant KOT/kitchen display system for building material shop floors and remote go-downs.

**Core concept:** A fulfilment station is any named physical location where stock is picked — a shop floor counter, a separate go-down, or a remote warehouse. All treated identically.

**Configuration:**
- Each product category has a default station assignment.
- Individual products can override their category's station.
- Printer name = station identifier = go-down identifier.

**Flow after quotation/invoice confirmation:**
1. Line items auto-split to assigned stations.
2. Station staff open BuildMate on phone, filter by station name — see only their pending items.
3. Staff mark items ready one by one.
4. Salesperson sees live progress view across all stations.
5. When all stations ready, salesperson manually notifies customer — no automatic notification (human quality check preserved).

**Printing:**
- Optional thermal printer per station.
- Print all station slips simultaneously or individually.
- **Reprint available at any time** on demand per station.

### 8.7 Configurable Tax & Charge Invoicing

- **Multi-country tax engine** — not hardcoded to Oman VAT.
- Each tenant belongs to a **country** (Oman, UAE, Saudi, Qatar, Bahrain, Kuwait) which defines default tax types and rates.
- **Tax types** are configurable per country: VAT, Service Charge, Delivery Fee, Tourism Levy, etc.
- Each tax type has:
  - Rate (basis points: 500 = 5.00%, 1500 = 15.00%)
  - Percentage vs fixed amount
  - Applies to: line items / invoice total / shipping
  - Mandatory vs optional
- **Org-level overrides** — tenant can adjust rates (e.g., VAT-exempt org sets 0%, custom service charge %)
- **Calculation**: per-line, per-tax-type, summed — never on subtotal. Prevents rounding drift.
- **Invoice PDF** shows: line subtotal, each tax type with rate + amount, tax total, grand total.
- **VAT returns** (Oman/UAE/KSA): BuildMate generates summary report; filing done manually on authority portal.
- **Records retained indefinitely** (GCC tax authorities require 5–10 years minimum).
- Default seed data: Oman 5% VAT, UAE 5% VAT, Saudi 15% VAT, Qatar 0%, Bahrain 10%, Kuwait 0%.

### 8.8 Invoice Lifecycle & States

| Status | Description |
|---|---|
| `active` | Live invoice, payment outstanding |
| `paid` | Fully settled |
| `partially_credited` | Some items returned via credit note, balance reduced |
| `fully_credited` | Completely reversed by credit notes, zero balance, closed |
| `void` | Cancelled before goods left shop or payment made |

> **Core rule:** Issued invoices are immutable. Never edited, never deleted. All adjustments go through credit notes.

### 8.9 Returns & Credit Notes

**Two return paths:**

**Path A — Credit only:**
```
Staff selects returned items → credit note created referencing original invoice
→ Invoice status → partially_credited
→ Refund method: cash | store credit | contractor balance deduction
→ Stock automatically restocked
→ "Reissue remaining items as invoice" button appears on invoice
```

**Path B — Credit and reissue clean invoice:**
```
Staff selects returned items AND customer wants clean new invoice
→ CN-1 created for returned items
→ CN-2 auto-created for remaining items (background)
→ Original invoice → fully_credited
→ New invoice created for remaining items only
→ If original PAID → new invoice auto-marked PAID, payment transferred
→ If original UNPAID → new invoice ACTIVE
```

**Escape hatch:**
- `partially_credited` invoices always show **"Reissue remaining items as invoice"** button.
- On tap → CN created for remaining items → new invoice generated → payment transferred if paid → original → `fully_credited`.
- Button disappears permanently after reissue.

### 8.10 Warranty Management

**Warranty as a separate catalog entity — selectable on any invoice like a product.**

**Warranty item types:**
- `replacement` — replace on spot (same or alternative brand)
- `limited_replacement` — one-time or N-times within a period
- `service` — item sent for repair, customer waits

**Invoice flow:**
- Staff adds product → if product has a linked warranty, it auto-populates as a suggested line beneath
- Staff can accept, remove, swap, or edit warranty terms before confirming
- Warranty terms notes are always editable at invoice time (e.g. reduce 1 year to 6 months as part of an offer)
- Optional serial number field — free text, searchable later
- Optional price — defaults to zero (free warranty); can be charged for extended warranty
- Warranty line prints on invoice PDF — invoice is the warranty document

**Claim intake:**
- Staff searches by invoice number, customer name, or serial number
- System shows: warranty terms, expiry date, claims used vs allowed, claim history
- Valid claim → resolution recorded → claims_used incremented → stock restocked if replacement

**Service job tracking:**
```
Status flow: received → sent_to_supplier → repaired → ready_for_collection → collected
```
- Service claims get a unique **service job reference number**
- Staff updates status as item moves through process
- Customer notified (WhatsApp) when status → `ready_for_collection` (later phase)

**Supplier warranty recovery:**
- Every claim can optionally create a **supplier warranty claim**
- Tracks: supplier, original purchase receipt, serial number, claim status, resolution
- Owner sees all pending supplier claims from the payables dashboard

### 8.11 Accounts Receivable & Customer Credit

**Unified Customer Model** — three types under one `customers` table:

| Type | Description | Credit Features |
|---|---|---|
| **Retail** | Walk-in, one-off buyers. Identified by phone (non-unique — family members may share a number). | No credit. Cash/on-spot payment only. |
| **Account** | Registered trade buyers with credit terms. Has credit limit, payment terms. | Credit limit, payment terms, aging buckets (30/60/90 days). |
| **Contractor** | Company buyers with multiple sites & site managers. Has portal access. | All account features + multi-site aggregation, portal access, site-level contacts. |

**Core AR Features:**
- Outstanding invoices per customer with aging buckets: **30, 60, 90 days**.
- Credit limit and payment terms configured per customer (account/contractor types).
- App flags when customer approaches credit limit before salesperson confirms new quotation.
- Total paid vs pending visible per customer.
- **Contractor aggregation**: Select a contractor → see consolidated balance across all their sites.
- Site-level billing: when creating invoice, pick site (or "Company HQ" for direct billing).

### 8.12 Supplier Management & Accounts Payable

- Trusted staff record **purchase receipts**: supplier, SKU, quantity, unit cost, delivery date.
- Each receipt **appended** to SKU's supplier price history log — never overwrites.
- Payables tracked per supplier with due dates.
- Owner sees full payables picture from anywhere — replaces traveling spreadsheet.

### 8.13 Conservative Cost Price Management

**Principle: always protect margin. Never overestimate profit.**

1. Trusted staff records purchase receipt → appended to supplier price history.
2. System scans last **3–5 deliveries** across all suppliers for that SKU.
3. Surfaces the **highest unit cost** in that window as the suggested active cost price.
4. Owner/Manager receives notification: *"X products have new delivery prices — review suggested cost updates."*
5. Admin confirms with one tap or manually overrides.
6. **Cost price never auto-updates without human approval.**

### 8.14 Business Reports

**Designed for shop owners, not accountants.**

| Report | Purpose | Cadence |
|---|---|---|
| **Daily Sales Summary** | Total sales, VAT collected, invoice count, returns | Daily |
| **VAT Summary (OTA)** | Output VAT, input VAT on purchases, net VAT payable — supports manual OTA filing | Quarterly |
| **Tax Invoice Log** | All invoices + credit notes with numbers, dates, amounts, VAT — audit evidence | Per period |
| **Sales Performance** | Sales by location, category, salesperson — this month vs last month | Monthly |
| **Margin Analysis** | Gross margin by category and product — flags low-margin items | On demand |
| **Stock Movement** | Best/worst movers, slow-moving stock (60+ days) | On demand |
| **Receivables Aging** | Outstanding contractor invoices at 30/60/90 days | On demand |
| **Payables Due** | What is owed to each supplier and when | On demand |
| **Warranty Claims** | Open claims, service jobs by status, supplier recovery pending | On demand |

**Deliberately excluded:**
- Balance sheets, P&L statements
- Depreciation and asset management
- Payroll
- Bank reconciliation
- Expense tracking (managed externally via spreadsheet for now)
- Automated VAT return filing (summary exported; filing done manually on OTA portal)

### 8.15 Tradesperson Loyalty & QR Points

- Eligible products get **per-unit unique QR codes** — one per physical unit, not per SKU.
- QR codes pre-generated sequentially in BuildMate, sent to sticker printing agency (cheap bulk with scratch-off layer).
- **Sequential batch registration:** staff scans first and last code on received sheet → system registers all codes in between as assigned to that SKU and purchase receipt.
- **Duplicate validation:** on scan, system immediately checks if code was previously redeemed → rejects with who/when details.
- Points accumulate on tradesperson profile (phone number as unique ID).
- **Quarterly redemption** — store credit or gift voucher.
- No separate app for tradespeople — all scanning done by staff at station.

### 8.16 Customer Types, Contacts & Sites

**Three customer types** (all in single `customers` table):

| Type | Description | Credit | Portal | Multi-Site | Phone Unique |
|------|-------------|--------|--------|------------|--------------|
| **Retail** | Walk-in, one-time buyers | No | No | No | No (family sharing) |
| **Account** | Regular buyers with credit terms | Yes | View-only | No | Optional |
| **Contractor** | Construction companies, project-based | Yes | Full | Yes | Optional |

- **Customer → Contacts**: Multiple contacts per customer (purchasing, accounts, site managers).
- **Contractor → Sites**: Multiple sites/projects per contractor.
- **Site → Contacts**: Site-specific contacts (project manager, site engineer, foreman).
- **Invoice billing**: Can bill to **Customer** (company-level) or **Site** (project-level). Site invoices show site name + company name.
- **Phone numbers**: Not unique across customers (same phone can belong to multiple retail accounts — e.g., family sharing).

### 8.17 Customer Self-Service Portal

- Web portal — accessible on any device with customer login (for `account` and `contractor` type customers).
- Staff links **sites** (building projects) to contractor-type customers with point-of-contact numbers.
- Contractor sees: purchase history across **all sites** (consolidated) or filtered by site, pending vs paid invoices, credit notes, PDF download, quotation request button.
- Account customers see: their own purchase history, pending invoices, credit notes (no multi-site).
- **Site selection**: When creating a quotation request, contractor picks site (or "Company HQ" for direct billing to company).
- **Price visibility feature flag** — admin toggle hides unit prices per customer. Default: hidden. Protects negotiation position.
- Retention mechanic: customer with 6+ months of history has strong reason not to switch suppliers.

### 8.17 Customer Types & Structure

| Type | Description | Credit | Portal | Multi-Site | Typical Use Case |
|------|-------------|--------|--------|------------|------------------|
| **Retail** | Walk-in, one-time buyers | No | No | No | Cash/phone pay, no account |
| **Account** | Regular buyers, credit terms | Yes | Yes (history only) | No | Trade accounts, small builders |
| **Contractor** | Construction companies, project-based | Yes | Yes (full) | Yes | Project sites, site managers |

- **Customer → Contacts**: Multiple contacts per customer (purchasing, accounts, site managers).
- **Contractor → Sites**: Multiple sites/projects per contractor.
- **Site → Contacts**: Site-specific contacts (project manager, site engineer, foreman).
- **Invoice billing**: Can bill to **Customer** (company-level) or **Site** (project-level). When billing to site, invoice shows site name + company name.
- **Phone numbers**: Not unique across customers (same phone can belong to multiple retail accounts — e.g., family sharing).

### 8.18 Camera-Based Product Search

> Phase 6. Staff-facing only.

- Staff points phone camera at physical product → AI detects object type → searches local synced catalog.
- Returns top 3 matching SKUs with stock and price.
- "Search manually instead" fallback always visible.
- Works offline via local catalog sync.

---

## 9. Phased Roadmap

| Phase | Title | Key Deliverables |
|---|---|---|
| **1** | **Quotation Engine (POC)** | Catalog, groups, brand tags, price lists, alternatives screen, quotation confirmation, VAT PDF, WhatsApp, margin bottom sheet, discount floors, quick-access widget, home screen tags |
| **2** | **Fulfilment Station System** | Station config, category→station assignment, product override, station screen, mark ready, progress view, reprint on demand |
| **3** | **Financial Visibility** | Invoice lifecycle, returns & credit notes, payments, AR aging, contractor credit, supplier management, AP, conservative cost price, reports, VAT summary |
| **4** | **Warranty Management** | Warranty catalog, invoice warranty lines, serial numbers, claim intake, service job tracking, supplier warranty recovery |
| **5** | **Growth & Catalogue Quality** | Tradesperson profiles, QR batch generation, sequential registration, points scanning, quarterly redemption, catalog requests, product aliases, cross-location stock, dual stock tracking mode |
| **6** | **Customer Retention** | Customer types (retail/account/contractor), site profiles, purchase history portal, invoice portal, price visibility flag, quotation request, tenant onboarding flow |
| **7** | **Camera Product Search** | Vision AI, local catalog sync, top 3 results, manual fallback |

---

## 10. Pricing Model

- Annual subscription per tenant, tiered by number of locations.
- Monthly option available at a higher rate — positioned so annual is the obvious choice.
- All features included — no feature-level paywalls.
- **Multi-currency ready** — each tenant operates in their country's currency (OMR, AED, SAR, QAR, BHD, KWD). Prices stored as integer minor units in DB, converted at UI layer.
- Target market: VAT-registered SME building material shops in Oman and the Gulf region.
- Sales pitch: zero hardware cost, works on phones they already own, operational from day one.

---

## 11. Out of Scope

- Balance sheets, P&L statements, income statements
- Depreciation and fixed asset management
- Payroll management
- Bank reconciliation
- Expense tracking (deferred — managed externally for POC)
- Automated VAT return filing
- Integration with external accounting software
- E-commerce or customer-facing product browsing
- Delivery and logistics management
- Ownership transfer between users (deferred)

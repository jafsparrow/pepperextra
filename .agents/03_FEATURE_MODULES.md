# BuildMate — Feature Modules

> Build modules **in order**. Later modules depend on earlier ones.
>
> **Priority tags:** `[MUST-HAVE]` POC blockers · `[CORE]` required before selling · `[GROWTH]` adds revenue · `[RETENTION]` reduces churn · `[SMART]` differentiator
>
> **Stack tags:** `[nestjs]` `[expo]` `[web]` `[better-auth]` `[db]` `[pdf]` `[whatsapp]` `[vision-ai]`

---

## Phase 1 — Quotation Engine (POC)

---

### MODULE 01 — Multi-Tenant Foundation

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[db]` `[better-auth]`

> Build this first. Every other module depends on it.

**Scope:**

- Tenant (organisation) and location (team) creation
- `org_id` + `team_id` enforced on every database record
- Row-level security (RLS) at database layer
- Single-tenant mode config flag (`SINGLE_TENANT_MODE=true`)
- Middleware injects tenant context into every request
- **Country/Currency/Tax configuration** — seed countries, currencies, tax types; org selects country on onboarding

**Tables:** `countries`, `currencies`, `tax_types`, `org_tax_config`, `org_metadata`, `team_metadata`

**API Routes:**

```
POST   /auth/register                → create account + tenant + first location
POST   /tenants/:id/locations        → add location
GET    /tenants/:id/locations        → list locations
PATCH  /tenants/:id                  → update tenant settings (country, currency, tax overrides)
PATCH  /locations/:id                → update location settings
GET    /countries                    → list active countries (for onboarding)
GET    /currencies                   → list active currencies
GET    /tax-types?country_id=:id     → tax types for country
PATCH  /org/tax-config               → update org tax type overrides
```

**Implementation Notes:**

- Better Auth organisations = tenants; teams = locations
- Every NestJS guard validates `org_id` from JWT
- Cross-tenant data access must be impossible at every layer
- All queries must include `WHERE org_id = $orgId`
- Onboarding wizard step: select country → auto-sets currency + default tax types

---

### MODULE 02 — Authentication & RBAC

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[better-auth]` `[web]` `[expo]`

**Scope:**

- Better Auth integration with RBAC plugin
- Roles: `owner`, `manager`, `branch_manager`, `salesperson`, `cashier`, `station_staff`, `staff`
- Resource-level `read`/`write` permissions per role
- `is_owner` and `can_create_org` flags on user
- First-login forced password change
- Owner-initiated password reset for staff

**Tables:** `users`

**Role → Key Permissions:**

```
owner             → all:read, all:write, all branches (super entity, cannot be reassigned)
manager           → org-level: staff, catalog, inventory, quotations, reports, settings (no org delete, no ACL changes)
branch_manager    → all:read, all:write (own branch only)  [renamed from location_manager]
salesperson       → quotations:write, catalog:read, margin:read (limited)
cashier           → invoices:write, payments:write, credit_notes:write
station_staff     → station_queue:read (own station), station_queue:write
staff             → base role (default for org-created members): catalog:read, orders:create/read
```

**API Routes:**

```
POST   /auth/login
POST   /auth/logout
POST   /auth/change-password
POST   /staff                        → owner creates staff (can_create_org: false)
PATCH  /staff/:id                    → update staff details or role
POST   /staff/:id/reset-password     → set temporary password
GET    /staff                        → list staff for location
DELETE /staff/:id                    → soft delete
```

**UI Screens:**

```
[web]  Login page
[web]  Staff management — list, add, edit, reset password
[expo] Login screen
[expo] Forced password change on first login
```

---

### MODULE 03 — Web Admin Panel Shell

**Priority:** `[MUST-HAVE]` · **Tags:** `[web]` `[better-auth]`

**Scope:**

- TanStack Start (preferred) / Next.js web application shell
- Better Auth session management
- Role-aware navigation sidebar — hides sections user cannot access
- Self-serve tenant onboarding wizard
- Responsive — works on desktop and tablet

**Onboarding Wizard Steps:**

```
Step 1 → Register (email + password)
Step 2 → Create organisation (shop name, VAT number)
Step 3 → Add first location
Step 4 → Upload product catalog (CSV or manual)
Step 5 → Create staff accounts
Step 6 → Configure fulfilment stations
Step 7 → Go live
```

**UI Screens:**

```
[web]  Registration + email verification
[web]  Onboarding wizard (steps 1–7)
[web]  Admin dashboard home
[web]  Role-aware navigation sidebar
[web]  Account settings — profile, password, subscription
```

---

### MODULE 04 — Product Catalog

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[db]` `[web]` `[expo]`

**Scope:**

- Product groups (spec-based — drives alternative pricing logic)
- Individual SKUs with brand tags
- **Spec code** (e.g. "PP32UP" for 3/4" PVC Pipe) — searchable spec-level code for cross-brand filtering
- Alternative ordering per product (`product_alternatives.sort_order`) — explicit cross-brand alternatives
- Base price on every SKU
- Product aliases and synonyms (searchable)
- Local device catalog sync for offline search (see `.agents/mobile/features/sync-feature.md`)
- Link product to default warranty item (auto-populates on invoice)
- **Product images** — one or more photos per SKU (`product_images`), display image + visual search embedding
- **CSV import** — upload formatted CSV to bulk create/update products and product groups; downloadable template with column mapping guide

**Tables:** `product_groups`, `products`, `product_alternatives`, `product_images`, `product_location_overrides`, `product_tags`, `product_tag_assignments`, `org_catalog_versions`, `catalog_requests`

**API Routes:**

```
GET    /catalog                      → full catalog (org-scoped, paginated)
GET    /catalog/version              → current org catalog version (mobile sync signal)
GET    /catalog/sync                 → delta sync payload for local device cache (all local-data tables)
GET    /catalog/stock                → full stock refresh for a team (advisory, mobile)
POST   /catalog/revalidate           → live stock check for given SKUs at confirm time (mobile)
POST   /catalog/groups               → create product group
PATCH  /catalog/groups/:id           → update group
POST   /catalog/products             → create SKU
PATCH  /catalog/products/:id         → update SKU
DELETE /catalog/products/:id         → soft delete
GET    /catalog/products/search      → search by name, alias, sku_code, spec_code
GET    /catalog/products/spec/:specCode → filter products by spec code (cross-brand)
GET    /catalog/groups/:id/alternatives → all SKUs in group ordered by sort_order
POST   /catalog/products/:id/images  → upload image (stores file + returns image_url)
GET    /catalog/products/:id/images  → list product images
PATCH  /catalog/images/:id           → set is_primary, alt_text
DELETE /catalog/images/:id           → soft delete image
POST   /catalog/requests             → staff submits catalog request
GET    /catalog/requests             → admin views pending requests
PATCH  /catalog/requests/:id         → admin maps or approves
POST   /catalog/import/template      → download CSV import template
POST   /catalog/import/preview       → upload CSV, returns validation preview (errors + valid rows)
POST   /catalog/import/commit        → commit validated import
```

**UI Screens:**

```
[web]  Product group list + create/edit
[web]  Product list per group + create/edit
[web]  Product image gallery + upload
[web]  Alternative order (sort_order) per product — explicit cross-brand alternatives, no drag-drop reorder
[web]  Catalog request review queue
[web]  CSV import — download template, upload, preview validation errors, confirm commit
[expo] Product search (local cache first, API fallback)
[expo] Catalog request submission (photo + description)
[expo] Spec code filter — filter products by spec code across all brands
```

---

### MODULE 05 — Price Lists

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[db]` `[web]`

**Scope:**

- Named price lists with per-SKU overrides
- Automatic fallback to base price if SKU not in selected list
- Price list selected at quotation creation (explicit override)
- **Customer default price list** (`customers.default_price_list_id`) — when a customer is selected on a quotation/invoice and no price list is chosen explicitly, the customer's default price list is used automatically
- Price list management is a **separate web menu** from products

**Tables:** `price_lists`, `price_list_overrides`

**API Routes:**

```
GET    /price-lists                  → list all for tenant
POST   /price-lists                  → create
PATCH  /price-lists/:id              → update name
DELETE /price-lists/:id              → soft delete
POST   /price-lists/:id/overrides    → add or update SKU override
DELETE /price-lists/:id/overrides/:product_id
GET    /price-lists/:id/resolve/:product_id → resolve price with fallback logic
GET    /price-lists/resolve/:product_id     → resolve via customer default price list (customer_id param)
```

**UI Screens:**

```
[web]  Price list management — list, create, edit overrides (separate menu from Products)
[web]  Customer edit — "Default price list" selector
[expo] Price list dropdown on quotation creation + auto-selection of customer's default
```

---

### MODULE 06 — Quotation Engine

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[db]` `[expo]` `[pdf]` `[whatsapp]`

> Core POC feature. The primary product differentiator.

**Scope:**

- Create quotation with line items
- All brand alternatives shown colour-coded per product group
- "Immediate alternative" button — swap all lines to next priority brand
- Per-alternative subtotal at screen bottom
- Confirm any alternative → generate quotation ID
- Multiple confirmations per session allowed
- VAT-compliant PDF (5% Oman VAT)
- WhatsApp delivery or print

**Tables:** `quotations`, `quotation_lines`, `fulfillment_station_lines`

**API Routes:**

```
POST   /quotations                   → create draft quotation
GET    /quotations                   → list (location-scoped, filterable by status/date)
GET    /quotations/:id               → get with lines and resolved alternatives
PATCH  /quotations/:id               → update while draft
POST   /quotations/:id/confirm       → confirm selected alternative → assign ID
POST   /quotations/:id/dispatch      → split lines to fulfilment stations
POST   /quotations/:id/pdf           → generate VAT-compliant PDF
POST   /quotations/:id/whatsapp      → send PDF via WhatsApp
GET    /quotations/:id/alternatives  → all alternatives for all line items
GET    /quotations/:id/progress      → fulfilment station progress (salesperson view)
```

**UI Screens:**

```
[expo] Quotation creation — the "POS" flow (Home FAB → POS screen + cart-list screen). Add line items, select price list (auto-selects customer default), select customer
[expo] Alternatives view — colour-coded brands, per-alternative subtotals
[expo] "Immediate alternative" swap button
[expo] Confirm quotation → quotation ID assigned and displayed
[expo] Fulfilment station progress view (per-station status)
[expo] PDF preview + WhatsApp share / print
```

**PDF Must Include:**

```
- Shop logo + shop name
- VAT registration number
- Quotation ID + date + validity period
- Customer name
- Line items: product name, quantity, unit price, VAT amount, line total
- Subtotal (excl. VAT)
- VAT total (5%)
- Grand total (incl. VAT)
```

**Alternative Pricing Logic:**

```
1. For each line item, find all products in same product_group plus explicit `product_alternatives`
2. Order by `product_alternatives.sort_order` ASC, then `is_primary` DESC (auto-assigned, no reorder endpoint)
3. Apply selected price_list; if none selected, auto-use customer's default price_list
   (fallback to base_price if not overridden)
4. Display each alternative as a colour-coded row
5. Sum all lines per brand → per-alternative subtotal
6. "Immediate alternative" replaces all primary SKUs with next-priority SKU in same group
```

---

### MODULE 07 — Margin Bottom Sheet & Discount Floors

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[expo]`

**Scope:**

- Staff-only bottom sheet on tapping quotation total
- Cost price, margin per line, total margin %
- Supplier price history per SKU visible on tap
- Minimum margin floor per location
- Discount blocked below floor for salesperson
- Owner unrestricted

**API Routes:**

```
GET    /quotations/:id/margin        → margin breakdown (role-gated: salesperson limited, owner full)
GET    /products/:id/cost-history    → supplier price history for SKU
PATCH  /locations/:id/margin-floor   → update minimum margin floor %
```

**UI Screens:**

```
[expo] Margin bottom sheet (slides up on tapping quotation total)
[expo] Per-line margin % indicators
[expo] Supplier price history modal per SKU (tap cost price to open)
[expo] Discount input with floor enforcement and warning message
```

**Implementation Notes:**

- Bottom sheet is local UI only — never sent to API or included in PDF
- `salesperson` role: sees margin % but floor is enforced — cannot confirm below floor
- `owner` role: sees full cost + margin, no floor enforcement

---

### MODULE 08 — Home Screen Tags & Quick-Access (Pinned Tags)

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[expo]` `[web]`

**Scope:**

- Tags: location-scoped product shortcut groups (display only)
- Pinned quick access: staff pin **tag titles** (not individual products) to their home screen — personal, opt-in subset (max 10)
- Tag name = pinned title; tapping it opens a **modal** of the tag's products (sale price public, cost price manager-only, stock, quick add to quote)

**Tables:** `product_tags`, `product_tag_assignments`; `user_metadata.pinnedTagIds` (stores pinned tag ids)

**API Routes:**

```
GET    /tags                         → list tags for location
POST   /tags                         → create tag (manager/owner only)
PATCH  /tags/:id                     → edit name, colour, sort order
DELETE /tags/:id                     → soft delete
POST   /tags/:id/products            → assign products to tag
DELETE /tags/:id/products/:product_id
GET    /tags/:id/products            → products under tag with current price + stock
PATCH  /users/me/pinned-tags         → update personal pinned tag titles (max 10)
GET    /users/me/pinned-tags         → get pinned tags with current price + stock
```

**UI Screens:**

```
[web]  Tag management — create, edit, assign products
[expo] Home screen — horizontal row of personal pinned tag titles
[expo] Tag modal — tap a pinned title → products under tag with price + stock + quick add to quote
[expo] Pin/unpin tags (opt-in to a subset — from tag modal or tag list)
```

---

### MODULE 09 — Stock Management

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[db]` `[web]` `[expo]`

**Scope:**

- Per-location stock per SKU
- Dual tracking mode per product group (`group` or `sku`)
- Reorder thresholds and low-stock alerts
- Cross-location stock check
- Auto-decrement on invoice confirmation
- Auto-increment on return/credit note

**Tables:** `stock`, `group_stock` (view)

**API Routes:**

```
GET    /stock                        → all stock for location
GET    /stock/:product_id            → stock for specific SKU across locations
PATCH  /stock/:product_id            → manual stock adjustment (manager/owner)
GET    /stock/cross-location/:product_id → stock at all locations (same tenant)
GET    /stock/group/:group_id        → aggregated group stock for location
GET    /stock/alerts                 → products below reorder threshold
PATCH  /catalog/groups/:id/stock-mode → switch group tracking mode (with warning)
```

**UI Screens:**

```
[web]  Stock management — view, update levels, set tracking mode per group
[web]  Low-stock / reorder alert dashboard
[expo] Cross-location stock check from quotation alternatives screen
[expo] Stock level badge on product search results
```

---

## Phase 2 — Fulfilment Station System

---

### MODULE 10 — Fulfilment Station System

**Priority:** `[MUST-HAVE]` · **Tags:** `[nestjs]` `[db]` `[expo]` `[web]`

> Adapted from restaurant KOT system. Covers shop floor counters AND remote go-downs equally.

**Scope:**

- Station configuration (name = go-down identifier = printer identifier)
- Category → station default assignment
- Product-level station override
- Auto-split of confirmed quotation lines to stations on dispatch
- Station staff filtered queue — own station only
- Mark items ready
- Salesperson live progress view
- Print and reprint per station on demand

**Tables:** `fulfillment_stations`, `fulfillment_station_lines`

**API Routes:**

```
GET    /stations                     → list stations for location
POST   /stations                     → create station
PATCH  /stations/:id                 → update name, categories, printer config
DELETE /stations/:id                 → soft delete
POST   /quotations/:id/dispatch      → auto-split lines to stations
GET    /stations/:id/queue           → station staff filtered view (own station)
PATCH  /fulfillment-lines/:id/ready  → mark line item ready
GET    /quotations/:id/progress      → live progress across all stations
POST   /quotations/:id/stations/:sid/print   → print station slip
POST   /quotations/:id/stations/:sid/reprint → reprint station slip (any time)
```

**UI Screens:**

```
[web]  Station configuration — create stations, assign default categories
[expo] Station staff screen — filtered queue, mark ready buttons
[expo] Salesperson progress view — per-station pending/ready status
[expo] Print / reprint button per station on confirmed quotation screen
```

**Station Resolution Logic:**

```
For each quotation_line:
  1. Check product.station_override_id → use if set
  2. Else → check product category against station.default_category_ids
  3. Assign station_id to fulfillment_station_line
```

---

## Phase 3 — Financial Visibility

---

### MODULE 11 — VAT-Compliant Invoicing

**Priority:** `[CORE]` · **Tags:** `[nestjs]` `[db]` `[expo]` `[web]` `[pdf]`

**Scope:**

- Convert confirmed quotation to tax invoice
- Immutable after issue — no edits allowed
- VAT at 5% per line, totalled
- Invoice status lifecycle management
- OTA-compliant PDF

**Tables:** `invoices`, `invoice_lines`

**API Routes:**

```
POST   /invoices                     → convert quotation to invoice
GET    /invoices                     → list (filtered by location, status, date, contractor)
GET    /invoices/:id                 → full invoice with lines
POST   /invoices/:id/pdf             → generate OTA-compliant PDF
POST   /invoices/:id/whatsapp        → send PDF via WhatsApp
POST   /invoices/:id/void            → void (before payment only)
```

**Invoice PDF Must Include (OTA Requirements):**

```
- Shop name + logo
- VAT registration number
- Invoice number (INV-YYYY-NNNNN)
- Invoice date
- Customer / contractor name
- Line items: description, qty, unit price, VAT amount, line total
- Subtotal (excl. VAT)
- VAT total at 5%
- Grand total (incl. VAT)
```

---

### MODULE 12 — Payments

**Priority:** `[CORE]` · **Tags:** `[nestjs]` `[db]` `[expo]` `[web]`

**Tables:** `payments`

**API Routes:**

```
POST   /payments                     → record payment against invoice
GET    /invoices/:id/payments        → payment history for invoice
POST   /payments/transfer            → internal: transfer payment to new invoice on reissue
```

**UI Screens:**

```
[expo] Record payment — amount, method (cash/transfer/cheque/store credit), reference
[expo] Payment history on invoice detail
[web]  Payment management dashboard
```

---

### MODULE 13 — Returns & Credit Notes

**Priority:** `[CORE]` · **Tags:** `[nestjs]` `[db]` `[expo]` `[web]` `[pdf]`

**Scope:**

- Credit notes as the only legal return instrument — invoices never edited
- Two paths: credit only | credit and reissue
- Escape hatch: "Reissue remaining items as invoice" on partially_credited invoices
- Stock auto-restocked on return
- VAT correctly reversed and reissued
- Refund methods: cash | store credit | contractor balance deduction

**Tables:** `credit_notes`, `credit_note_lines`

**API Routes:**

```
POST   /invoices/:id/returns         → process return, select path A or B
GET    /invoices/:id/credit-notes    → all credit notes against invoice
GET    /credit-notes/:id             → credit note detail
POST   /credit-notes/:id/pdf         → generate credit note PDF
POST   /invoices/:id/reissue         → escape hatch: reissue remaining items
```

**Return Flow Logic:**

```
Path A (credit only):
  → POST /invoices/:id/returns { lines: [...], path: 'credit_only', refund_method }
  → Create CN for selected lines
  → invoice.status → 'partially_credited'
  → stock += returned quantities
  → "Reissue remaining" button becomes visible

Path B (credit and reissue):
  → POST /invoices/:id/returns { lines: [...], path: 'reissue', refund_method }
  → Create CN-1 for returned lines
  → Create CN-2 for remaining lines (auto, background)
  → invoice.status → 'fully_credited'
  → Create new invoice for remaining lines
  → If original PAID → new invoice PAID, payment transferred
  → If original UNPAID → new invoice ACTIVE

Escape hatch:
  → POST /invoices/:id/reissue
  → Same as Path B remaining steps
  → Reissue button hidden permanently after execution
```

**UI Screens:**

```
[expo] Process return — select returned items, choose path, select refund method
[expo] Credit note PDF preview + WhatsApp share / print
[expo] "Reissue remaining items as invoice" button (visible on partially_credited only)
[web]  Credit note history per invoice
```

---

### MODULE 14 — Accounts Receivable & Customer Credit

**Priority:** `[CORE]` · **Tags:** `[nestjs]` `[db]` `[web]` `[expo]`

**Tables:** `customers`, `customer_contacts`, `customer_sites`

**API Routes:**

```
POST   /customers                    → create customer (retail|account|contractor)
PATCH  /customers/:id                → update (type, credit limit, payment terms, portal access)
GET    /customers                    → list with outstanding balance, filter by type
GET    /customers/:id                → customer detail with contacts & sites
GET    /customers/:id/balance        → balance, aging, payment history
GET    /customers/:id/invoices       → invoice history with status
GET    /customers/credit-alerts      → customers near or over credit limit
POST   /customers/:id/contacts       → add contact person (site manager, purchaser, etc.)
PATCH  /customers/:id/contacts/:cid  → update contact
POST   /customers/:id/sites          → create site for contractor
PATCH  /customers/:id/sites/:sid     → update site (address, contact)
GET    /customers/:id/sites          → list sites for contractor
GET    /customers/:id/consolidated-balance → contractor total across all sites
POST   /invoices                     → create invoice with customer_id + optional site_id
```

**UI Screens:**

```
[web]  Customer management — list, create, edit (type selector: retail/account/contractor)
[web]  Customer detail — contacts, sites, credit settings, aging
[web]  Receivables aging dashboard — filter by type, site
[expo] Credit limit warning shown before confirming new quotation for account/contractor
[expo] Site selector on invoice creation (dropdown: sites + "Company HQ")
[expo] Customer list + Customer Detail (separate route) — profile, purchase history, credit/aging, loyalty card QR
[expo] Customer list quick filter — Tradesperson (customers with a linked tradespeople record)
[web]  Contractor consolidated balance view (sum across all sites)
```

---

[web] Receivables aging dashboard
[expo] Credit limit warning shown before confirming new quotation for contractor

```

---

### MODULE 15 — Supplier Management & Accounts Payable
**Priority:** `[CORE]` · **Tags:** `[nestjs]` `[db]` `[web]` `[expo]`

**Tables:** `suppliers`, `purchase_receipts`

**API Routes:**
```

POST /suppliers → create supplier
PATCH /suppliers/:id → update
GET /suppliers → list suppliers with payable totals
GET /suppliers/:id/payables → outstanding payables + due dates
POST /purchase-receipts → record delivery (trusted staff — appends to history)
GET /purchase-receipts/product/:id → price history for SKU across all suppliers
GET /payables → all supplier payables summary (owner view)

```

**UI Screens:**
```

[web] Supplier management — list, create, edit
[web] Record purchase receipt
[web] Payables dashboard — what is owed to each supplier and when
[expo] Record purchase receipt on mobile (for use on delivery)

```

---

### MODULE 16 — Conservative Cost Price Management
**Priority:** `[CORE]` · **Tags:** `[nestjs]` `[db]` `[web]` `[expo]`

**Scope:**
- Suggest highest unit cost from last 3–5 deliveries across all suppliers per SKU
- Human approval required — never auto-updates
- Notification badge for pending reviews

**API Routes:**
```

GET /cost-suggestions → SKUs with pending suggested cost updates
POST /cost-suggestions/:product_id/approve → approve suggested cost
POST /cost-suggestions/:product_id/override → manually set cost price
GET /products/:id/cost-history → full supplier price history

```

**UI Screens:**
```

[web] Cost price review dashboard — pending suggestions, approve or override
[expo] Notification badge for pending cost reviews
[expo] Cost history modal (accessible from margin bottom sheet)

```

---

### MODULE 17 — Business Reports & VAT Summary
**Priority:** `[CORE]` · **Tags:** `[nestjs]` `[web]`

**API Routes:**
```

GET /reports/daily-sales → daily summary (date filter)
GET /reports/vat-summary → quarterly OTA-format VAT report
GET /reports/invoice-log → all invoices + CNs for period (audit evidence)
GET /reports/sales-performance → by location, category, staff (month filter)
GET /reports/margin → gross margin by category/product
GET /reports/stock-movement → best/worst movers, slow-moving (60+ days)
GET /reports/receivables-aging → AR at 30/60/90 days
GET /reports/payables → AP summary by supplier
GET /reports/warranty-claims → open claims, service jobs by status

```

**UI Screens:**
```

[web] Reports dashboard with date range and location filters
[web] VAT summary — formatted for manual entry into OTA portal
[web] Export to PDF or CSV on all reports

```

---

## Phase 4 — Warranty Management

---

### MODULE 18 — Warranty Management
**Priority:** `[CORE]` · **Tags:** `[nestjs]` `[db]` `[expo]` `[web]`

**Scope:**
- Warranty catalog (separate entity — selectable on invoice like a product)
- Optional product link — auto-populates on invoice
- Editable terms, duration, and price at invoice time
- Serial number field (optional, searchable)
- Claim intake with validity check and history
- Service job reference number and status flow
- Supplier warranty recovery leg

**Tables:** `warranty_items`, `invoice_warranty_lines`, `warranty_claims`, `supplier_warranty_claims`

**API Routes:**
```

POST /warranty-items → create warranty catalog item
GET /warranty-items → list (tenant-scoped)
PATCH /warranty-items/:id → update
DELETE /warranty-items/:id → soft delete

POST /invoices/:id/warranty-lines → add warranty line to invoice
PATCH /warranty-lines/:id → edit terms, duration, serial number, price
DELETE /warranty-lines/:id → remove from invoice (before confirmation)

GET /warranty/search → search by serial number or invoice number
GET /warranty-lines/:id → warranty detail + claim history
POST /warranty-lines/:id/claims → process warranty claim
PATCH /warranty-claims/:id → update service job status
GET /warranty-claims/open → all open claims (manager/owner)
GET /warranty-claims/service → service jobs by status

POST /supplier-warranty-claims → create supplier recovery claim
PATCH /supplier-warranty-claims/:id → update status
GET /supplier-warranty-claims → list pending supplier claims

```

**Warranty Auto-Population Logic:**
```

When product added to invoice:
IF product.default_warranty_id IS NOT NULL:
→ auto-create suggested warranty line
→ set terms_notes from warranty_item defaults
→ set duration_months from warranty_item.default_duration_months
→ set max_claims from warranty_item.max_claims
→ set price = warranty_item.base_price (default 0)
→ staff can edit or remove before confirming

```

**Claim Validation Logic:**
```

On claim intake:

1. Check invoice_warranty_lines.expiry_date >= today → valid/expired
2. Check claims_used < max_claims (if max_claims not null) → allowed/exhausted
3. If valid → proceed with resolution
4. Resolution: replaced_same | replaced_alternative | refund | sent_for_service
5. If replacement → create new invoice line for replacement item
6. If service → generate service_reference (SVC-YYYY-NNNNN), set status = 'received'
7. INCREMENT claims_used
8. Optionally create supplier_warranty_claim for recovery

```

**Service Status Flow:**
```

received → sent_to_supplier → repaired → ready_for_collection → collected

```

**UI Screens:**
```

[web] Warranty catalog — list, create, edit warranty items
[expo] Warranty line on invoice — auto-populated suggestion, editable
[expo] Serial number entry field on warranty line
[expo] Warranty claim intake — search by invoice/serial, show validity + history
[expo] Claim resolution screen — select resolution type
[expo] Service job status update screen
[web] Open warranty claims dashboard
[web] Service jobs board (by status)
[web] Supplier warranty claims management

```

---

## Phase 5 — Growth & Catalogue Quality

---

### MODULE 19 — Tradesperson Loyalty & QR Points
**Priority:** `[GROWTH]` · **Tags:** `[nestjs]` `[db]` `[expo]` `[web]`

**Scope:**

- Tradespeople are **customers** — each tradesperson links to a `customers` record via `tradespeople.customer_id` (points + trade type live on the tradesperson profile)
- **Customer loyalty card QR** on the customer detail screen (encodes `customers.id`) — scanned from the app's QR Scan screen / home FAB to look up the customer and, for traders, their points
- Customer list quick filter — Tradesperson

**Tables:** `tradespeople` (links to `customers` via `customer_id`), `qr_codes`, `loyalty_redemptions`

**API Routes:**
```

POST /tradespeople → register (phone + name + trade type) — creates or links a customer record
GET /tradespeople/:id → profile + points balance
GET /tradespeople → list (searchable by phone, name, trade)
POST /qr-codes/generate-batch → pre-generate sequential QR batch
GET /qr-codes/batch/:id/download → download batch for print agency
POST /qr-codes/register-range → register batch by scanning first + last code
POST /qr-codes/scan → validate + redeem + award points
GET /qr-codes/:serial → check QR status
POST /tradespeople/:id/redeem → process quarterly redemption
GET /loyalty/redemptions/pending → all pending redemptions for current quarter

```

**QR Scan Validation Logic:**
```

POST /qr-codes/scan { serial, tradesperson_id }
→ Lookup unit_serial in qr_codes
→ NOT FOUND → return { valid: false, reason: 'invalid_code' }
→ FOUND, status = 'redeemed' → return {
valid: false,
reason: 'already_redeemed',
redeemed_by: tradesperson.name,
redeemed_at: timestamp
}
→ FOUND, status = 'registered' → {
UPDATE status = 'redeemed', tradesperson_id, scanned_by, scanned_at, redeemed_at
UPDATE tradespeople SET points_balance += points_value
return { valid: true, points_awarded: N, new_balance: M }
}

```

**UI Screens:**
```

[web] QR batch generation + download for print agency
[web] Range registration — scan first + last code
[expo] QR scan screen — camera scan, instant result display (customer loyalty card QR = customer id)
[expo] Customer detail — loyalty card QR display + print
[expo] Tradesperson registration at counter (phone + name + trade type) → creates/links a customer
[expo] Points balance display after successful scan
[expo] Customer list quick filter — Tradesperson
[web] Tradesperson list + points balances
[web] Quarterly redemption management

```

---

### MODULE 20 — Catalog Quality (Requests & Aliases)
**Priority:** `[GROWTH]` · **Tags:** `[nestjs]` `[db]` `[expo]` `[web]`

Already partially covered in MODULE 04. This module adds:
- Full catalog request workflow with photo upload
- Admin review queue with map/approve/reject actions
- Product alias management UI

**API Routes:**
```

POST /catalog/requests → staff submits (description + photo)
PATCH /catalog/requests/:id/map → admin maps to existing SKU
PATCH /catalog/requests/:id/approve → admin approves as new product
PATCH /catalog/requests/:id/reject → admin rejects with reason
POST /products/:id/aliases → add alias
DELETE /products/:id/aliases/:alias → remove alias

```

---

### MODULE 21 — Dual Stock Tracking Mode
**Priority:** `[GROWTH]` · **Tags:** `[nestjs]` `[db]` `[web]`

Already partially covered in MODULE 09. This module activates:
- Full group vs SKU mode switching UI with warning
- Group stock aggregation view
- Mode-aware display on quotation alternatives screen

---

## Phase 6 — Contractor Retention

---

## Phase 6 — Customer Retention & Portal

---

### MODULE 22 — Customer Self-Service Portal
**Priority:** `[RETENTION]` · **Tags:** `[nestjs]` `[web]` `[pdf]`

**Scope:**
- Customer login to web portal (separate from staff admin) — for `account` and `contractor` type customers
- Purchase history across all sites (for contractors) or simple history (for account customers)
- Pending vs paid invoices with aging and credit notes
- PDF download of any document
- Price visibility feature flag (default: hidden) — per customer
- "Request quotation" button → creates lead for salesperson
- Site-specific view for contractors with multiple sites

**API Routes:**
```

POST /portal/auth/login → customer login (account/contractor types)
GET /portal/sites → customer's linked sites (contractors only)
GET /portal/invoices → all invoices across sites (prices hidden if flag off)
GET /portal/invoices/:id → invoice detail + PDF
GET /portal/sites/:id/history → purchase history for site
GET /portal/credit-notes → credit notes for customer
POST /portal/quotation-requests → submit quotation request
PATCH /customers/:id/price-visibility → toggle price visibility flag (owner only)

```

**UI Screens:**
```

[web] Customer portal login (separate from admin login)
[web] Customer dashboard — sites, balances, recent invoices
[web] Invoice list + detail + PDF download
[web] Site purchase history + product search (for contractors)
[web] Request quotation form
[web] Admin — customer management, site linking
[web] Admin — price visibility toggle per customer

```
[web]  Contractor dashboard — sites, balances, recent invoices
[web]  Invoice list + detail + PDF download
[web]  Site purchase history + product search
[web]  Request quotation form
[web]  Admin — site management, link to contractor
[web]  Admin — price visibility toggle
```

---

## Phase 7 — Camera Product Search

---

### MODULE 23 — Camera-Based Product Search

**Priority:** `[SMART]` · **Tags:** `[expo]` `[vision-ai]` `[nestjs]` `[db]`

**Scope:**

- Staff points camera at physical product → image is **vectorized on-device** (embedding model, TBD)
- Only the embedding vector is sent to the API — no image upload during search
- API matches vector against `product_images.image_vector` via cosine similarity (pgvector/HNSW), org-scoped
- Returns top 3 matching SKUs with stock and price
- "Search manually instead" always visible
- Works offline via local catalog sync

**API Routes:**

```
POST   /catalog/match                → body: embedding vector → top N matching SKUs (cosine distance)
GET    /catalog/images/search        → (future) optional server-side embedding fallback when device vectorizer unavailable
```

**UI Screens:**

```
[expo] Camera screen with scan button
[expo] Detection result — top 3 SKUs with stock + price
[expo] "Search manually instead" fallback always visible
[expo] "Add to quotation" direct from result
```

**Implementation Notes:**

- Local catalog sync must be complete and fresh before this works offline
- Camera feature is a shortcut, never a replacement for manual search
- Always show fallback — no dead ends
- **Deferred:** embedding model + on-device vectorizer selected in a future release; `product_images.image_vector` + HNSW index are already in the schema

---

## Build Order Summary

```
PHASE 1 — POC (build + validate in real shop)
  01  Multi-Tenant Foundation           [MUST-HAVE]
  02  Authentication & RBAC             [MUST-HAVE]
  03  Web Admin Panel Shell             [MUST-HAVE]
  04  Product Catalog                   [MUST-HAVE]
  05  Price Lists                       [MUST-HAVE]
  06  Quotation Engine                  [MUST-HAVE]
  07  Margin Bottom Sheet               [MUST-HAVE]
  08  Home Screen Tags & Widget         [MUST-HAVE]
  09  Stock Management                  [MUST-HAVE]

PHASE 2 — Shop Floor Operations
  10  Fulfilment Station System         [MUST-HAVE]

PHASE 3 — Financial Visibility
   11  Configurable Tax Invoicing          [CORE]
   12  Payments                            [CORE]
   13  Returns & Credit Notes              [CORE]
   14  Customer Credit & Receivables       [CORE]
   15  Supplier Management & Payables      [CORE]
   16  Conservative Cost Price Mgmt        [CORE]
   17  Business Reports & Tax Summary      [CORE]

PHASE 4 — Warranty
   18  Warranty Management                 [CORE]

PHASE 5 — Growth
   19  Tradesperson Loyalty & QR           [GROWTH]
   20  Catalog Quality                     [GROWTH]
   21  Dual Stock Tracking Mode            [GROWTH]

PHASE 6 — Retention
   22  Customer Self-Service Portal        [RETENTION]

PHASE 7 — Differentiation
   23  Camera Product Search               [SMART]
```

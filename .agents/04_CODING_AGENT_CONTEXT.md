# BuildMate — Coding Agent Context

> Read this document before writing any code for BuildMate.
> It contains decisions, rules, patterns, and constraints that must be followed throughout the entire codebase.

---

## 1. Project Overview

BuildMate is a **multi-tenant SaaS** platform for building material shops. It has three delivery surfaces:

| Surface | Technology | Purpose |
|---|---|---|
| Backend API | NestJS | Business logic, auth, data |
| Web App | TanStack Start (preferred) / Next.js | Admin panel + contractor portal |
| Mobile App | React Native Expo | Shop floor quotation + fulfilment |

**Repository structure (monorepo recommended):**
```
buildmate/
  apps/
    api/          → NestJS backend
    web/          → TanStack Start / Next.js web admin
    mobile/       → React Native Expo
  packages/
    shared/       → shared types, DTOs, constants
    ui/           → shared UI components (web)
```

---

## 2. Non-Negotiable Architecture Rules

### 2.1 Multi-Tenancy — The Most Important Rule

**Every single database query must be scoped by `org_id`.**

```typescript
// WRONG — never do this
const products = await db.products.findMany();

// CORRECT — always scope by tenant
const products = await db.products.findMany({
  where: { org_id: ctx.orgId }
});
```

- `org_id` is injected into every request via NestJS middleware from the JWT claims
- `team_id` is also injected for location-scoped operations
- Both must be present on every business entity table
- Row-level security (RLS) at PostgreSQL layer is a second line of defence — not a replacement for application-level scoping

### 2.2 Immutability Rules

```typescript
// Invoices — NEVER update after status leaves 'active' → 'paid'
// Use credit notes for all adjustments

// Purchase receipts — NEVER update, only INSERT
// They are an append-only price history log

// QR codes — once status = 'redeemed', NEVER allow status change back
```

### 2.3 Cost Price — Never Auto-Update

```typescript
// WRONG — auto-updating cost price on purchase receipt
await db.products.update({ activeCostPriceMinor: receipt.unitCostMinor });

// CORRECT — suggest only, require human approval
await db.costSuggestions.upsert({
  productId: receipt.productId,
  suggestedCostMinor: await getHighestRecentCostMinor(productId, orgId),
  status: 'pending'
});
// Notify owner to review
```

### 2.4 Tax Calculation (Multi-Country, Configurable)

```typescript
// Tax rates come from tax_types table (per country) + org_tax_config overrides
// Rates stored as basis points (1/100 of 1%) — 500 = 5.00%
// VAT, service charge, delivery fee, tourism levy — all handled uniformly

// Get active tax types for org's country (with org overrides)
async function getActiveTaxTypesForOrg(orgId: string): Promise<TaxType[]> {
  const org = await db.query.orgMetadata.findFirst({ where: { orgId } })
  const countryId = org.countryId
  return db.query.taxTypes.findMany({
    where: { countryId, isActive: true },
    with: { orgConfigs: { where: { orgId } } }
  })
}

// Calculate taxes for a line total (in minor units)
function calculateLineTaxes(lineTotalMinor: bigint, taxTypes: TaxType[], orgTaxConfig: OrgTaxConfig[]) {
  return taxTypes.map(taxType => {
    const config = orgTaxConfig.find(c => c.taxTypeId === taxType.id)
    const rateBps = config?.overrideRateBasisPoints ?? taxType.rateBasisPoints
    const amountMinor = (lineTotalMinor * BigInt(rateBps)) / 10000n
    return { taxTypeId: taxType.id, rateBps, amountMinor }
  })
}

// Grand total = sum of line totals + sum of ALL tax amounts (per-line, per-tax)
// NEVER calculate tax on subtotal — always sum per-line per-tax amounts
// This prevents rounding drift and matches OTA/GCC tax authority requirements
```

### 2.5 Currency Handling (Integer Minor Units in DB)

```typescript
// DB stores ALL monetary values as INTEGER minor units (baisa, fils, halala)
// Conversion happens at API boundary using currency config from org_metadata

// UI → API (major → minor)
function toMinorUnits(major: string | number, decimalPlaces: number): bigint {
  const d = new Decimal(major)
  return d.mul(new Decimal(10).pow(decimalPlaces)).toBigInt()
}

// API → UI (minor → major)
function fromMinorUnits(minor: bigint, decimalPlaces: number): string {
  const d = new Decimal(minor.toString())
  return d.div(new Decimal(10).pow(decimalPlaces)).toFixed(decimalPlaces)
}

// Format for display with symbol
function formatCurrency(minor: bigint, currency: Currency): string {
  const major = fromMinorUnits(minor, currency.decimalPlaces)
  return `${currency.symbol} ${major}`
}

// Currency config from org_metadata join
interface Currency {
  code: string           // "OMR", "AED", "SAR"
  symbol: string         // "ر.ع.", "د.إ", "ر.س"
  decimalPlaces: number  // 3 for OMR/BHD/KWD, 2 for AED/SAR/QAR
  minorUnitPerMajor: number // 1000 or 100
}
```

### 2.5 Soft Deletes Only

```typescript
// NEVER hard delete any business record
// Always set deleted_at timestamp

// All queries must filter out deleted records
const products = await db.products.findMany({
  where: { org_id: ctx.orgId, deleted_at: null }
});
```

---

## 3. Authentication & Authorization

### 3.1 Better Auth Setup

```typescript
// Organisation = org_id
// Team = team_id
// RBAC plugin manages roles and permissions

// JWT claims include:
{
  sub: userId,
  org_id: string,
  team_id: string | null,  // null for owner (all locations)
  role: UserRole,
  permissions: string[]  // e.g. ['quotations:write', 'catalog:read']
}
```

### 3.2 NestJS Guard Pattern

```typescript
// Every protected route must use both guards
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermission('quotations:write')
@Post('/quotations')
async createQuotation(@OrgContext() ctx: OrgCtx, @Body() dto: CreateQuotationDto) {
  // ctx.orgId and ctx.teamId always available here
}
```

### 3.3 Role Permissions Reference

```typescript
// Maps to the org role statements in packages/auth/src/org-access-control/org-roles.ts
// (better-auth format is `resource: ["action", ...]`; the strings below are the `resource:action` pairs).
export const ROLE_PERMISSIONS = {
  owner: ['*'],  // all permissions, all branches (super entity)
  manager: [
    'organization:update',
    'member:update', 'member:delete',
    'invitation:create', 'invitation:cancel',
    'team:create', 'team:update', 'team:delete',
    'branches:write', 'locations:write',
    'catalog:write', 'menu:write', 'customers:write',
    'inventory:write', 'staff:write',
    'quotations:write', 'orders:write', 'billing:write',
    'payments:write', 'creditNotes:write', 'discounts:write',
    'kitchen:write', 'stationQueue:write',
    'reports:read', 'reports:export', 'settings:update',
  ],  // no organization:delete, no ac management
  branch_manager: [
    'branches:read', 'branches:update',
    'locations:read', 'locations:update',
    'catalog:read', 'menu:read', 'customers:read',
    'inventory:read', 'inventory:adjust',
    'staff:read',
    'quotations:write', 'orders:write', 'billing:write',
    'payments:read', 'creditNotes:read',
    'kitchen:write', 'stationQueue:write',
    'reports:read', 'settings:read',
  ],  // own branch only
  salesperson: [
    'catalog:read', 'menu:read',
    'quotations:write',  // limited — margin floor enforced at runtime
    'customers:write', 'discounts:read',
    'inventory:read', 'stationQueue:read',
    'reports:read',
  ],
  cashier: [
    'catalog:read', 'quotations:read',
    'billing:write', 'payments:write', 'creditNotes:write',
    'inventory:read', 'stationQueue:read',
    'reports:read',
  ],
  station_staff: [
    'stationQueue:read',   // own station only
    'stationQueue:write',  // mark ready, own station only
    'kitchen:write',
  ],
  staff: [
    'catalog:read', 'menu:read',
    'orders:create', 'orders:read',
    'inventory:read', 'stationQueue:read',
  ],  // base role — default for org-created members
};
```

---

## 4. Key Business Logic

### 4.1 Alternative Pricing Resolution

```typescript
async resolveAlternatives(
  quotationLines: QuotationLine[],
  priceListId: string | null,
  orgId: string,
  teamId: string
): Promise<AlternativeGroup[]> {
  // 1. For each line, find all products in same product_group
  // 2. Order by product_group.brand_priority[]
  // 3. Resolve price: check price_list_overrides first, fallback to products.base_price
  //    then check product_location_overrides for location-specific price
  // 4. Check stock status per SKU (for sku mode groups)
  // 5. Return grouped alternatives with resolved prices
}
```

### 4.2 Price Resolution Order

```
1. price_list_overrides (if price_list_id selected on quotation)
   → WHERE price_list_id = ? AND product_id = ?
2. product_location_overrides (location-specific base price)
   → WHERE product_id = ? AND team_id = ?
3. products.base_price (tenant-wide default)
```

### 4.3 Invoice Number Generation

```typescript
// Format: INV-YYYY-NNNNN
// Sequence resets yearly per tenant
async generateInvoiceNumber(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await db.$transaction(async (tx) => {
    // Atomic increment using SELECT FOR UPDATE or sequence
    const counter = await tx.invoice_counters.upsert({
      where: { org_id_year: { org_id: orgId, year } },
      update: { seq: { increment: 1 } },
      create: { org_id: orgId, year, seq: 1 }
    });
    return counter.seq;
  });
  return `INV-${year}-${String(seq).padStart(5, '0')}`;
}
// Same pattern for CN- and SVC- prefixes
```

### 4.4 Return / Reissue Flow

```typescript
async processReturn(invoiceId: string, dto: ProcessReturnDto, ctx: OrgCtx) {
  return db.$transaction(async (tx) => {
    if (dto.path === 'credit_only') {
      // Create CN for selected lines only
      const cn = await createCreditNote(tx, invoiceId, dto.lines, dto.refundMethod);
      // Update invoice status
      await updateInvoiceStatus(tx, invoiceId);
      // Restock returned items
      await restockItems(tx, dto.lines, ctx.teamId, ctx.orgId);
      return { creditNote: cn };
    }

    if (dto.path === 'reissue') {
      // CN-1 for returned lines
      const cn1 = await createCreditNote(tx, invoiceId, dto.lines, dto.refundMethod);
      // CN-2 for remaining lines (auto)
      const remainingLines = await getRemainingLines(tx, invoiceId, dto.lines);
      const cn2 = await createCreditNote(tx, invoiceId, remainingLines, null);
      // Close original invoice
      await tx.invoices.update({ where: { id: invoiceId },
        data: { status: 'fully_credited' } });
      // Create new invoice for remaining items
      const newInvoice = await createReplacementInvoice(tx, invoiceId, remainingLines, ctx);
      // Transfer payment if original was paid
      const originalInvoice = await tx.invoices.findUnique({ where: { id: invoiceId } });
      if (originalInvoice.status === 'paid') {
        await transferPayment(tx, invoiceId, newInvoice.id, ctx);
        await tx.invoices.update({ where: { id: newInvoice.id },
          data: { status: 'paid' } });
      }
      // Restock returned items
      await restockItems(tx, dto.lines, ctx.teamId, ctx.orgId);
      return { creditNote1: cn1, creditNote2: cn2, newInvoice };
    }
  });
}
```

### 4.5 Cost Price Suggestion Logic

```typescript
async suggestCostPriceMinor(productId: string, orgId: string): Promise<bigint | null> {
  // Get last 5 deliveries across ALL suppliers for this SKU
  const recentDeliveries = await db.purchaseReceipts.findMany({
    where: { productId, orgId },
    orderBy: { deliveryDate: 'desc' },
    take: 5,
  });
  if (recentDeliveries.length === 0) return null;
  // Return HIGHEST cost in minor units (conservative — protects margin)
  return recentDeliveries.reduce((max, r) => r.unitCostMinor > max ? r.unitCostMinor : max, 0n);
}
```

### 4.6 QR Code Scan Validation

```typescript
async scanQRCode(serial: string, tradespersonId: string, scannedBy: string, orgId: string) {
  return db.$transaction(async (tx) => {
    const qr = await tx.qr_codes.findUnique({ where: { unit_serial: serial } });

    if (!qr) return { valid: false, reason: 'invalid_code' };
    if (qr.org_id !== orgId) return { valid: false, reason: 'invalid_code' };
    if (qr.status === 'redeemed') {
      const tradesperson = await tx.tradespeople.findUnique({
        where: { id: qr.tradesperson_id }
      });
      return {
        valid: false,
        reason: 'already_redeemed',
        redeemed_by: tradesperson.name,
        redeemed_at: qr.redeemed_at,
      };
    }
    // Mark as redeemed
    await tx.qr_codes.update({
      where: { id: qr.id },
      data: {
        status: 'redeemed',
        tradesperson_id: tradespersonId,
        scanned_by: scannedBy,
        scanned_at: new Date(),
        redeemed_at: new Date(),
      }
    });
    // Award points
    const POINTS_PER_SCAN = 10; // configurable per tenant later
    const updated = await tx.tradespeople.update({
      where: { id: tradespersonId },
      data: { points_balance: { increment: POINTS_PER_SCAN } }
    });
    return { valid: true, points_awarded: POINTS_PER_SCAN, new_balance: updated.points_balance };
  });
}
```

### 4.7 Warranty Claim Processing

```typescript
async processWarrantyClaim(warrantyLineId: string, dto: ClaimDto, ctx: OrgCtx) {
  const warrantyLine = await db.invoice_warranty_lines.findUnique({
    where: { id: warrantyLineId }
  });

  // Validate
  if (new Date() > warrantyLine.expiry_date) {
    throw new BadRequestException('Warranty expired');
  }
  if (warrantyLine.max_claims && warrantyLine.claims_used >= warrantyLine.max_claims) {
    throw new BadRequestException('Maximum claims reached');
  }

  return db.$transaction(async (tx) => {
    // Generate service reference if service claim
    let serviceReference = null;
    if (dto.claim_type === 'service') {
      serviceReference = await generateServiceReference(tx, ctx.orgId);
    }

    // Create claim record
    const claim = await tx.warranty_claims.create({ data: {
      warranty_line_id: warrantyLineId,
      org_id: ctx.orgId,
      claim_type: dto.claim_type,
      resolution: dto.resolution,
      service_reference: serviceReference,
      service_status: dto.claim_type === 'service' ? 'received' : null,
      handled_by: ctx.userId,
      notes: dto.notes,
    }});

    // Increment claims_used
    await tx.invoice_warranty_lines.update({
      where: { id: warrantyLineId },
      data: { claims_used: { increment: 1 } }
    });

    // Restock if replacement
    if (dto.resolution?.startsWith('replaced_')) {
      await restockItem(tx, warrantyLine.invoice_line_id, ctx.teamId, ctx.orgId);
    }

    return claim;
  });
}
```

### 4.8 Fulfilment Station Line Dispatch

```typescript
async dispatchToStations(quotationId: string, ctx: OrgCtx) {
  const lines = await db.quotation_lines.findMany({
    where: { quotation_id: quotationId },
    include: { product: true }
  });

  const stations = await db.fulfillment_stations.findMany({
    where: { team_id: ctx.teamId, org_id: ctx.orgId }
  });

  for (const line of lines) {
    // 1. Product-level station override takes priority
    let stationId = line.product.station_override_id;

    // 2. Fallback: match product category to station default_category_ids
    if (!stationId) {
      const station = stations.find(s =>
        s.default_category_ids.includes(line.product.product_group_id)
      );
      stationId = station?.id ?? null;
    }

    if (stationId) {
      await db.fulfillment_station_lines.create({
        data: {
          quotation_line_id: line.id,
          station_id: stationId,
          org_id: ctx.orgId,
          status: 'pending',
        }
      });
    }
  }
}
```

---

## 5. API Design Standards

### 5.1 Response Format

```typescript
// Success
{
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 20 }  // pagination when applicable
}

// Error
{
  "error": {
    "code": "INVOICE_IMMUTABLE",
    "message": "Invoice cannot be modified after issue",
    "details": {}
  }
}
```

### 5.2 Standard Error Codes

```typescript
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TENANT_MISMATCH: 'TENANT_MISMATCH',

  // Quotation
  QUOTATION_ALREADY_CONFIRMED: 'QUOTATION_ALREADY_CONFIRMED',
  NO_ALTERNATIVES_FOUND: 'NO_ALTERNATIVES_FOUND',
  MARGIN_BELOW_FLOOR: 'MARGIN_BELOW_FLOOR',

  // Invoice
  INVOICE_IMMUTABLE: 'INVOICE_IMMUTABLE',
  INVOICE_ALREADY_PAID: 'INVOICE_ALREADY_PAID',
  INVOICE_FULLY_CREDITED: 'INVOICE_FULLY_CREDITED',

  // QR
  QR_INVALID: 'QR_INVALID',
  QR_ALREADY_REDEEMED: 'QR_ALREADY_REDEEMED',

  // Warranty
  WARRANTY_EXPIRED: 'WARRANTY_EXPIRED',
  WARRANTY_CLAIMS_EXHAUSTED: 'WARRANTY_CLAIMS_EXHAUSTED',

  // Credit
  CREDIT_LIMIT_EXCEEDED: 'CREDIT_LIMIT_EXCEEDED',
  CREDIT_LIMIT_WARNING: 'CREDIT_LIMIT_WARNING',
};
```

### 5.3 Pagination

```typescript
// All list endpoints support:
GET /invoices?page=1&limit=20&status=active&from=2026-01-01&to=2026-03-31

// Response always includes:
{
  "data": [...],
  "meta": { "total": 150, "page": 1, "limit": 20, "pages": 8 }
}
```

### 5.4 Filtering Standards

```typescript
// Standard filter params used across all list endpoints:
// org_id    → always injected from JWT, never from query param
// team_id  → injected from JWT or query param (owner can query any location)
// from         → date range start (ISO 8601)
// to           → date range end
// status       → entity status filter
// search       → text search
// page + limit → pagination
```

---

## 6. Mobile App (Expo) Patterns

### 6.1 Local Catalog Sync

```typescript
// Expo SQLite for local catalog cache
// Sync strategy: delta sync using updated_at timestamp

async function syncCatalog(orgId: string, teamId: string) {
  const lastSync = await getLastSyncTimestamp();
  const delta = await api.get(`/catalog/sync?since=${lastSync}&team_id=${teamId}`);
  await updateLocalCatalog(delta.products, delta.groups, delta.price_lists);
  await setLastSyncTimestamp(new Date());
}

// All product search queries hit local SQLite first
// API fallback only when local cache is empty or stale (>1 hour)
```

### 6.2 QR Scanner

```typescript
// Use expo-camera with barcode scanner
// Support QR code format only
// Debounce scans — ignore duplicate scans within 2 seconds
// Show result immediately with clear visual feedback:
//   GREEN → valid scan, points awarded
//   RED   → already redeemed, show who/when
//   ORANGE → invalid code
```

### 6.3 PDF Generation

```typescript
// Use react-native-html-to-pdf or expo-print
// Generate PDF from HTML template on device
// Share via expo-sharing → opens WhatsApp / email / print sheet
// PDF stored temporarily in FileSystem.cacheDirectory
// Never store PDFs permanently on device
```

### 6.4 Offline Handling

```typescript
// Quotation creation: works fully offline using local catalog cache
// QR scanning: requires network (anti-fraud validation must be server-side)
// Fulfilment station: requires network (real-time status)
// Show clear offline indicator in app header
// Queue offline actions and sync when reconnected (quotation drafts only)
```

---

## 7. Web App Patterns

### 7.1 TanStack Start / Next.js

```typescript
// Use server components for data fetching where possible
// Client components only for interactive UI
// All API calls use fetch with credentials: 'include' for Better Auth cookies
// Protect all admin routes with middleware checking Better Auth session
```

### 7.2 Customer Portal

```typescript
// Customer portal at /portal/* routes
// Separate login from admin login
// Auth via Better Auth but separate session scope
// Supports customer types: "account" (view-only) and "contractor" (full multi-site)
// Price visibility enforced server-side — never trust client to hide prices
// All portal data filtered by customer_id from session — never expose other customer data
// Contractor users see consolidated balance across sites + site filter
```

---

## 8. Database Patterns

### 8.1 Drizzle Schema Conventions

```typescript
// All BuildMate tables follow this pattern:
export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  productGroupId: text("product_group_id")
    .references(() => productGroups.id),
  name: text("name").notNull(),
  skuCode: text("sku_code"),
  specCode: text("spec_code"),  // e.g. "PP32UP" for 3/4" PVC Pipe — searchable spec code across brands
  brandTag: text("brand_tag"),  // e.g. "brand_a", "brand_b"
  basePriceMinor: bigint("base_price_minor", { mode: "bigint" }).default(0).notNull(),
  activeCostPriceMinor: bigint("active_cost_price_minor", { mode: "bigint" }).default(0).notNull(),
  costLastUpdated: timestamp("cost_last_updated"),
  unit: text("unit"),
  stationOverrideId: text("station_override_id")
    .references(() => fulfillmentStations.id),
  defaultWarrantyId: text("default_warranty_id")
    .references(() => warrantyItems.id),
  eligibleForLoyalty: boolean("eligible_for_loyalty").default(false).notNull(),
  reorderThreshold: integer("reorder_threshold"),
  aliases: text("aliases").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("products_org_id_idx").on(t.orgId),
  index("products_org_group_idx").on(t.orgId, t.productGroupId),
  index("products_org_brand_idx").on(t.orgId, t.brandTag),
  index("products_org_spec_code_idx").on(t.orgId, t.specCode),
])
```

### 8.2 Drizzle Query Syntax (v1.0.0-rc.4)

```typescript
// ✅ CORRECT — object syntax (v1.0.0-rc.4)
const products = await db.query.products.findMany({
  where: { orgId: ctx.orgId, deletedAt: null },
})

// ❌ WRONG — callback syntax (drizzle v0.x, causes type errors)
const products = await db.query.products.findMany({
  where: (fields, ops) => ops.eq(fields.orgId, ctx.orgId),
})
```

### 8.3 DRIZZLE_TOKEN Pattern

```typescript
// Always inject DatabaseClient via DRIZZLE_TOKEN — never NodePgDatabase<any>
import { DatabaseClient, DRIZZLE_TOKEN } from '@buildmate/db'

@Injectable()
export class QuotationService {
  constructor(@Inject(DRIZZLE_TOKEN) private db: DatabaseClient) {}
}
```

### 8.4 Transaction Pattern

```typescript
// All operations touching multiple tables must use transactions
await db.transaction(async (tx) => {
  await tx.update(quotations).set({ status: 'confirmed' }).where(...)
  await dispatchToStations(tx, quotationId, ctx)
  await decrementStock(tx, lines, ctx.teamId)
})
```

### 8.5 Product Images & Vector Search

```typescript
// product_images — one row per photo. image_url is ALWAYS the absolute public URL.
// storage_key is the provider key / local relative path (nullable).
export const productImages = pgTable("product_images", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  productId: text("product_id").notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  storageKey: text("storage_key"),
  imageVector: vector("image_vector", { dimensions: 512 }), // pgvector; dimension TBD by model
  isPrimary: boolean("is_primary").default(false).notNull(),
  altText: text("alt_text"),
  mimeType: text("mime_type"),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("product_images_product_idx").on(t.productId),
  index("product_images_org_idx").on(t.orgId),
  index("product_images_vector_hnsw")
    .using("hnsw", t.imageVector.op("vector_cosine_ops"))
    .where(sql`${t.deletedAt} IS NULL`),
])
```

**Rules:**
- `image_url` is always a **fully-resolvable public URL**. Never store relative paths or bytes in the DB.
- Binary backend is a **deploy-time config**: local installs write to a public folder on the client machine; SaaS uses an object store/CDN. Same table, no per-row storage switch.
- Upload flow: bytes → API → backend → public URL → persist in `image_url`.
- **Vector search (Phase 7, deferred model):** phone vectorizes on-device, sends only the vector; API matches with cosine distance scoped to `org_id`. Do not upload raw search images.
- Requires `pgvector` extension and the HNSW index above. Dimension `512` is a placeholder — update it once the embedding model is chosen.


### 8.3 Numeric Precision

```typescript
// All monetary values: numeric(12,3) — 3 decimal places (Omani Rial uses 3 decimals)
// All quantities: numeric(12,3) — supports fractional units (e.g. 2.5 meters)
// All percentages: numeric(5,2) — e.g. 5.00 for VAT, 2.50 for margin floor
// NEVER use JavaScript floating point for money — use a decimal library (decimal.js)
```

---

## 9. Security Checklist

Before shipping any API endpoint, verify:

- [ ] `org_id` scoping applied to all database queries
- [ ] Role/permission check on the route
- [ ] Location isolation enforced (non-owners cannot query other locations)
- [ ] Input validated with class-validator DTOs
- [ ] Immutable records cannot be mutated
- [ ] Credit note reason is always provided and valid
- [ ] Contractor portal cannot access staff admin routes
- [ ] QR scan validation is atomic (transaction)
- [ ] Cost price update requires explicit human approval action

---

## 10. Environment Variables

```bash
# Database
BUILDMATE_DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# App
SINGLE_TENANT_MODE=false
DEFAULT_MARGIN_FLOOR=2.00
QR_POINTS_PER_SCAN=10

# Services
WHATSAPP_API_URL=
WHATSAPP_API_KEY=

# Vision / embeddings (Phase 7 — deferred; unset until model selected)
VISION_API_KEY=
VISION_API_URL=

# File storage
# Local installs: IMAGE_STORAGE_BACKEND=local, IMAGE_PUBLIC_DIR=/var/www/buildmate/uploads
# Cloud SaaS: IMAGE_STORAGE_BACKEND=s3 (or r2/cloudinary), + bucket/region/keys
IMAGE_STORAGE_BACKEND=
IMAGE_PUBLIC_DIR=
IMAGE_PUBLIC_URL_PREFIX=
STORAGE_BUCKET=
STORAGE_REGION=
```

---

## 11. Naming Conventions

```
Database tables:    snake_case plural         (product_groups, invoice_lines)
Database columns:   snake_case               (org_id, created_at)
TypeScript types:   PascalCase               (ProductGroup, InvoiceLine)
NestJS DTOs:        PascalCase + suffix       (CreateQuotationDto, UpdateProductDto)
NestJS services:    PascalCase + Service      (QuotationService, WarrantyService)
NestJS controllers: PascalCase + Controller   (InvoiceController)
API routes:         kebab-case plural         (/quotation-lines, /credit-notes)
Expo screens:       PascalCase + Screen       (QuotationScreen, ScanQRScreen)
Expo components:    PascalCase                (AlternativeRow, StationQueue)
```

---

## 12. What NOT to Build

Do not build these — they are explicitly out of scope:

- Balance sheets, P&L, income statements
- Payroll or HR features
- Bank reconciliation
- Automated VAT filing (generate summary only)
- Tally / QuickBooks integration
- E-commerce / customer-facing storefront
- Delivery tracking or logistics
- Multi-currency support (OMR only)
- Automated WhatsApp messages (manual send only for now)
- Ownership transfer between users
- Staff self-registration (owner creates all staff)

---

## 13. Better Auth Integration Patterns

### 13.1 OrgCtx — Request Context Object

```typescript
// Injected by NestJS middleware from Better Auth session
interface OrgCtx {
  userId: string        // Better Auth user.id
  orgId: string         // Better Auth organization.id = tenant
  teamId: string | null // Better Auth team.id = location (null for owner)
  role: UserRole
  permissions: string[]
}
```

### 13.2 Session Fields Used

```typescript
// session.activeOrganizationId → ctx.orgId
// session.activeTeamId         → ctx.teamId
// member.role                  → ctx.role
// user.customAccountType       → 'owner' | 'staff'
// user.passwordResetRequired   → force password change on first login
```

### 13.3 Staff Registration Rule

```typescript
// When owner creates a staff account:
await authService.api.createUser({
  // ... name, email, role
  data: {
    customAccountType: 'staff',
    passwordResetRequired: true,
    // can_create_org enforced by Better Auth maxOrganizationsPerUser logic
  }
})
// Staff accounts can_create_org is prevented via Better Auth
// allowUserToCreateOrganization hook — returns false for customAccountType: 'staff'
```

### 13.4 org_id / team_id Scoping Pattern

```typescript
// Every NestJS service method receives ctx: OrgCtx
// Every DB query scopes by org_id — no exceptions

// WRONG
const quotations = await db.query.quotations.findMany()

// CORRECT
const quotations = await db.query.quotations.findMany({
  where: { orgId: ctx.orgId, teamId: ctx.teamId ?? undefined }
})

// Owner (teamId: null) can query all teams:
const where = ctx.teamId
  ? { orgId: ctx.orgId, teamId: ctx.teamId }
  : { orgId: ctx.orgId }
const quotations = await db.query.quotations.findMany({ where })
```

### 13.5 Extending org / team / user

```typescript
// Better Auth organization, team, and user tables are owned by Better Auth.
// BuildMate extends them via:
//   org_metadata   (one-to-one with organization)
//   team_metadata  (one-to-one with team)
//   user_metadata  (one-to-one with user)
//
// When reading org settings, join org_metadata:
const org = await db.query.orgMetadata.findFirst({
  where: { orgId: ctx.orgId }
})
```

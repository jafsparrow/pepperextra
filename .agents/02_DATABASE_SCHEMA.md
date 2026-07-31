# BuildMate — Database Schema

> **ORM:** Drizzle ORM · **Driver:** node-postgres · **Database:** PostgreSQL
>
> **Do NOT define** the following tables — they are owned by Better Auth:
> `user`, `session`, `account`, `verification`, `organization`, `team`, `member`, `teamMember`, `invitation`
>
> Better Auth `organization.id` = `org_id` throughout this schema.
> Better Auth `team.id` = `team_id` throughout this schema.
>
> Every BuildMate business table carries `org_id`. Tables with location scope also carry `team_id`.

---

## Conventions

- **Primary keys:** `text` (matches Better Auth id format) or `uuid` via `gen_random_uuid()`
- **Timestamps:** `timestamp` (UTC stored)
- **Soft deletes:** `deleted_at timestamp NULL` — never hard delete business records
- **`org_id` is NEVER nullable** on any business entity
- **Drizzle relations** defined separately in `schema-relations/`
- **Monetary values:** Stored as **integer minor units** (baisa, fils, halala) — `bigint` in DB
  - Conversion: `major * 10^decimalPlaces` (e.g., OMR 123.456 → 123456)
  - Currency config defines `decimalPlaces` and `minorUnitPerMajor`
- **Quantities:** `numeric(12,3)` — supports fractional units (e.g. 2.5 meters)
- **Percentages:** `numeric(5,2)` — e.g. 5.00 for 5% VAT
- **Tax rates:** Stored as basis points (1/100 of 1%) — `integer` (500 = 5.00%)
  - Conversion: `rate / 10000` (500 → 0.05)
- **Images:** Product images live in `product_images`. The `image_url` column always stores an
  **absolute public URL**. Binary file storage is a **deploy-time concern**, not a schema one —
  see **Section 18. Image Storage Strategy** below.
- **Vector search:** `product_images.image_vector` is a `pgvector` column (`vector(512)` placeholder).
  Requires the `pgvector` extension. Similarity search uses the HNSW index with cosine distance.
  The embedding **model is selected in a future release** — the schema is already in place.

---

## 0. Localization & Tax Configuration

### `countries`
```typescript
export const countries = pgTable("countries", {
  id: text("id").primaryKey(),           // ISO 3166-1 alpha-2: "OM", "AE", "SA", "QA", "BH", "KW"
  name: text("name").notNull(),          // "Oman", "United Arab Emirates"
  isoCode: text("iso_code").notNull(),   // "OM", "AE", "SA"
  currencyId: text("currency_id").notNull().references(() => currencies.id),
  defaultVatRate: integer("default_vat_rate").default(500).notNull(), // basis points: 500 = 5.00%
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("countries_iso_code_uidx").on(t.isoCode),
])
```

### `currencies`
```typescript
export const currencies = pgTable("currencies", {
  id: text("id").primaryKey(),           // ISO 4217: "OMR", "AED", "SAR", "QAR", "BHD", "KWD"
  code: text("code").notNull().unique(), // "OMR"
  name: text("name").notNull(),          // "Omani Rial"
  symbol: text("symbol").notNull(),      // "ر.ع." or "OMR"
  decimalPlaces: integer("decimal_places").notNull(), // 3 for OMR/BHD/KWD, 2 for AED/SAR/QAR
  minorUnitPerMajor: integer("minor_unit_per_major").notNull(), // 1000 or 100
  iconUrl: text("icon_url"),             // optional flag/icon URL
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("currencies_code_uidx").on(t.code),
])
```

### `tax_types`
Configurable tax/charge types per country. VAT, service charge, delivery fee, etc.
```typescript
export const taxTypes = pgTable("tax_types", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  countryId: text("country_id").notNull().references(() => countries.id),
  code: text("code").notNull(),          // "VAT", "SERVICE_CHARGE", "DELIVERY_FEE", "TOURISM_LEVY"
  name: text("name").notNull(),          // "Value Added Tax", "Service Charge"
  description: text("description"),
  rateBasisPoints: integer("rate_basis_points").default(0).notNull(), // 500 = 5.00%
  isPercentage: boolean("is_percentage").default(true).notNull(), // false = fixed amount per line/invoice
  fixedAmountMinor: bigint("fixed_amount_minor", { mode: "bigint" }), // if not percentage
  appliesTo: taxAppliesToEnum("applies_to").default("line").notNull(), // "line" | "invoice" | "shipping"
  isMandatory: boolean("is_mandatory").default(false).notNull(), // VAT = true, delivery = false
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("tax_types_country_code_uidx").on(t.countryId, t.code),
  index("tax_types_country_active_idx").on(t.countryId, t.isActive),
])

export const taxAppliesToEnum = pgEnum("tax_applies_to", ["line", "invoice", "shipping"])
```

### `org_tax_config`
Per-org overrides for tax types (e.g., VAT-exempt org, custom service charge %)
```typescript
export const orgTaxConfig = pgTable("org_tax_config", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  taxTypeId: text("tax_type_id").notNull().references(() => taxTypes.id),
  overrideRateBasisPoints: integer("override_rate_basis_points"), // null = use country default
  overrideFixedAmountMinor: bigint("override_fixed_amount_minor", { mode: "bigint" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("org_tax_config_org_tax_uidx").on(t.orgId, t.taxTypeId),
])
```

---

## Better Auth Extension Tables

### `org_metadata`
Extends Better Auth `organization`. One row per org.
```typescript
export const orgMetadata = pgTable("org_metadata", {
  orgId: text("org_id").primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  countryId: text("country_id").notNull().references(() => countries.id).default("OM"),
  currencyId: text("currency_id").notNull().references(() => currencies.id).default("OMR"),
  vatNumber: text("vat_number"),
  subscriptionTier: text("subscription_tier").default("trial").notNull(),
  singleTenantMode: boolean("single_tenant_mode").default(false).notNull(),
  priceVisibility: boolean("price_visibility").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
})
```

### `team_metadata`
Extends Better Auth `team`. One row per team (branch/location).
```typescript
export const teamMetadata = pgTable("team_metadata", {
  teamId: text("team_id").primaryKey()
    .references(() => team.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  address: text("address"),
  marginFloor: numeric("margin_floor", { precision: 5, scale: 2 })
    .default("2.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("team_metadata_org_id_idx").on(t.orgId),
])
```

### `user_metadata`
Extends Better Auth `user`. One row per user.
```typescript
export const userMetadata = pgTable("user_metadata", {
  userId: text("user_id").primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  teamId: text("team_id")
    .references(() => team.id),  // NULL = owner (access to all teams)
  pinnedSkuIds: text("pinned_sku_ids").array(),  // quick-access widget, max 10
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("user_metadata_org_id_idx").on(t.orgId),
  index("user_metadata_org_team_idx").on(t.orgId, t.teamId),
])
```

> Note: role is stored on Better Auth `member.role`
> Note: customAccountType (owner|staff) and passwordResetRequired are on Better Auth `user`

---

## 1. Product Catalog

### `product_groups`
```typescript
export const productGroups = pgTable("product_groups", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  specName: text("spec_name").notNull(),  // e.g. "3/4 inch PVC Pipe"
  brandPriority: text("brand_priority").array(),  // ordered brand_tag values
  stockTrackingMode: stockModeEnum("stock_tracking_mode").default("sku").notNull(),
  groupReorderThreshold: integer("group_reorder_threshold"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("product_groups_org_id_idx").on(t.orgId),
  uniqueIndex("product_groups_org_spec_uidx").on(t.orgId, t.specName),
])

export const stockModeEnum = pgEnum("stock_mode", ["group", "sku"])
```

### `products`
```typescript
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
  unit: text("unit"),  // piece, meter, kg, box etc.
  stationOverrideId: text("station_override_id")
    .references(() => fulfillmentStations.id),
  defaultWarrantyId: text("default_warranty_id")
    .references(() => warrantyItems.id),
  eligibleForLoyalty: boolean("eligible_for_loyalty").default(false).notNull(),
  reorderThreshold: integer("reorder_threshold"),
  aliases: text("aliases").array(),  // searchable synonyms
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("products_org_id_idx").on(t.orgId),
  index("products_org_group_idx").on(t.orgId, t.productGroupId),
  index("products_org_brand_idx").on(t.orgId, t.brandTag),
  index("products_org_spec_code_idx").on(t.orgId, t.specCode),  // index for spec-based filtering
])
// Note: GIN index on aliases added via raw migration for full-text search
```

### `product_images`
Product photos for display, plus a `pgvector` embedding for camera-based visual search.
```typescript
export const productImages = pgTable("product_images", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  productId: text("product_id").notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),   // absolute public URL (local static path or CDN)
  storageKey: text("storage_key"),         // provider-specific object key / local relative path
  imageVector: vector("image_vector", { dimensions: 512 }), // embedding for similarity search
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
  // HNSW index for approximate nearest-neighbour search (cosine distance)
  index("product_images_vector_hnsw")
    .using("hnsw", t.imageVector.op("vector_cosine_ops"))
    .where(sql`${t.deletedAt} IS NULL`),
])
```
> **Embedding dimension:** `512` is a placeholder. The exact dimension is locked when the
> embedding model is selected (e.g. CLIP-family models produce 512/768/1024-dim vectors).
> Requires the `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`

### `product_location_overrides`
Per-team price overrides for specific SKUs.
```typescript
export const productLocationOverrides = pgTable("product_location_overrides", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  productId: text("product_id").notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  priceOverrideMinor: bigint("price_override_minor", { mode: "bigint" }),
}, (t) => [
  uniqueIndex("product_loc_override_uidx").on(t.productId, t.teamId),
  index("product_loc_override_org_team_idx").on(t.orgId, t.teamId),
])
```

### `catalog_requests`
```typescript
export const catalogRequests = pgTable("catalog_requests", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  teamId: text("team_id").notNull()
    .references(() => team.id),
  submittedBy: text("submitted_by").notNull()
    .references(() => user.id),
  description: text("description").notNull(),
  photoUrl: text("photo_url"),
  status: catalogRequestStatusEnum("status").default("pending").notNull(),
  mappedToSku: text("mapped_to_sku")
    .references(() => products.id),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("catalog_requests_org_status_idx").on(t.orgId, t.status),
])

export const catalogRequestStatusEnum = pgEnum("catalog_request_status",
  ["pending", "mapped", "approved", "rejected"])
```

---

## 2. Price Lists

### `price_lists`
```typescript
export const priceLists = pgTable("price_lists", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  uniqueIndex("price_lists_org_name_uidx").on(t.orgId, t.name),
  index("price_lists_org_id_idx").on(t.orgId),
])
```

### `price_list_overrides`
```typescript
export const priceListOverrides = pgTable("price_list_overrides", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  priceListId: text("price_list_id").notNull()
    .references(() => priceLists.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull()
    .references(() => products.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  priceMinor: bigint("price_minor", { mode: "bigint" }).notNull(),
}, (t) => [
  uniqueIndex("price_list_overrides_uidx").on(t.priceListId, t.productId),
  index("price_list_overrides_list_idx").on(t.priceListId),
])
```

---

## 3. Home Screen Tags

### `product_tags`
```typescript
export const productTags = pgTable("product_tags", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  teamId: text("team_id").notNull()
    .references(() => team.id),
  name: text("name").notNull(),
  colour: text("colour"),  // hex e.g. #FF5733
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  uniqueIndex("product_tags_team_name_uidx").on(t.teamId, t.name),
  index("product_tags_org_team_idx").on(t.orgId, t.teamId),
])
```

### `product_tag_assignments`
```typescript
export const productTagAssignments = pgTable("product_tag_assignments", {
  tagId: text("tag_id").notNull()
    .references(() => productTags.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull()
    .references(() => products.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.tagId, t.productId] }),
])
```

---

## 4. Stock

### `stock`
```typescript
export const stock = pgTable("stock", {
  productId: text("product_id").notNull()
    .references(() => products.id),
  teamId: text("team_id").notNull()
    .references(() => team.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.productId, t.teamId] }),
  index("stock_org_team_idx").on(t.orgId, t.teamId),
])
```

> Group stock is a computed value — sum of all SKU quantities in a `product_group` per team.
> Implement as a DB view or compute at query time in the service layer.

---

## 5. Fulfilment Stations

### `fulfillment_stations`
```typescript
export const fulfillmentStations = pgTable("fulfillment_stations", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  teamId: text("team_id").notNull()
    .references(() => team.id),
  name: text("name").notNull(),  // "Plumbing Counter", "Pipes Go-Down"
  defaultCategoryIds: text("default_category_ids").array(),
  printerName: text("printer_name"),  // printer = station = go-down identifier
  printerIp: text("printer_ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("fulfillment_stations_org_team_idx").on(t.orgId, t.teamId),
])
```

### `fulfillment_station_lines`
```typescript
export const fulfillmentStationLines = pgTable("fulfillment_station_lines", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  quotationLineId: text("quotation_line_id").notNull()
    .references(() => quotationLines.id),
  stationId: text("station_id").notNull()
    .references(() => fulfillmentStations.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  status: stationLineStatusEnum("status").default("pending").notNull(),
  markedReadyAt: timestamp("marked_ready_at"),
  markedBy: text("marked_by")
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("station_lines_station_status_idx").on(t.stationId, t.status),
  index("station_lines_quotation_line_idx").on(t.quotationLineId),
])

export const stationLineStatusEnum = pgEnum("station_line_status", ["pending", "ready"])
```

---

## 6. Quotations

### `quotations`
```typescript
export const quotations = pgTable("quotations", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  teamId: text("team_id").notNull()
    .references(() => team.id),
  customerId: text("customer_id")
    .references(() => customers.id),
  siteId: text("site_id")
    .references(() => sites.id),
  // For walk-in customers without account
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  priceListId: text("price_list_id")
    .references(() => priceLists.id),
  status: quotationStatusEnum("status").default("draft").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  createdBy: text("created_by").notNull()
    .references(() => user.id),
  // Tax snapshot at confirmation
  taxSnapshot: jsonb("tax_snapshot"), // { taxTypeId: { rate, amountMinor }[] }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("quotations_org_team_idx").on(t.orgId, t.teamId),
  index("quotations_org_status_idx").on(t.orgId, t.status),
  index("quotations_org_customer_idx").on(t.orgId, t.customerId),
  index("quotations_org_site_idx").on(t.orgId, t.siteId),
])

export const quotationStatusEnum = pgEnum("quotation_status",
  ["draft", "confirmed", "converted_to_invoice", "expired"])
```

### `quotation_lines`
```typescript
export const quotationLines = pgTable("quotation_lines", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  quotationId: text("quotation_id").notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull()
    .references(() => products.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPriceMinor: bigint("unit_price_minor", { mode: "bigint" }).notNull(),
  costPriceAtQuoteMinor: bigint("cost_price_at_quote_minor", { mode: "bigint" }).notNull(),
  lineTotalMinor: bigint("line_total_minor", { mode: "bigint" }).notNull(),
  // Per-line tax breakdown (vat, service charge, etc.)
  taxBreakdown: jsonb("tax_breakdown"), // { taxTypeId: { rateBps, amountMinor }[] }
  stationId: text("station_id")
    .references(() => fulfillmentStations.id),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("quotation_lines_quotation_idx").on(t.quotationId),
])
```

### `quotation_charges`
Additional charges on quotation (delivery, service fee, etc.) — separate from line items
```typescript
export const quotationCharges = pgTable("quotation_charges", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  quotationId: text("quotation_id").notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  taxTypeId: text("tax_type_id").notNull()
    .references(() => taxTypes.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  description: text("description"), // "Delivery to Muscat"
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  taxBreakdown: jsonb("tax_breakdown"), // if charge itself is taxable
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("quotation_charges_quotation_idx").on(t.quotationId),
])
```

---

## 7. Invoices

### `invoices`
```typescript
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  teamId: text("team_id").notNull()
    .references(() => team.id),
  quotationId: text("quotation_id")
    .references(() => quotations.id),
  customerId: text("customer_id")
    .references(() => customers.id),
  siteId: text("site_id")
    .references(() => sites.id),
  invoiceNumber: text("invoice_number").notNull(),  // INV-YYYY-NNNNN
  subtotalMinor: bigint("subtotal_minor", { mode: "bigint" }).notNull(),
  taxTotalMinor: bigint("tax_total_minor", { mode: "bigint" }).notNull(),
  grandTotalMinor: bigint("grand_total_minor", { mode: "bigint" }).notNull(),
  // Full tax breakdown at invoice level
  taxBreakdown: jsonb("tax_breakdown").notNull(), // { taxTypeId: { name, rateBps, amountMinor }[] }
  status: invoiceStatusEnum("status").default("active").notNull(),
  dueDate: date("due_date"),
  issuedBy: text("issued_by").notNull()
    .references(() => user.id),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("invoices_org_number_uidx").on(t.orgId, t.invoiceNumber),
  index("invoices_org_status_idx").on(t.orgId, t.status),
  index("invoices_org_customer_idx").on(t.orgId, t.customerId),
  index("invoices_org_issued_at_idx").on(t.orgId, t.issuedAt),
])

export const invoiceStatusEnum = pgEnum("invoice_status",
  ["active", "paid", "partially_credited", "fully_credited", "void"])
```

### `invoice_lines`
```typescript
export const invoiceLines = pgTable("invoice_lines", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  invoiceId: text("invoice_id").notNull()
    .references(() => invoices.id, { onDelete: "restrict" }),
  productId: text("product_id").notNull()
    .references(() => products.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  description: text("description"),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPriceMinor: bigint("unit_price_minor", { mode: "bigint" }).notNull(),
  costPriceMinor: bigint("cost_price_minor", { mode: "bigint" }).notNull(),
  lineTotalMinor: bigint("line_total_minor", { mode: "bigint" }).notNull(),
  // Per-line tax breakdown
  taxBreakdown: jsonb("tax_breakdown").notNull(), // { taxTypeId: { rateBps, amountMinor }[] }
  stationId: text("station_id")
    .references(() => fulfillmentStations.id),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("invoice_lines_invoice_idx").on(t.invoiceId),
])
```

### `invoice_charges`
Additional charges on invoice (delivery, service fee, etc.)
```typescript
export const invoiceCharges = pgTable("invoice_charges", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  invoiceId: text("invoice_id").notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  taxTypeId: text("tax_type_id").notNull()
    .references(() => taxTypes.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  description: text("description"),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  taxBreakdown: jsonb("tax_breakdown"), // if charge itself is taxable
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("invoice_charges_invoice_idx").on(t.invoiceId),
])
```

---

## 8. Payments

### `payments`
```typescript
export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  invoiceId: text("invoice_id").notNull()
    .references(() => invoices.id),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  reference: text("reference"),
  recordedBy: text("recorded_by").notNull()
    .references(() => user.id),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  transferredFromInvoiceId: text("transferred_from_invoice_id")
    .references(() => invoices.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("payments_org_invoice_idx").on(t.orgId, t.invoiceId),
])

export const paymentMethodEnum = pgEnum("payment_method",
  ["cash", "bank_transfer", "cheque", "store_credit"])
```

---

## 9. Credit Notes

### `credit_notes`
```typescript
export const creditNotes = pgTable("credit_notes", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  invoiceId: text("invoice_id").notNull()
    .references(() => invoices.id),
  creditNoteNumber: text("credit_note_number").notNull(),  // CN-YYYY-NNNNN
  reason: creditNoteReasonEnum("reason").notNull(),
  subtotalMinor: bigint("subtotal_minor", { mode: "bigint" }).notNull(),
  taxTotalMinor: bigint("tax_total_minor", { mode: "bigint" }).notNull(),
  grandTotalMinor: bigint("grand_total_minor", { mode: "bigint" }).notNull(),
  taxBreakdown: jsonb("tax_breakdown").notNull(),
  refundMethod: paymentMethodEnum("refund_method"),
  createdBy: text("created_by").notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("credit_notes_org_number_uidx").on(t.orgId, t.creditNoteNumber),
  index("credit_notes_org_invoice_idx").on(t.orgId, t.invoiceId),
])

export const creditNoteReasonEnum = pgEnum("credit_note_reason",
  ["customer_return", "warranty_claim", "reissue_remaining", "pricing_error", "other"])
```

### `credit_note_lines`
```typescript
export const creditNoteLines = pgTable("credit_note_lines", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  creditNoteId: text("credit_note_id").notNull()
    .references(() => creditNotes.id, { onDelete: "cascade" }),
  invoiceLineId: text("invoice_line_id").notNull()
    .references(() => invoiceLines.id),
  productId: text("product_id").notNull()
    .references(() => products.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPriceMinor: bigint("unit_price_minor", { mode: "bigint" }).notNull(),
  lineTotalMinor: bigint("line_total_minor", { mode: "bigint" }).notNull(),
  taxBreakdown: jsonb("tax_breakdown").notNull(),
}, (t) => [
  index("credit_note_lines_cn_idx").on(t.creditNoteId),
])
```

### `credit_note_charges`
```typescript
export const creditNoteCharges = pgTable("credit_note_charges", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  creditNoteId: text("credit_note_id").notNull()
    .references(() => creditNotes.id, { onDelete: "cascade" }),
  taxTypeId: text("tax_type_id").notNull()
    .references(() => taxTypes.id),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  description: text("description"),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  taxBreakdown: jsonb("tax_breakdown"),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("credit_note_charges_cn_idx").on(t.creditNoteId),
])
```

---

## 10. Warranty

### `warranty_items` (warranty catalog)
```typescript
export const warrantyItems = pgTable("warranty_items", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  name: text("name").notNull(),  // "1-Year Replacement Warranty"
  warrantyType: warrantyTypeEnum("warranty_type").notNull(),
  defaultDurationMonths: integer("default_duration_months"),
  maxClaims: integer("max_claims"),  // NULL = unlimited
  basePriceMinor: bigint("base_price_minor", { mode: "bigint" }).default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("warranty_items_org_idx").on(t.orgId),
])

export const warrantyTypeEnum = pgEnum("warranty_type",
  ["replacement", "limited_replacement", "service"])
```

### `invoice_warranty_lines`
```typescript
export const invoiceWarrantyLines = pgTable("invoice_warranty_lines", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  invoiceId: text("invoice_id").notNull()
    .references(() => invoices.id),
  invoiceLineId: text("invoice_line_id")
    .references(() => invoiceLines.id),
  warrantyId: text("warranty_id").notNull()
    .references(() => warrantyItems.id),
  termsNotes: text("terms_notes"),
  serialNumber: text("serial_number"),  // optional, searchable
  durationMonths: integer("duration_months").notNull(),
  priceMinor: bigint("price_minor", { mode: "bigint" }).default(0).notNull(),
  vatAmountMinor: bigint("vat_amount_minor", { mode: "bigint" }).default(0).notNull(),
  taxBreakdown: jsonb("tax_breakdown"),
  expiryDate: date("expiry_date").notNull(),  // invoice_date + duration_months
  claimsUsed: integer("claims_used").default(0).notNull(),
  maxClaims: integer("max_claims"),  // NULL = unlimited, copied from warranty_item
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("warranty_lines_org_serial_idx").on(t.orgId, t.serialNumber),
  index("warranty_lines_org_invoice_idx").on(t.orgId, t.invoiceId),
])
```

### `warranty_claims`
```typescript
export const warrantyClaims = pgTable("warranty_claims", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  warrantyLineId: text("warranty_line_id").notNull()
    .references(() => invoiceWarrantyLines.id),
  claimDate: date("claim_date").defaultNow().notNull(),
  claimType: claimTypeEnum("claim_type").notNull(),
  resolution: claimResolutionEnum("resolution"),
  serviceReference: text("service_reference").unique(),  // SVC-YYYY-NNNNN
  serviceStatus: serviceStatusEnum("service_status"),  // NULL unless service claim
  replacementInvoiceId: text("replacement_invoice_id")
    .references(() => invoices.id),
  supplierClaimId: text("supplier_claim_id")
    .references(() => supplierWarrantyClaims.id),
  notes: text("notes"),
  handledBy: text("handled_by").notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("warranty_claims_org_line_idx").on(t.orgId, t.warrantyLineId),
  index("warranty_claims_service_status_idx").on(t.orgId, t.serviceStatus),
])

export const claimTypeEnum = pgEnum("claim_type", ["replacement", "service", "refund"])
export const claimResolutionEnum = pgEnum("claim_resolution",
  ["replaced_same_brand", "replaced_alternative_brand", "refund_issued",
   "sent_for_service", "rejected"])
export const serviceStatusEnum = pgEnum("service_status",
  ["received", "sent_to_supplier", "repaired", "ready_for_collection", "collected"])
```

### `supplier_warranty_claims`
```typescript
export const supplierWarrantyClaims = pgTable("supplier_warranty_claims", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  supplierId: text("supplier_id").notNull()
    .references(() => suppliers.id),
  purchaseReceiptId: text("purchase_receipt_id")
    .references(() => purchaseReceipts.id),
  productId: text("product_id").notNull()
    .references(() => products.id),
  serialNumber: text("serial_number"),
  claimDate: date("claim_date").defaultNow().notNull(),
  status: supplierClaimStatusEnum("status").default("pending").notNull(),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("supplier_warranty_org_supplier_idx").on(t.orgId, t.supplierId),
  index("supplier_warranty_org_status_idx").on(t.orgId, t.status),
])

export const supplierClaimStatusEnum = pgEnum("supplier_claim_status",
  ["pending", "accepted", "rejected", "replaced", "credited"])
```

---

## 11. Customers, Contractors & Sites

### `customers`
Unified customer table covering all buyer types: walk-in retail, account customers, and contractors.
```typescript
export const customers = pgTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  type: customerTypeEnum("type").notNull(), // "retail" | "account" | "contractor"
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  // For account/contractor types
  creditLimitMinor: bigint("credit_limit_minor", { mode: "bigint" }).default(0).notNull(),
  paymentTermsDays: integer("payment_terms_days").default(30).notNull(),
  // Portal access (contractors only)
  portalLogin: boolean("portal_login").default(false).notNull(),
  portalPasswordHash: text("portal_password_hash"),
  // VAT/Tax registration (for B2B invoicing)
  vatNumber: text("vat_number"),
  // Address for delivery/invoicing
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  // Default price list for this customer
  defaultPriceListId: text("default_price_list_id")
    .references(() => priceLists.id),
  // Tax exemption
  taxExempt: boolean("tax_exempt").default(false).notNull(),
  taxExemptCertificate: text("tax_exempt_certificate"),
  // Notes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("customers_org_id_idx").on(t.orgId),
  index("customers_org_type_idx").on(t.orgId, t.type),
  index("customers_org_phone_idx").on(t.orgId, t.phone),
])

export const customerTypeEnum = pgEnum("customer_type", ["retail", "account", "contractor"])
```

### `customer_contacts`
Multiple contact persons per customer (especially for contractors).
```typescript
export const customerContacts = pgTable("customer_contacts", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  customerId: text("customer_id").notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  role: text("role"), // "purchasing", "site_manager", "accounts", "owner"
  isPrimary: boolean("is_primary").default(false).notNull(),
  portalAccess: boolean("portal_access").default(false).notNull(),
  portalPasswordHash: text("portal_password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("customer_contacts_customer_idx").on(t.customerId),
  index("customer_contacts_org_idx").on(t.orgId),
])
```

### `sites` (Projects/Job Sites)
Construction sites/projects linked to contractor-type customers.
```typescript
export const sites = pgTable("sites", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  customerId: text("customer_id").notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Al Mouj Towers - Phase 2"
  description: text("description"),
  address: text("address"),
  contactNumber: text("contact_number"),
  // Project tracking
  startDate: date("start_date"),
  expectedEndDate: date("expected_end_date"),
  status: siteStatusEnum("status").default("active").notNull(),
  linkedBy: text("linked_by").notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("sites_org_customer_idx").on(t.orgId, t.customerId),
  index("sites_org_status_idx").on(t.orgId, t.status),
])

export const siteStatusEnum = pgEnum("site_status", ["active", "on_hold", "completed", "cancelled"])
```

### `site_contacts`
Site-specific contacts (project manager, site engineer, etc.)
```typescript
export const siteContacts = pgTable("site_contacts", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  siteId: text("site_id").notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  role: text("role"), // "project_manager", "site_engineer", "foreman", "procurement"
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("site_contacts_site_idx").on(t.siteId),
])
```

---

## 12. Suppliers & Purchase Receipts

### `suppliers`
```typescript
export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  paymentTermsDays: integer("payment_terms_days").default(30).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("suppliers_org_id_idx").on(t.orgId),
])
```

### `purchase_receipts`
Append-only supplier price history log. Never UPDATE — only INSERT.
```typescript
export const purchaseReceipts = pgTable("purchase_receipts", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  teamId: text("team_id").notNull()
    .references(() => team.id),
  supplierId: text("supplier_id").notNull()
    .references(() => suppliers.id),
  productId: text("product_id").notNull()
    .references(() => products.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitCostMinor: bigint("unit_cost_minor", { mode: "bigint" }).notNull(),
  deliveryDate: date("delivery_date").notNull(),
  recordedBy: text("recorded_by").notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // NO updatedAt — this table is append-only
}, (t) => [
  index("purchase_receipts_org_product_idx").on(t.orgId, t.productId),
  index("purchase_receipts_org_supplier_idx").on(t.orgId, t.supplierId),
  index("purchase_receipts_org_product_date_idx").on(t.orgId, t.productId, t.deliveryDate),
])
```

---

## 13. Tradesperson Loyalty & QR Codes

### `tradespeople`
```typescript
export const tradespeople = pgTable("tradespeople", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  tradeType: tradeTypeEnum("trade_type").notNull(),
  pointsBalance: integer("points_balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("tradespeople_org_phone_uidx").on(t.orgId, t.phone),
  index("tradespeople_org_idx").on(t.orgId),
])

export const tradeTypeEnum = pgEnum("trade_type",
  ["plumber", "electrician", "painter", "carpenter", "mason", "other"])
```

### `loyalty_redemptions`
```typescript
export const loyaltyRedemptions = pgTable("loyalty_redemptions", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  tradespersonId: text("tradesperson_id").notNull()
    .references(() => tradespeople.id),
  pointsRedeemed: integer("points_redeemed").notNull(),
  redemptionType: redemptionTypeEnum("redemption_type").notNull(),
  valueMinor: bigint("value_minor", { mode: "bigint" }).notNull(),
  periodQuarter: text("period_quarter"),  // e.g. "2026-Q1"
  processedBy: text("processed_by").notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("loyalty_redemptions_org_person_idx").on(t.orgId, t.tradespersonId),
])

export const redemptionTypeEnum = pgEnum("redemption_type", ["store_credit", "gift_voucher"])
```

### `qr_codes`
```typescript
export const qrCodes = pgTable("qr_codes", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  productId: text("product_id").notNull()
    .references(() => products.id),
  unitSerial: text("unit_serial").notNull().unique(),  // the actual QR code value
  status: qrStatusEnum("status").default("registered").notNull(),
  batchRangeStart: text("batch_range_start"),
  batchRangeEnd: text("batch_range_end"),
  purchaseReceiptId: text("purchase_receipt_id")
    .references(() => purchaseReceipts.id),
  tradespersonId: text("tradesperson_id")
    .references(() => tradespeople.id),
  scannedBy: text("scanned_by")
    .references(() => user.id),
  scannedAt: timestamp("scanned_at"),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("qr_codes_unit_serial_uidx").on(t.unitSerial),
  index("qr_codes_org_status_idx").on(t.orgId, t.status),
])

export const qrStatusEnum = pgEnum("qr_status", ["registered", "redeemed"])
```

---

## 14. Invoice Sequence Counters

### `invoice_counters`
Atomic sequence generation for invoice numbers per org per year.
```typescript
export const invoiceCounters = pgTable("invoice_counters", {
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  prefix: text("prefix").notNull(),  // "INV", "CN", "SVC"
  year: integer("year").notNull(),
  seq: integer("seq").default(0).notNull(),
}, (t) => [
  primaryKey({ columns: [t.orgId, t.prefix, t.year] }),
])
```

---

## 15. Key Business Rules (Enforced at Application Layer)

### Invoice Immutability
```typescript
// In InvoiceService — guard before any mutation:
if (invoice.status !== 'active') {
  throw new ForbiddenException(ERROR_CODES.INVOICE_IMMUTABLE)
}
```

### Purchase Receipt Append-Only
```typescript
// No UPDATE route exposed for purchase_receipts
// Service layer only exposes create() — no update()
```

### QR Code One-Way Status
```typescript
// Once redeemed, status never reverts — enforced in service layer
if (qr.status === 'redeemed') {
  return { valid: false, reason: 'already_redeemed', ... }
}
```

### Cost Price Suggestion Query
```typescript
// Returns highest unit_cost from last 5 deliveries per product per org
const recentDeliveries = await db.query.purchaseReceipts.findMany({
  where: { orgId, productId },
  orderBy: [desc(purchaseReceipts.deliveryDate)],
  limit: 5,
})
const suggestedCost = Math.max(...recentDeliveries.map(r => Number(r.unitCostMinor)))
```

### Tax Calculation (Generic, Multi-Country)
```typescript
// Get active tax types for org's country
const taxTypes = await getActiveTaxTypesForOrg(orgId)

// For each line, calculate each applicable tax
function calculateLineTaxes(lineTotalMinor: bigint, taxTypes: TaxType[], orgTaxConfig: OrgTaxConfig[]) {
  return taxTypes.map(taxType => {
    const config = orgTaxConfig.find(c => c.taxTypeId === taxType.id)
    const rateBps = config?.overrideRateBasisPoints ?? taxType.rateBasisPoints
    const amountMinor = (lineTotalMinor * BigInt(rateBps)) / 10000n
    return { taxTypeId: taxType.id, rateBps, amountMinor }
  })
}

// Grand total = sum of line totals + sum of all tax amounts
// NEVER calculate tax on subtotal — always sum per-line per-tax amounts
```

### Invoice Number Format
```typescript
// INV-2026-00001, CN-2026-00001, SVC-2026-00001
// Increment invoice_counters.seq atomically within a transaction
```

### Currency Conversion Helpers
```typescript
// UI → DB (major → minor)
function toMinorUnits(major: string | number, decimalPlaces: number): bigint {
  const d = new Decimal(major)
  return d.mul(new Decimal(10).pow(decimalPlaces)).toBigInt()
}

// DB → UI (minor → major)
function fromMinorUnits(minor: bigint, decimalPlaces: number): string {
  const d = new Decimal(minor.toString())
  return d.div(new Decimal(10).pow(decimalPlaces)).toFixed(decimalPlaces)
}

// Format for display with symbol
function formatCurrency(minor: bigint, currency: Currency): string {
  const major = fromMinorUnits(minor, currency.decimalPlaces)
  return `${currency.symbol} ${major}`
}
```

---

## 16. Schema File Organization (packages/db)

```
packages/db/src/
├── index.ts                        # re-exports everything
├── client.ts                       # createDatabaseClient()
├── auth-schema.ts                  # Better Auth tables (DO NOT MODIFY)
├── schemas/
│   ├── localization.ts             # countries, currencies, tax_types, org_tax_config
│   ├── catalog.ts                  # product_groups, products, product_location_overrides, catalog_requests
│   ├── images.ts                   # product_images (imageUrl + pgvector embedding)
│   ├── price-lists.ts              # price_lists, price_list_overrides
│   ├── tags.ts                     # product_tags, product_tag_assignments
│   ├── stock.ts                    # stock
│   ├── stations.ts                 # fulfillment_stations, fulfillment_station_lines
│   ├── quotations.ts               # quotations, quotation_lines, quotation_charges
│   ├── invoices.ts                 # invoices, invoice_lines, invoice_charges, invoice_counters
│   ├── payments.ts                 # payments
│   ├── credit-notes.ts             # credit_notes, credit_note_lines, credit_note_charges
│   ├── warranty.ts                 # warranty_items, invoice_warranty_lines, warranty_claims, supplier_warranty_claims
│   ├── customers.ts                # customers, customer_contacts, sites, site_contacts
│   ├── suppliers.ts                # suppliers, purchase_receipts
│   ├── loyalty.ts                  # tradespeople, loyalty_redemptions, qr_codes
│   └── metadata.ts                 # org_metadata, team_metadata, user_metadata
└── schema-relations/
    └── db-relations.ts             # all table relations (single file)
```

---

## 18. Image Storage Strategy

Product images are stored in a single `product_images` table in **both deployment modes**.
The binary file location is decided **at deploy time** (via storage config), never per-row.

| Mode | Where the file lives | `image_url` value |
|---|---|---|
| **Local install** (client-hosted machine) | Public folder on the machine, served as static files (e.g. `/uploads/products/...`) | `http(s)://<host>/uploads/products/<file>` |
| **Cloud SaaS** | Object store / CDN (S3-compatible, R2, Cloudinary, etc.) | `https://<cdn-host>/products/<file>` |

Design decisions:
- `image_url` is always the **final, absolute, publicly resolvable URL**.
- `storage_key` stores the provider-specific key (object-store key or relative path) so the
  backend can locate and delete the file. Nullable — safe to leave unset when not needed.
- Upload flow: client uploads bytes → API stores to the active backend → backend returns the
  public URL → URL is persisted in `product_images.image_url`.
- The storage backend is a **runtime config** (env/org setting). No schema difference between modes.

### 18.1 Camera-Based Visual Search (Vector Matching)

> **Deferred implementation.** DB schema is ready; embedding model + phone-side vectorization
> are selected in a future release.

- Staff point the phone camera at a product image. The phone **vectorizes on-device**
  (no image bytes leave the device) and sends only the embedding vector to the API.
- API matches the incoming vector against `product_images.image_vector` using cosine distance
  (`<->` operator / HNSW index), scoped to the org, returning the top-N matching SKUs.
- No raw images are stored from a search — the vector alone is compared.
- Relevant relations: `products.images`, `productImages.product`, `productImages.organization`.

---

## 17. Seed Data (Run on Migration)

```sql
-- Countries
INSERT INTO countries (id, name, iso_code, currency_id, default_vat_rate, is_active) VALUES
  ('OM', 'Oman', 'OM', 'OMR', 500, true),
  ('AE', 'United Arab Emirates', 'AE', 'AED', 500, true),
  ('SA', 'Saudi Arabia', 'SA', 'SAR', 1500, true),  -- 15% VAT
  ('QA', 'Qatar', 'QA', 'QAR', 0, true),            -- No VAT yet
  ('BH', 'Bahrain', 'BH', 'BHD', 1000, true),       -- 10% VAT
  ('KW', 'Kuwait', 'KW', 'KWD', 0, true);           -- No VAT yet

-- Currencies
INSERT INTO currencies (id, code, name, symbol, decimal_places, minor_unit_per_major, is_active) VALUES
  ('OMR', 'OMR', 'Omani Rial', 'ر.ع.', 3, 1000, true),
  ('AED', 'AED', 'UAE Dirham', 'د.إ', 2, 100, true),
  ('SAR', 'SAR', 'Saudi Riyal', 'ر.س', 2, 100, true),
  ('QAR', 'QAR', 'Qatari Riyal', 'ر.ق', 2, 100, true),
  ('BHD', 'BHD', 'Bahraini Dinar', 'د.ب', 3, 1000, true),
  ('KWD', 'KWD', 'Kuwaiti Dinar', 'د.ك', 3, 1000, true);

-- Tax Types (per country)
-- Oman: VAT 5%
INSERT INTO tax_types (id, country_id, code, name, rate_basis_points, is_percentage, applies_to, is_mandatory, display_order, is_active)
VALUES (gen_random_uuid(), 'OM', 'VAT', 'Value Added Tax', 500, true, 'line', true, 1, true);

-- UAE: VAT 5%
INSERT INTO tax_types (id, country_id, code, name, rate_basis_points, is_percentage, applies_to, is_mandatory, display_order, is_active)
VALUES (gen_random_uuid(), 'AE', 'VAT', 'Value Added Tax', 500, true, 'line', true, 1, true);

-- Saudi: VAT 15%
INSERT INTO tax_types (id, country_id, code, name, rate_basis_points, is_percentage, applies_to, is_mandatory, display_order, is_active)
VALUES (gen_random_uuid(), 'SA', 'VAT', 'Value Added Tax', 1500, true, 'line', true, 1, true);

-- Optional: Service Charge (configurable per org)
INSERT INTO tax_types (id, country_id, code, name, rate_basis_points, is_percentage, applies_to, is_mandatory, display_order, is_active)
VALUES (gen_random_uuid(), 'OM', 'SERVICE_CHARGE', 'Service Charge', 1000, true, 'invoice', false, 2, true);

-- Optional: Delivery Fee (fixed amount, configurable per org)
INSERT INTO tax_types (id, country_id, code, name, rate_basis_points, is_percentage, applies_to, is_mandatory, display_order, is_active)
VALUES (gen_random_uuid(), 'OM', 'DELIVERY_FEE', 'Delivery Fee', 0, false, 'invoice', false, 3, true);
```
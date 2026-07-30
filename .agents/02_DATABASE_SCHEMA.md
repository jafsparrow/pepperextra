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
- **Monetary values:** `numeric(12,3)` — Omani Rial uses 3 decimal places
- **Quantities:** `numeric(12,3)` — supports fractional units (e.g. 2.5 meters)
- **Percentages:** `numeric(5,2)` — e.g. 5.00 for VAT

---

## Better Auth Extension Tables

These tables extend Better Auth entities with BuildMate-specific fields.

### `org_metadata`
Extends Better Auth `organization`. One row per org.

```typescript
export const orgMetadata = pgTable("org_metadata", {
  orgId: text("org_id").primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
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

// Note: role is stored on Better Auth `member.role`
// Note: customAccountType (owner|staff) and passwordResetRequired are on Better Auth `user`
```

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
  brandTag: text("brand_tag"),  // e.g. "brand_a", "brand_b"
  basePrice: numeric("base_price", { precision: 12, scale: 3 }).default("0").notNull(),
  activeCostPrice: numeric("active_cost_price", { precision: 12, scale: 3 }).default("0").notNull(),
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
])
// Note: GIN index on aliases added via raw migration for full-text search
```

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
  priceOverride: numeric("price_override", { precision: 12, scale: 3 }),
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
  price: numeric("price", { precision: 12, scale: 3 }).notNull(),
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
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  priceListId: text("price_list_id")
    .references(() => priceLists.id),
  status: quotationStatusEnum("status").default("draft").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  createdBy: text("created_by").notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("quotations_org_team_idx").on(t.orgId, t.teamId),
  index("quotations_org_status_idx").on(t.orgId, t.status),
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
  unitPrice: numeric("unit_price", { precision: 12, scale: 3 }).notNull(),
  costPriceAtQuote: numeric("cost_price_at_quote", { precision: 12, scale: 3 }).notNull(),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 3 }).default("0").notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 3 }).notNull(),
  stationId: text("station_id")
    .references(() => fulfillmentStations.id),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("quotation_lines_quotation_idx").on(t.quotationId),
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
  contractorId: text("contractor_id")
    .references(() => contractors.id),
  siteId: text("site_id")
    .references(() => sites.id),
  invoiceNumber: text("invoice_number").notNull(),  // INV-YYYY-NNNNN
  subtotal: numeric("subtotal", { precision: 12, scale: 3 }).notNull(),
  vatTotal: numeric("vat_total", { precision: 12, scale: 3 }).notNull(),
  grandTotal: numeric("grand_total", { precision: 12, scale: 3 }).notNull(),
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
  index("invoices_org_contractor_idx").on(t.orgId, t.contractorId),
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
  unitPrice: numeric("unit_price", { precision: 12, scale: 3 }).notNull(),
  costPrice: numeric("cost_price", { precision: 12, scale: 3 }).notNull(),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).default("5.00").notNull(),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 3 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 3 }).notNull(),
  stationId: text("station_id")
    .references(() => fulfillmentStations.id),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("invoice_lines_invoice_idx").on(t.invoiceId),
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
  amount: numeric("amount", { precision: 12, scale: 3 }).notNull(),
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
  subtotal: numeric("subtotal", { precision: 12, scale: 3 }).notNull(),
  vatTotal: numeric("vat_total", { precision: 12, scale: 3 }).notNull(),
  grandTotal: numeric("grand_total", { precision: 12, scale: 3 }).notNull(),
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
  unitPrice: numeric("unit_price", { precision: 12, scale: 3 }).notNull(),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 3 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 3 }).notNull(),
}, (t) => [
  index("credit_note_lines_cn_idx").on(t.creditNoteId),
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
  basePrice: numeric("base_price", { precision: 12, scale: 3 }).default("0").notNull(),
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
  price: numeric("price", { precision: 12, scale: 3 }).default("0").notNull(),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 3 }).default("0").notNull(),
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

## 11. Contractors & Sites

### `contractors`

```typescript
export const contractors = pgTable("contractors", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  portalLogin: boolean("portal_login").default(false).notNull(),
  portalPasswordHash: text("portal_password_hash"),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 3 }).default("0").notNull(),
  paymentTermsDays: integer("payment_terms_days").default(30).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("contractors_org_id_idx").on(t.orgId),
])
```

### `sites`

```typescript
export const sites = pgTable("sites", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  orgId: text("org_id").notNull()
    .references(() => organization.id),
  contractorId: text("contractor_id").notNull()
    .references(() => contractors.id),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
  linkedBy: text("linked_by").notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("sites_org_contractor_idx").on(t.orgId, t.contractorId),
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
  unitCost: numeric("unit_cost", { precision: 12, scale: 3 }).notNull(),
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
  value: numeric("value", { precision: 12, scale: 3 }).notNull(),
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
const suggestedCost = Math.max(...recentDeliveries.map(r => Number(r.unitCost)))
```

### VAT Calculation
```typescript
const VAT_RATE = new Decimal("0.05")
const lineVat = new Decimal(lineTotal).mul(VAT_RATE).toDecimalPlaces(3)
// Grand total = sum of lines + sum of VATs — never recalculate from subtotal
```

### Invoice Number Format
```typescript
// INV-2026-00001, CN-2026-00001, SVC-2026-00001
// Increment invoice_counters.seq atomically within a transaction
```

---

## 16. Schema File Organization (packages/db)

```
packages/db/src/
├── index.ts                        # re-exports everything
├── client.ts                       # createDatabaseClient()
├── auth-schema.ts                  # Better Auth tables (DO NOT MODIFY)
├── schema/
│   ├── catalog.ts                  # product_groups, products, product_location_overrides, catalog_requests
│   ├── price-lists.ts              # price_lists, price_list_overrides
│   ├── tags.ts                     # product_tags, product_tag_assignments
│   ├── stock.ts                    # stock
│   ├── stations.ts                 # fulfillment_stations, fulfillment_station_lines
│   ├── quotations.ts               # quotations, quotation_lines
│   ├── invoices.ts                 # invoices, invoice_lines, invoice_counters
│   ├── payments.ts                 # payments
│   ├── credit-notes.ts             # credit_notes, credit_note_lines
│   ├── warranty.ts                 # warranty_items, invoice_warranty_lines, warranty_claims, supplier_warranty_claims
│   ├── contractors.ts              # contractors, sites
│   ├── suppliers.ts                # suppliers, purchase_receipts
│   ├── loyalty.ts                  # tradespeople, loyalty_redemptions, qr_codes
│   └── metadata.ts                 # org_metadata, team_metadata, user_metadata
└── schema-relations/
    ├── auth-relation.ts            # Better Auth relations (DO NOT MODIFY)
    └── buildmate-relations.ts      # BuildMate table relations
```

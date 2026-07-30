import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, user } from "../auth-schema";
import { products } from "./catalog";
import { invoices, invoiceLines } from "./invoices";
import { suppliers, purchaseReceipts } from "./suppliers";
import {
  warrantyTypeEnum,
  claimTypeEnum,
  claimResolutionEnum,
  serviceStatusEnum,
  supplierClaimStatusEnum,
} from "./enums";

export const warrantyItems = pgTable(
  "warranty_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    name: text("name").notNull(),
    warrantyType: warrantyTypeEnum("warranty_type").notNull(),
    defaultDurationMonths: integer("default_duration_months"),
    maxClaims: integer("max_claims"),
    basePriceMinor: bigint("base_price_minor", { mode: "bigint" })
      .default(0n)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [index("warranty_items_org_idx").on(t.orgId)]
);

export const invoiceWarrantyLines = pgTable(
  "invoice_warranty_lines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id),
    invoiceLineId: text("invoice_line_id").references(
      () => invoiceLines.id
    ),
    warrantyId: text("warranty_id")
      .notNull()
      .references(() => warrantyItems.id),
    termsNotes: text("terms_notes"),
    serialNumber: text("serial_number"),
    durationMonths: integer("duration_months").notNull(),
    priceMinor: bigint("price_minor", { mode: "bigint" })
      .default(0n)
      .notNull(),
    vatAmountMinor: bigint("vat_amount_minor", { mode: "bigint" })
      .default(0n)
      .notNull(),
    taxBreakdown: jsonb("tax_breakdown"),
    expiryDate: date("expiry_date").notNull(),
    claimsUsed: integer("claims_used").default(0).notNull(),
    maxClaims: integer("max_claims"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("warranty_lines_org_serial_idx").on(t.orgId, t.serialNumber),
    index("warranty_lines_org_invoice_idx").on(t.orgId, t.invoiceId),
  ]
);

export const warrantyClaims = pgTable(
  "warranty_claims",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    warrantyLineId: text("warranty_line_id")
      .notNull()
      .references(() => invoiceWarrantyLines.id),
    claimDate: date("claim_date").defaultNow().notNull(),
    claimType: claimTypeEnum("claim_type").notNull(),
    resolution: claimResolutionEnum("resolution"),
    serviceReference: text("service_reference").unique(),
    serviceStatus: serviceStatusEnum("service_status"),
    replacementInvoiceId: text("replacement_invoice_id"),
    supplierClaimId: text("supplier_claim_id"),
    notes: text("notes"),
    handledBy: text("handled_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("warranty_claims_org_line_idx").on(t.orgId, t.warrantyLineId),
    index("warranty_claims_service_status_idx").on(
      t.orgId,
      t.serviceStatus
    ),
  ]
);

export const supplierWarrantyClaims = pgTable(
  "supplier_warranty_claims",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    purchaseReceiptId: text("purchase_receipt_id"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    serialNumber: text("serial_number"),
    claimDate: date("claim_date").defaultNow().notNull(),
    status: supplierClaimStatusEnum("status").default("pending").notNull(),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("supplier_warranty_org_supplier_idx").on(t.orgId, t.supplierId),
    index("supplier_warranty_org_status_idx").on(t.orgId, t.status),
  ]
);
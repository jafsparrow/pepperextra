import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  numeric,
  date,
  index,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, team, user } from "../auth-schema";
import { products } from "./catalog";
import { taxTypes } from "./localization";
import { invoiceStatusEnum, paymentMethodEnum } from "./enums";

export const suppliers = pgTable(
  "suppliers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    paymentTermsDays: integer("payment_terms_days").default(30).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [index("suppliers_org_id_idx").on(t.orgId)]
);

export const purchaseInvoices = pgTable(
  "purchase_invoices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    invoiceNumber: text("invoice_number").notNull(),
    subtotalMinor: bigint("subtotal_minor", { mode: "bigint" }).notNull(),
    taxTotalMinor: bigint("tax_total_minor", { mode: "bigint" }).notNull(),
    grandTotalMinor: bigint("grand_total_minor", { mode: "bigint" }).notNull(),
    paidMinor: bigint("paid_minor", { mode: "bigint" }).default(0n).notNull(),
    creditedMinor: bigint("credited_minor", { mode: "bigint" }).default(0n).notNull(),
    taxBreakdown: jsonb("tax_breakdown").notNull(),
    status: invoiceStatusEnum("status").default("active").notNull(),
    dueDate: date("due_date"),
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
    receivedAt: timestamp("received_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("purchase_invoices_org_number_uidx").on(
      t.orgId,
      t.invoiceNumber
    ),
    index("purchase_invoices_org_supplier_idx").on(t.orgId, t.supplierId),
    index("purchase_invoices_org_status_idx").on(t.orgId, t.status),
    index("purchase_invoices_org_due_date_idx").on(t.orgId, t.dueDate),
    index("purchase_invoices_org_issued_at_idx").on(t.orgId, t.issuedAt),
  ]
);

export const purchaseInvoiceLines = pgTable(
  "purchase_invoice_lines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    purchaseInvoiceId: text("purchase_invoice_id")
      .notNull()
      .references(() => purchaseInvoices.id, { onDelete: "restrict" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    description: text("description"),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    unitCostMinor: bigint("unit_cost_minor", { mode: "bigint" }).notNull(),
    lineTotalMinor: bigint("line_total_minor", { mode: "bigint" }).notNull(),
    taxBreakdown: jsonb("tax_breakdown").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("purchase_invoice_lines_invoice_idx").on(t.purchaseInvoiceId)]
);

export const purchaseInvoiceCharges = pgTable(
  "purchase_invoice_charges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    purchaseInvoiceId: text("purchase_invoice_id")
      .notNull()
      .references(() => purchaseInvoices.id, { onDelete: "cascade" }),
    taxTypeId: text("tax_type_id")
      .notNull()
      .references(() => taxTypes.id),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    description: text("description"),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    taxBreakdown: jsonb("tax_breakdown"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("purchase_invoice_charges_invoice_idx").on(t.purchaseInvoiceId)]
);

export const supplierPayments = pgTable(
  "supplier_payments",
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
    purchaseInvoiceId: text("purchase_invoice_id")
      .notNull()
      .references(() => purchaseInvoices.id),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    reference: text("reference"),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => user.id),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("supplier_payments_org_supplier_idx").on(t.orgId, t.supplierId),
    index("supplier_payments_org_invoice_idx").on(t.orgId, t.purchaseInvoiceId),
    index("supplier_payments_org_paid_at_idx").on(t.orgId, t.paidAt),
  ]
);

export const purchaseReceipts = pgTable(
  "purchase_receipts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    unitCostMinor: bigint("unit_cost_minor", { mode: "bigint" }).notNull(),
    deliveryDate: date("delivery_date").notNull(),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("purchase_receipts_org_product_idx").on(t.orgId, t.productId),
    index("purchase_receipts_org_supplier_idx").on(t.orgId, t.supplierId),
    index("purchase_receipts_org_product_date_idx").on(
      t.orgId,
      t.productId,
      t.deliveryDate
    ),
  ]
);
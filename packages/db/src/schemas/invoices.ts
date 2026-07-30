import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  numeric,
  jsonb,
  date,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, team, user } from "../auth-schema";
import { products } from "./catalog";
import { taxTypes } from "./localization";
import { invoiceStatusEnum } from "./enums";

export const invoices = pgTable(
  "invoices",
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
    quotationId: text("quotation_id"),
    customerId: text("customer_id"),
    siteId: text("site_id"),
    invoiceNumber: text("invoice_number").notNull(),
    subtotalMinor: bigint("subtotal_minor", { mode: "bigint" }).notNull(),
    taxTotalMinor: bigint("tax_total_minor", { mode: "bigint" }).notNull(),
    grandTotalMinor: bigint("grand_total_minor", { mode: "bigint" }).notNull(),
    taxBreakdown: jsonb("tax_breakdown").notNull(),
    status: invoiceStatusEnum("status").default("active").notNull(),
    dueDate: date("due_date"),
    issuedBy: text("issued_by")
      .notNull()
      .references(() => user.id),
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("invoices_org_number_uidx").on(t.orgId, t.invoiceNumber),
    index("invoices_org_status_idx").on(t.orgId, t.status),
    index("invoices_org_customer_idx").on(t.orgId, t.customerId),
    index("invoices_org_issued_at_idx").on(t.orgId, t.issuedAt),
  ]
);

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    description: text("description"),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    unitPriceMinor: bigint("unit_price_minor", { mode: "bigint" }).notNull(),
    costPriceMinor: bigint("cost_price_minor", { mode: "bigint" }).notNull(),
    lineTotalMinor: bigint("line_total_minor", { mode: "bigint" }).notNull(),
    taxBreakdown: jsonb("tax_breakdown").notNull(),
    stationId: text("station_id"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("invoice_lines_invoice_idx").on(t.invoiceId)]
);

export const invoiceCharges = pgTable(
  "invoice_charges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
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
  (t) => [index("invoice_charges_invoice_idx").on(t.invoiceId)]
);

export const invoiceCounters = pgTable(
  "invoice_counters",
  {
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    prefix: text("prefix").notNull(),
    year: integer("year").notNull(),
    seq: integer("seq").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.prefix, t.year] })]
);
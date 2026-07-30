import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, user } from "../auth-schema";
import { invoices, invoiceLines } from "./invoices";
import { products } from "./catalog";
import { taxTypes } from "./localization";
import { creditNoteReasonEnum, paymentMethodEnum } from "./enums";

export const creditNotes = pgTable(
  "credit_notes",
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
    creditNoteNumber: text("credit_note_number").notNull(),
    reason: creditNoteReasonEnum("reason").notNull(),
    subtotalMinor: bigint("subtotal_minor", { mode: "bigint" }).notNull(),
    taxTotalMinor: bigint("tax_total_minor", { mode: "bigint" }).notNull(),
    grandTotalMinor: bigint("grand_total_minor", { mode: "bigint" }).notNull(),
    taxBreakdown: jsonb("tax_breakdown").notNull(),
    refundMethod: paymentMethodEnum("refund_method"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("credit_notes_org_number_uidx").on(t.orgId, t.creditNoteNumber),
    index("credit_notes_org_invoice_idx").on(t.orgId, t.invoiceId),
  ]
);

export const creditNoteLines = pgTable(
  "credit_note_lines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    creditNoteId: text("credit_note_id")
      .notNull()
      .references(() => creditNotes.id, { onDelete: "cascade" }),
    invoiceLineId: text("invoice_line_id")
      .notNull()
      .references(() => invoiceLines.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    unitPriceMinor: bigint("unit_price_minor", { mode: "bigint" }).notNull(),
    lineTotalMinor: bigint("line_total_minor", { mode: "bigint" }).notNull(),
    taxBreakdown: jsonb("tax_breakdown").notNull(),
  },
  (t) => [index("credit_note_lines_cn_idx").on(t.creditNoteId)]
);

export const creditNoteCharges = pgTable(
  "credit_note_charges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    creditNoteId: text("credit_note_id")
      .notNull()
      .references(() => creditNotes.id, { onDelete: "cascade" }),
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
  (t) => [index("credit_note_charges_cn_idx").on(t.creditNoteId)]
);
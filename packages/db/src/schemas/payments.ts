import {
  pgTable,
  text,
  timestamp,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, user } from "../auth-schema";
import { invoices } from "./invoices";
import { paymentMethodEnum } from "./enums";

export const payments = pgTable(
  "payments",
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
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    reference: text("reference"),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => user.id),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
    transferredFromInvoiceId: text("transferred_from_invoice_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("payments_org_invoice_idx").on(t.orgId, t.invoiceId)]
);
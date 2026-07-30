import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  numeric,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, team, user } from "../auth-schema";
import { products } from "./catalog";
import { taxTypes } from "./localization";
import { quotationStatusEnum } from "./enums";

export const quotations = pgTable(
  "quotations",
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
    customerId: text("customer_id"),
    siteId: text("site_id"),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    priceListId: text("price_list_id"),
    status: quotationStatusEnum("status").default("draft").notNull(),
    confirmedAt: timestamp("confirmed_at"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    taxSnapshot: jsonb("tax_snapshot"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("quotations_org_team_idx").on(t.orgId, t.teamId),
    index("quotations_org_status_idx").on(t.orgId, t.status),
    index("quotations_org_customer_idx").on(t.orgId, t.customerId),
    index("quotations_org_site_idx").on(t.orgId, t.siteId),
  ]
);

export const quotationLines = pgTable(
  "quotation_lines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    quotationId: text("quotation_id")
      .notNull()
      .references(() => quotations.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    unitPriceMinor: bigint("unit_price_minor", { mode: "bigint" }).notNull(),
    costPriceAtQuoteMinor: bigint("cost_price_at_quote_minor", {
      mode: "bigint",
    }).notNull(),
    lineTotalMinor: bigint("line_total_minor", { mode: "bigint" }).notNull(),
    taxBreakdown: jsonb("tax_breakdown"),
    stationId: text("station_id"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("quotation_lines_quotation_idx").on(t.quotationId)]
);

export const quotationCharges = pgTable(
  "quotation_charges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    quotationId: text("quotation_id")
      .notNull()
      .references(() => quotations.id, { onDelete: "cascade" }),
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
  (t) => [index("quotation_charges_quotation_idx").on(t.quotationId)]
);
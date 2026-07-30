import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, team, user } from "../auth-schema";
import { products } from "./catalog";

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
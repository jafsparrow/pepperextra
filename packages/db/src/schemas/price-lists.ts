import {
  pgTable,
  text,
  timestamp,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization } from "../auth-schema";
import { products } from "./catalog";

export const priceLists = pgTable(
  "price_lists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    uniqueIndex("price_lists_org_name_uidx").on(t.orgId, t.name),
    index("price_lists_org_id_idx").on(t.orgId),
  ]
);

export const priceListOverrides = pgTable(
  "price_list_overrides",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    priceListId: text("price_list_id")
      .notNull()
      .references(() => priceLists.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    priceMinor: bigint("price_minor", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    uniqueIndex("price_list_overrides_uidx").on(t.priceListId, t.productId),
    index("price_list_overrides_list_idx").on(t.priceListId),
  ]
);
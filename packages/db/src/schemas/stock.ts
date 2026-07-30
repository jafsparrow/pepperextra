import {
  pgTable,
  text,
  timestamp,
  numeric,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { organization, team } from "../auth-schema";
import { products } from "./catalog";

export const stock = pgTable(
  "stock",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    quantity: numeric("quantity", { precision: 12, scale: 3 })
      .default("0")
      .notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.teamId] }),
    index("stock_org_team_idx").on(t.orgId, t.teamId),
  ]
);
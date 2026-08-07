import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, team } from "../auth-schema";
import { products } from "./catalog";

export const productTags = pgTable(
  "product_tags",
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
    name: text("name").notNull(),
    colour: text("colour"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    uniqueIndex("product_tags_team_name_uidx").on(t.teamId, t.name),
    index("product_tags_org_team_idx").on(t.orgId, t.teamId),
  ]
);

export const productTagAssignments = pgTable(
  "product_tag_assignments",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => productTags.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [primaryKey({ columns: [t.tagId, t.productId] })]
);
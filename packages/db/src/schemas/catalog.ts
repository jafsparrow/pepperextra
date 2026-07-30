import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, team, user } from "../auth-schema";
import { stockModeEnum, catalogRequestStatusEnum } from "./enums";

export const productGroups = pgTable(
  "product_groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    specName: text("spec_name").notNull(),
    brandPriority: text("brand_priority").array(),
    stockTrackingMode: stockModeEnum("stock_tracking_mode")
      .default("sku")
      .notNull(),
    groupReorderThreshold: integer("group_reorder_threshold"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("product_groups_org_id_idx").on(t.orgId),
    uniqueIndex("product_groups_org_spec_uidx").on(t.orgId, t.specName),
  ]
);

export const products = pgTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    productGroupId: text("product_group_id").references(
      () => productGroups.id
    ),
    name: text("name").notNull(),
    skuCode: text("sku_code"),
    specCode: text("spec_code"),
    brandTag: text("brand_tag"),
    basePriceMinor: bigint("base_price_minor", { mode: "bigint" })
      .default(0n)
      .notNull(),
    activeCostPriceMinor: bigint("active_cost_price_minor", { mode: "bigint" })
      .default(0n)
      .notNull(),
    costLastUpdated: timestamp("cost_last_updated"),
    unit: text("unit"),
    stationOverrideId: text("station_override_id"),
    defaultWarrantyId: text("default_warranty_id"),
    eligibleForLoyalty: boolean("eligible_for_loyalty")
      .default(false)
      .notNull(),
    reorderThreshold: integer("reorder_threshold"),
    aliases: text("aliases").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("products_org_id_idx").on(t.orgId),
    index("products_org_group_idx").on(t.orgId, t.productGroupId),
    index("products_org_brand_idx").on(t.orgId, t.brandTag),
    index("products_org_spec_code_idx").on(t.orgId, t.specCode),
  ]
);

export const productLocationOverrides = pgTable(
  "product_location_overrides",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    priceOverrideMinor: bigint("price_override_minor", { mode: "bigint" }),
  },
  (t) => [
    uniqueIndex("product_loc_override_uidx").on(t.productId, t.teamId),
    index("product_loc_override_org_team_idx").on(t.orgId, t.teamId),
  ]
);

export const catalogRequests = pgTable(
  "catalog_requests",
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
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => user.id),
    description: text("description").notNull(),
    photoUrl: text("photo_url"),
    status: catalogRequestStatusEnum("status").default("pending").notNull(),
    mappedToSku: text("mapped_to_sku").references(() => products.id),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("catalog_requests_org_status_idx").on(t.orgId, t.status)]
);
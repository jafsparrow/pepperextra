import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, team, user } from "../auth-schema";
import { countries, currencies } from "./localization";

export const orgMetadata = pgTable(
  "org_metadata",
  {
    orgId: text("org_id")
      .primaryKey()
      .references(() => organization.id, { onDelete: "cascade" }),
    countryId: text("country_id")
      .notNull()
      .references(() => countries.id)
      .default("OM"),
    currencyId: text("currency_id")
      .notNull()
      .references(() => currencies.id)
      .default("OMR"),
    vatNumber: text("vat_number"),
    tagline: text("tagline"),
    address: text("address"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    website: text("website"),
    timezone: text("timezone"),
    dateFormat: text("date_format"),
    subscriptionTier: text("subscription_tier").default("trial").notNull(),
    singleTenantMode: boolean("single_tenant_mode").default(false).notNull(),
    priceVisibility: boolean("price_visibility").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [index("org_metadata_country_idx").on(t.countryId)]
);

export const teamMetadata = pgTable(
  "team_metadata",
  {
    teamId: text("team_id")
      .primaryKey()
      .references(() => team.id, { onDelete: "cascade" }),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    address: text("address"),
    marginFloor: numeric("margin_floor", { precision: 5, scale: 2 })
      .default("2.00")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [index("team_metadata_org_id_idx").on(t.orgId)]
);

export const userMetadata = pgTable(
  "user_metadata",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    teamId: text("team_id").references(() => team.id),
    pinnedSkuIds: text("pinned_sku_ids").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("user_metadata_org_id_idx").on(t.orgId),
    index("user_metadata_org_team_idx").on(t.orgId, t.teamId),
  ]
);
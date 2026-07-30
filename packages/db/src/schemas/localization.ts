import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { taxAppliesToEnum } from "./enums";
import { organization } from "../auth-schema";

export const countries = pgTable(
  "countries",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    isoCode: text("iso_code").notNull(),
    currencyId: text("currency_id")
      .notNull()
      .references(() => currencies.id),
    defaultVatRate: integer("default_vat_rate").default(500).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("countries_iso_code_uidx").on(t.isoCode)]
);

export const currencies = pgTable(
  "currencies",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    decimalPlaces: integer("decimal_places").notNull(),
    minorUnitPerMajor: integer("minor_unit_per_major").notNull(),
    iconUrl: text("icon_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("currencies_code_uidx").on(t.code)]
);

export const taxTypes = pgTable(
  "tax_types",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    countryId: text("country_id")
      .notNull()
      .references(() => countries.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    rateBasisPoints: integer("rate_basis_points").default(0).notNull(),
    isPercentage: boolean("is_percentage").default(true).notNull(),
    fixedAmountMinor: integer("fixed_amount_minor"),
    appliesTo: taxAppliesToEnum("applies_to").default("line").notNull(),
    isMandatory: boolean("is_mandatory").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("tax_types_country_code_uidx").on(t.countryId, t.code),
    index("tax_types_country_active_idx").on(t.countryId, t.isActive),
  ]
);

export const orgTaxConfig = pgTable(
  "org_tax_config",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    taxTypeId: text("tax_type_id")
      .notNull()
      .references(() => taxTypes.id),
    overrideRateBasisPoints: integer("override_rate_basis_points"),
    overrideFixedAmountMinor: integer("override_fixed_amount_minor"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("org_tax_config_org_tax_uidx").on(t.orgId, t.taxTypeId)]
);
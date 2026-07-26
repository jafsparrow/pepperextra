import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { organization, team } from "../auth-schema"

export const organizationSettings = pgTable(
  "organization_settings",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    country: text("country"),
    currency: text("currency").default("USD"),
    tagline: text("tagline"),
    taxNumber: text("tax_number"),
    address: text("address"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    website: text("website"),
    timezone: text("timezone").default("UTC"),
    dateFormat: text("date_format").default("DD/MM/YYYY"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.organizationId] })],
)

export const teamSettings = pgTable(
  "team_settings",
  {
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    printEnabled: boolean("print_enabled").default(true),
    paperWidth: text("paper_width").default("80mm"),
    defaultPrinterIp: text("default_printer_ip"),
    receiptFooter: text("receipt_footer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamId] })],
)

export const taxConfigs = pgTable(
  "tax_configs",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rate: numeric("rate").notNull(),
    type: text("type", { enum: ["percentage", "fixed"] })
      .default("percentage")
      .notNull(),
    isDefault: boolean("is_default").default(false),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tax_teamId_idx").on(table.teamId),
    index("tax_orgId_idx").on(table.organizationId),
  ],
)

export const serviceCharges = pgTable(
  "service_charges",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: numeric("amount").notNull(),
    type: text("type", { enum: ["percentage", "fixed"] })
      .default("fixed")
      .notNull(),
    isDefault: boolean("is_default").default(false),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("charge_teamId_idx").on(table.teamId),
    index("charge_orgId_idx").on(table.organizationId),
  ],
)

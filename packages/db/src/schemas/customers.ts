import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, user } from "../auth-schema";
import { customerTypeEnum, siteStatusEnum } from "./enums";

export const customers = pgTable(
  "customers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: customerTypeEnum("type").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    creditLimitMinor: bigint("credit_limit_minor", { mode: "bigint" })
      .default(0n)
      .notNull(),
    paymentTermsDays: integer("payment_terms_days").default(30).notNull(),
    portalLogin: boolean("portal_login").default(false).notNull(),
    portalPasswordHash: text("portal_password_hash"),
    vatNumber: text("vat_number"),
    billingAddress: text("billing_address"),
    shippingAddress: text("shipping_address"),
    defaultPriceListId: text("default_price_list_id"),
    taxExempt: boolean("tax_exempt").default(false).notNull(),
    taxExemptCertificate: text("tax_exempt_certificate"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("customers_org_id_idx").on(t.orgId),
    index("customers_org_type_idx").on(t.orgId, t.type),
    index("customers_org_phone_idx").on(t.orgId, t.phone),
  ]
);

export const customerContacts = pgTable(
  "customer_contacts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    role: text("role"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    portalAccess: boolean("portal_access").default(false).notNull(),
    portalPasswordHash: text("portal_password_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("customer_contacts_customer_idx").on(t.customerId),
    index("customer_contacts_org_idx").on(t.orgId),
  ]
);

export const sites = pgTable(
  "sites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    address: text("address"),
    contactNumber: text("contact_number"),
    startDate: timestamp("start_date"),
    expectedEndDate: timestamp("expected_end_date"),
    status: siteStatusEnum("status").default("active").notNull(),
    linkedBy: text("linked_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("sites_org_customer_idx").on(t.orgId, t.customerId),
    index("sites_org_status_idx").on(t.orgId, t.status),
  ]
);

export const siteContacts = pgTable(
  "site_contacts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    role: text("role"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [index("site_contacts_site_idx").on(t.siteId)]
);
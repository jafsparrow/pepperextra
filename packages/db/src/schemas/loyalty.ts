import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, user } from "../auth-schema";
import { products } from "./catalog";
import {
  tradeTypeEnum,
  redemptionTypeEnum,
  qrStatusEnum,
} from "./enums";

export const tradespeople = pgTable(
  "tradespeople",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    phone: text("phone").notNull(),
    name: text("name").notNull(),
    tradeType: tradeTypeEnum("trade_type").notNull(),
    pointsBalance: integer("points_balance").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("tradespeople_org_phone_uidx").on(t.orgId, t.phone),
    index("tradespeople_org_idx").on(t.orgId),
  ]
);

export const loyaltyRedemptions = pgTable(
  "loyalty_redemptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    tradespersonId: text("tradesperson_id")
      .notNull()
      .references(() => tradespeople.id),
    pointsRedeemed: integer("points_redeemed").notNull(),
    redemptionType: redemptionTypeEnum("redemption_type").notNull(),
    valueMinor: integer("value_minor").notNull(),
    periodQuarter: text("period_quarter"),
    processedBy: text("processed_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("loyalty_redemptions_org_person_idx").on(t.orgId, t.tradespersonId),
  ]
);

export const qrCodes = pgTable(
  "qr_codes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    unitSerial: text("unit_serial").notNull().unique(),
    status: qrStatusEnum("status").default("registered").notNull(),
    batchRangeStart: text("batch_range_start"),
    batchRangeEnd: text("batch_range_end"),
    purchaseReceiptId: text("purchase_receipt_id"),
    tradespersonId: text("tradesperson_id").references(
      () => tradespeople.id
    ),
    scannedBy: text("scanned_by").references(() => user.id),
    scannedAt: timestamp("scanned_at"),
    redeemedAt: timestamp("redeemed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("qr_codes_unit_serial_uidx").on(t.unitSerial),
    index("qr_codes_org_status_idx").on(t.orgId, t.status),
  ]
);
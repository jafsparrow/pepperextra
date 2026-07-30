import {
  pgTable,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { organization, team, user } from "../auth-schema";
import { stationLineStatusEnum } from "./enums";
import { quotationLines } from "./quotations";

export const fulfillmentStations = pgTable(
  "fulfillment_stations",
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
    defaultCategoryIds: text("default_category_ids").array(),
    printerName: text("printer_name"),
    printerIp: text("printer_ip"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [index("fulfillment_stations_org_team_idx").on(t.orgId, t.teamId)]
);

export const fulfillmentStationLines = pgTable(
  "fulfillment_station_lines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    quotationLineId: text("quotation_line_id")
      .notNull()
      .references(() => quotationLines.id),
    stationId: text("station_id")
      .notNull()
      .references(() => fulfillmentStations.id),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id),
    status: stationLineStatusEnum("status").default("pending").notNull(),
    markedReadyAt: timestamp("marked_ready_at"),
    markedBy: text("marked_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("station_lines_station_status_idx").on(t.stationId, t.status),
    index("station_lines_quotation_line_idx").on(t.quotationLineId),
  ]
);
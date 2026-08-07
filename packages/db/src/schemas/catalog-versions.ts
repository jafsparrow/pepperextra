import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core"
import { organization } from "../auth-schema"

export const orgCatalogVersions = pgTable("org_catalog_versions", {
  orgId: text("org_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  version: integer("version").default(1).notNull(),
  lastChangedAt: timestamp("last_changed_at").defaultNow().notNull(),
})

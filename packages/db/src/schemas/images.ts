import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { generateId } from "../utils";
import { organization } from "../auth-schema";
import { products } from "./catalog";

export const productImages = pgTable(
  "product_images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    storageKey: text("storage_key"),
    // Embedding dimension is model-dependent; final value is locked when the
    // embedding model is selected in a future release.
    imageVector: vector("image_vector", { dimensions: 512 }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    altText: text("alt_text"),
    mimeType: text("mime_type"),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("product_images_product_idx").on(t.productId),
    index("product_images_org_idx").on(t.orgId),
    index("product_images_vector_hnsw")
      .using("hnsw", t.imageVector.op("vector_cosine_ops"))
      .where(sql`${t.deletedAt} IS NULL`),
  ]
);

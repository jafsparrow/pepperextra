CREATE TABLE "product_alternatives" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"product_id" text NOT NULL,
	"alternative_product_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "product_alternatives_uidx" ON "product_alternatives" ("product_id","alternative_product_id");--> statement-breakpoint
CREATE INDEX "product_alternatives_org_idx" ON "product_alternatives" ("org_id");--> statement-breakpoint
CREATE INDEX "product_alternatives_product_idx" ON "product_alternatives" ("product_id");--> statement-breakpoint
CREATE INDEX "product_alternatives_alt_product_idx" ON "product_alternatives" ("alternative_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_alternatives_primary_uidx" ON "product_alternatives" ("product_id") WHERE "is_primary" = true;--> statement-breakpoint
ALTER TABLE "product_alternatives" ADD CONSTRAINT "product_alternatives_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_alternatives" ADD CONSTRAINT "product_alternatives_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_alternatives" ADD CONSTRAINT "product_alternatives_alternative_product_id_products_id_fkey" FOREIGN KEY ("alternative_product_id") REFERENCES "products"("id") ON DELETE CASCADE;
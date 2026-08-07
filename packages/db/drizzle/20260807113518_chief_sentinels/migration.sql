CREATE TABLE "org_catalog_versions" (
	"org_id" text PRIMARY KEY,
	"version" integer DEFAULT 1 NOT NULL,
	"last_changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_alternatives" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_alternatives" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_location_overrides" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_location_overrides" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_location_overrides" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "price_list_overrides" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "price_list_overrides" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "price_list_overrides" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_tag_assignments" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_tag_assignments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_tag_assignments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_groups" DROP COLUMN "brand_priority";--> statement-breakpoint
DROP INDEX "product_alternatives_product_idx";--> statement-breakpoint
CREATE INDEX "product_alternatives_product_idx" ON "product_alternatives" ("product_id","sort_order");--> statement-breakpoint
ALTER TABLE "org_catalog_versions" ADD CONSTRAINT "org_catalog_versions_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;
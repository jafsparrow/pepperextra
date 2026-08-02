CREATE TABLE "categories" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"parent_id" text,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" text;--> statement-breakpoint
CREATE INDEX "categories_org_id_idx" ON "categories" ("org_id");--> statement-breakpoint
CREATE INDEX "categories_org_parent_idx" ON "categories" ("org_id","parent_id");--> statement-breakpoint
CREATE INDEX "products_org_category_idx" ON "products" ("org_id","category_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");
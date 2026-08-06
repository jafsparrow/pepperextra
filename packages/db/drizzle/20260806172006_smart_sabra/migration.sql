ALTER TABLE "user_metadata" RENAME COLUMN "pinned_sku_ids" TO "pinned_tag_ids";--> statement-breakpoint
ALTER TABLE "tradespeople" ADD COLUMN "customer_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "tradespeople_org_customer_uidx" ON "tradespeople" ("org_id","customer_id");--> statement-breakpoint
ALTER TABLE "tradespeople" ADD CONSTRAINT "tradespeople_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
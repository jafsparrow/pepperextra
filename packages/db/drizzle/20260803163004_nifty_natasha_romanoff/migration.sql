ALTER TABLE "products" ADD COLUMN "needs_notes" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD COLUMN "notes" text;
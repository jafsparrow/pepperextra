CREATE TABLE "purchase_invoice_charges" (
	"id" text PRIMARY KEY,
	"purchase_invoice_id" text NOT NULL,
	"tax_type_id" text NOT NULL,
	"org_id" text NOT NULL,
	"description" text,
	"amount_minor" bigint NOT NULL,
	"tax_breakdown" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_invoice_lines" (
	"id" text PRIMARY KEY,
	"purchase_invoice_id" text NOT NULL,
	"product_id" text NOT NULL,
	"org_id" text NOT NULL,
	"description" text,
	"quantity" numeric(12,3) NOT NULL,
	"unit_cost_minor" bigint NOT NULL,
	"line_total_minor" bigint NOT NULL,
	"tax_breakdown" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_invoices" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"team_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"subtotal_minor" bigint NOT NULL,
	"tax_total_minor" bigint NOT NULL,
	"grand_total_minor" bigint NOT NULL,
	"paid_minor" bigint DEFAULT 0 NOT NULL,
	"credited_minor" bigint DEFAULT 0 NOT NULL,
	"tax_breakdown" jsonb NOT NULL,
	"status" "invoice_status" DEFAULT 'active'::"invoice_status" NOT NULL,
	"due_date" date,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"received_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_payments" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"purchase_invoice_id" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"method" "payment_method" NOT NULL,
	"reference" text,
	"recorded_by" text NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "loyalty_points_mode" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "loyalty_points_value" integer;--> statement-breakpoint
CREATE INDEX "purchase_invoice_charges_invoice_idx" ON "purchase_invoice_charges" ("purchase_invoice_id");--> statement-breakpoint
CREATE INDEX "purchase_invoice_lines_invoice_idx" ON "purchase_invoice_lines" ("purchase_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_invoices_org_number_uidx" ON "purchase_invoices" ("org_id","invoice_number");--> statement-breakpoint
CREATE INDEX "purchase_invoices_org_supplier_idx" ON "purchase_invoices" ("org_id","supplier_id");--> statement-breakpoint
CREATE INDEX "purchase_invoices_org_status_idx" ON "purchase_invoices" ("org_id","status");--> statement-breakpoint
CREATE INDEX "purchase_invoices_org_due_date_idx" ON "purchase_invoices" ("org_id","due_date");--> statement-breakpoint
CREATE INDEX "purchase_invoices_org_issued_at_idx" ON "purchase_invoices" ("org_id","issued_at");--> statement-breakpoint
CREATE INDEX "supplier_payments_org_supplier_idx" ON "supplier_payments" ("org_id","supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_payments_org_invoice_idx" ON "supplier_payments" ("org_id","purchase_invoice_id");--> statement-breakpoint
CREATE INDEX "supplier_payments_org_paid_at_idx" ON "supplier_payments" ("org_id","paid_at");--> statement-breakpoint
ALTER TABLE "purchase_invoice_charges" ADD CONSTRAINT "purchase_invoice_charges_kWyCF68PjbxO_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_invoice_charges" ADD CONSTRAINT "purchase_invoice_charges_tax_type_id_tax_types_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "tax_types"("id");--> statement-breakpoint
ALTER TABLE "purchase_invoice_charges" ADD CONSTRAINT "purchase_invoice_charges_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_wIOLFzlfEeXQ_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_purchase_invoice_id_purchase_invoices_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id");--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by") REFERENCES "user"("id");
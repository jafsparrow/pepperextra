CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "catalog_request_status" AS ENUM('pending', 'mapped', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "claim_resolution" AS ENUM('replaced_same_brand', 'replaced_alternative_brand', 'refund_issued', 'sent_for_service', 'rejected');--> statement-breakpoint
CREATE TYPE "claim_type" AS ENUM('replacement', 'service', 'refund');--> statement-breakpoint
CREATE TYPE "credit_note_reason" AS ENUM('customer_return', 'warranty_claim', 'reissue_remaining', 'pricing_error', 'other');--> statement-breakpoint
CREATE TYPE "customer_type" AS ENUM('retail', 'account', 'contractor');--> statement-breakpoint
CREATE TYPE "invoice_status" AS ENUM('active', 'paid', 'partially_credited', 'fully_credited', 'void');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('cash', 'bank_transfer', 'cheque', 'store_credit');--> statement-breakpoint
CREATE TYPE "qr_status" AS ENUM('registered', 'redeemed');--> statement-breakpoint
CREATE TYPE "quotation_status" AS ENUM('draft', 'confirmed', 'converted_to_invoice', 'expired');--> statement-breakpoint
CREATE TYPE "redemption_type" AS ENUM('store_credit', 'gift_voucher');--> statement-breakpoint
CREATE TYPE "service_status" AS ENUM('received', 'sent_to_supplier', 'repaired', 'ready_for_collection', 'collected');--> statement-breakpoint
CREATE TYPE "site_status" AS ENUM('active', 'on_hold', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "station_line_status" AS ENUM('pending', 'ready');--> statement-breakpoint
CREATE TYPE "stock_mode" AS ENUM('group', 'sku');--> statement-breakpoint
CREATE TYPE "supplier_claim_status" AS ENUM('pending', 'accepted', 'rejected', 'replaced', 'credited');--> statement-breakpoint
CREATE TYPE "tax_applies_to" AS ENUM('line', 'invoice', 'shipping');--> statement-breakpoint
CREATE TYPE "trade_type" AS ENUM('plumber', 'electrician', 'painter', 'carpenter', 'mason', 'other');--> statement-breakpoint
CREATE TYPE "warranty_type" AS ENUM('replacement', 'limited_replacement', 'service');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"team_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"active_team_id" text,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"custom_account_type" text DEFAULT 'staff',
	"password_reset_required" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"iso_code" text NOT NULL,
	"currency_id" text NOT NULL,
	"default_vat_rate" integer DEFAULT 500 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"decimal_places" integer NOT NULL,
	"minor_unit_per_major" integer NOT NULL,
	"icon_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_tax_config" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"tax_type_id" text NOT NULL,
	"override_rate_basis_points" integer,
	"override_fixed_amount_minor" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_types" (
	"id" text PRIMARY KEY,
	"country_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rate_basis_points" integer DEFAULT 0 NOT NULL,
	"is_percentage" boolean DEFAULT true NOT NULL,
	"fixed_amount_minor" integer,
	"applies_to" "tax_applies_to" DEFAULT 'line'::"tax_applies_to" NOT NULL,
	"is_mandatory" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_metadata" (
	"org_id" text PRIMARY KEY,
	"country_id" text DEFAULT 'OM' NOT NULL,
	"currency_id" text DEFAULT 'OMR' NOT NULL,
	"vat_number" text,
	"subscription_tier" text DEFAULT 'trial' NOT NULL,
	"single_tenant_mode" boolean DEFAULT false NOT NULL,
	"price_visibility" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_metadata" (
	"team_id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"address" text,
	"margin_floor" numeric(5,2) DEFAULT '2.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_metadata" (
	"user_id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"team_id" text,
	"pinned_sku_ids" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_requests" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"team_id" text NOT NULL,
	"submitted_by" text NOT NULL,
	"description" text NOT NULL,
	"photo_url" text,
	"status" "catalog_request_status" DEFAULT 'pending'::"catalog_request_status" NOT NULL,
	"mapped_to_sku" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_groups" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"spec_name" text NOT NULL,
	"brand_priority" text[],
	"stock_tracking_mode" "stock_mode" DEFAULT 'sku'::"stock_mode" NOT NULL,
	"group_reorder_threshold" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_location_overrides" (
	"id" text PRIMARY KEY,
	"product_id" text NOT NULL,
	"team_id" text NOT NULL,
	"org_id" text NOT NULL,
	"price_override_minor" bigint
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"product_group_id" text,
	"name" text NOT NULL,
	"sku_code" text,
	"spec_code" text,
	"brand_tag" text,
	"base_price_minor" bigint DEFAULT 0 NOT NULL,
	"active_cost_price_minor" bigint DEFAULT 0 NOT NULL,
	"cost_last_updated" timestamp,
	"unit" text,
	"station_override_id" text,
	"default_warranty_id" text,
	"eligible_for_loyalty" boolean DEFAULT false NOT NULL,
	"reorder_threshold" integer,
	"aliases" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" text PRIMARY KEY,
	"product_id" text NOT NULL,
	"org_id" text NOT NULL,
	"image_url" text NOT NULL,
	"storage_key" text,
	"image_vector" vector(512),
	"is_primary" boolean DEFAULT false NOT NULL,
	"alt_text" text,
	"mime_type" text,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "price_list_overrides" (
	"id" text PRIMARY KEY,
	"price_list_id" text NOT NULL,
	"product_id" text NOT NULL,
	"org_id" text NOT NULL,
	"price_minor" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_tag_assignments" (
	"tag_id" text,
	"product_id" text,
	CONSTRAINT "product_tag_assignments_pkey" PRIMARY KEY("tag_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "product_tags" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"colour" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"product_id" text,
	"team_id" text,
	"org_id" text NOT NULL,
	"quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_pkey" PRIMARY KEY("product_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "fulfillment_station_lines" (
	"id" text PRIMARY KEY,
	"quotation_line_id" text NOT NULL,
	"station_id" text NOT NULL,
	"org_id" text NOT NULL,
	"status" "station_line_status" DEFAULT 'pending'::"station_line_status" NOT NULL,
	"marked_ready_at" timestamp,
	"marked_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillment_stations" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"default_category_ids" text[],
	"printer_name" text,
	"printer_ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "quotation_charges" (
	"id" text PRIMARY KEY,
	"quotation_id" text NOT NULL,
	"tax_type_id" text NOT NULL,
	"org_id" text NOT NULL,
	"description" text,
	"amount_minor" bigint NOT NULL,
	"tax_breakdown" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_lines" (
	"id" text PRIMARY KEY,
	"quotation_id" text NOT NULL,
	"product_id" text NOT NULL,
	"org_id" text NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"cost_price_at_quote_minor" bigint NOT NULL,
	"line_total_minor" bigint NOT NULL,
	"tax_breakdown" jsonb,
	"station_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"team_id" text NOT NULL,
	"customer_id" text,
	"site_id" text,
	"customer_name" text,
	"customer_phone" text,
	"price_list_id" text,
	"status" "quotation_status" DEFAULT 'draft'::"quotation_status" NOT NULL,
	"confirmed_at" timestamp,
	"created_by" text NOT NULL,
	"tax_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoice_charges" (
	"id" text PRIMARY KEY,
	"invoice_id" text NOT NULL,
	"tax_type_id" text NOT NULL,
	"org_id" text NOT NULL,
	"description" text,
	"amount_minor" bigint NOT NULL,
	"tax_breakdown" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_counters" (
	"org_id" text,
	"prefix" text,
	"year" integer,
	"seq" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "invoice_counters_pkey" PRIMARY KEY("org_id","prefix","year")
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" text PRIMARY KEY,
	"invoice_id" text NOT NULL,
	"product_id" text NOT NULL,
	"org_id" text NOT NULL,
	"description" text,
	"quantity" numeric(12,3) NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"cost_price_minor" bigint NOT NULL,
	"line_total_minor" bigint NOT NULL,
	"tax_breakdown" jsonb NOT NULL,
	"station_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"team_id" text NOT NULL,
	"quotation_id" text,
	"customer_id" text,
	"site_id" text,
	"invoice_number" text NOT NULL,
	"subtotal_minor" bigint NOT NULL,
	"tax_total_minor" bigint NOT NULL,
	"grand_total_minor" bigint NOT NULL,
	"tax_breakdown" jsonb NOT NULL,
	"status" "invoice_status" DEFAULT 'active'::"invoice_status" NOT NULL,
	"due_date" date,
	"issued_by" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"method" "payment_method" NOT NULL,
	"reference" text,
	"recorded_by" text NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"transferred_from_invoice_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_note_charges" (
	"id" text PRIMARY KEY,
	"credit_note_id" text NOT NULL,
	"tax_type_id" text NOT NULL,
	"org_id" text NOT NULL,
	"description" text,
	"amount_minor" bigint NOT NULL,
	"tax_breakdown" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_note_lines" (
	"id" text PRIMARY KEY,
	"credit_note_id" text NOT NULL,
	"invoice_line_id" text NOT NULL,
	"product_id" text NOT NULL,
	"org_id" text NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"line_total_minor" bigint NOT NULL,
	"tax_breakdown" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"credit_note_number" text NOT NULL,
	"reason" "credit_note_reason" NOT NULL,
	"subtotal_minor" bigint NOT NULL,
	"tax_total_minor" bigint NOT NULL,
	"grand_total_minor" bigint NOT NULL,
	"tax_breakdown" jsonb NOT NULL,
	"refund_method" "payment_method",
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_warranty_lines" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"invoice_line_id" text,
	"warranty_id" text NOT NULL,
	"terms_notes" text,
	"serial_number" text,
	"duration_months" integer NOT NULL,
	"price_minor" bigint DEFAULT 0 NOT NULL,
	"vat_amount_minor" bigint DEFAULT 0 NOT NULL,
	"tax_breakdown" jsonb,
	"expiry_date" date NOT NULL,
	"claims_used" integer DEFAULT 0 NOT NULL,
	"max_claims" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_warranty_claims" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"purchase_receipt_id" text,
	"product_id" text NOT NULL,
	"serial_number" text,
	"claim_date" date DEFAULT now() NOT NULL,
	"status" "supplier_claim_status" DEFAULT 'pending'::"supplier_claim_status" NOT NULL,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranty_claims" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"warranty_line_id" text NOT NULL,
	"claim_date" date DEFAULT now() NOT NULL,
	"claim_type" "claim_type" NOT NULL,
	"resolution" "claim_resolution",
	"service_reference" text UNIQUE,
	"service_status" "service_status",
	"replacement_invoice_id" text,
	"supplier_claim_id" text,
	"notes" text,
	"handled_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranty_items" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"warranty_type" "warranty_type" NOT NULL,
	"default_duration_months" integer,
	"max_claims" integer,
	"base_price_minor" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" text PRIMARY KEY,
	"customer_id" text NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"role" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"portal_access" boolean DEFAULT false NOT NULL,
	"portal_password_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"type" "customer_type" NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"credit_limit_minor" bigint DEFAULT 0 NOT NULL,
	"payment_terms_days" integer DEFAULT 30 NOT NULL,
	"portal_login" boolean DEFAULT false NOT NULL,
	"portal_password_hash" text,
	"vat_number" text,
	"billing_address" text,
	"shipping_address" text,
	"default_price_list_id" text,
	"tax_exempt" boolean DEFAULT false NOT NULL,
	"tax_exempt_certificate" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "site_contacts" (
	"id" text PRIMARY KEY,
	"site_id" text NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"role" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text,
	"contact_number" text,
	"start_date" timestamp,
	"expected_end_date" timestamp,
	"status" "site_status" DEFAULT 'active'::"site_status" NOT NULL,
	"linked_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "purchase_receipts" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"team_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"unit_cost_minor" bigint NOT NULL,
	"delivery_date" date NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"payment_terms_days" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "loyalty_redemptions" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"tradesperson_id" text NOT NULL,
	"points_redeemed" integer NOT NULL,
	"redemption_type" "redemption_type" NOT NULL,
	"value_minor" integer NOT NULL,
	"period_quarter" text,
	"processed_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"product_id" text NOT NULL,
	"unit_serial" text NOT NULL UNIQUE,
	"status" "qr_status" DEFAULT 'registered'::"qr_status" NOT NULL,
	"batch_range_start" text,
	"batch_range_end" text,
	"purchase_receipt_id" text,
	"tradesperson_id" text,
	"scanned_by" text,
	"scanned_at" timestamp,
	"redeemed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tradespeople" (
	"id" text PRIMARY KEY,
	"org_id" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"trade_type" "trade_type" NOT NULL,
	"points_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" ("slug");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "team_organizationId_idx" ON "team" ("organization_id");--> statement-breakpoint
CREATE INDEX "teamMember_teamId_idx" ON "team_member" ("team_id");--> statement-breakpoint
CREATE INDEX "teamMember_userId_idx" ON "team_member" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_iso_code_uidx" ON "countries" ("iso_code");--> statement-breakpoint
CREATE UNIQUE INDEX "currencies_code_uidx" ON "currencies" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "org_tax_config_org_tax_uidx" ON "org_tax_config" ("org_id","tax_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_types_country_code_uidx" ON "tax_types" ("country_id","code");--> statement-breakpoint
CREATE INDEX "tax_types_country_active_idx" ON "tax_types" ("country_id","is_active");--> statement-breakpoint
CREATE INDEX "org_metadata_country_idx" ON "org_metadata" ("country_id");--> statement-breakpoint
CREATE INDEX "team_metadata_org_id_idx" ON "team_metadata" ("org_id");--> statement-breakpoint
CREATE INDEX "user_metadata_org_id_idx" ON "user_metadata" ("org_id");--> statement-breakpoint
CREATE INDEX "user_metadata_org_team_idx" ON "user_metadata" ("org_id","team_id");--> statement-breakpoint
CREATE INDEX "catalog_requests_org_status_idx" ON "catalog_requests" ("org_id","status");--> statement-breakpoint
CREATE INDEX "product_groups_org_id_idx" ON "product_groups" ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_groups_org_spec_uidx" ON "product_groups" ("org_id","spec_name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_loc_override_uidx" ON "product_location_overrides" ("product_id","team_id");--> statement-breakpoint
CREATE INDEX "product_loc_override_org_team_idx" ON "product_location_overrides" ("org_id","team_id");--> statement-breakpoint
CREATE INDEX "products_org_id_idx" ON "products" ("org_id");--> statement-breakpoint
CREATE INDEX "products_org_group_idx" ON "products" ("org_id","product_group_id");--> statement-breakpoint
CREATE INDEX "products_org_brand_idx" ON "products" ("org_id","brand_tag");--> statement-breakpoint
CREATE INDEX "products_org_spec_code_idx" ON "products" ("org_id","spec_code");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" ("product_id");--> statement-breakpoint
CREATE INDEX "product_images_org_idx" ON "product_images" ("org_id");--> statement-breakpoint
CREATE INDEX "product_images_vector_hnsw" ON "product_images" USING hnsw ("image_vector" vector_cosine_ops) WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "price_list_overrides_uidx" ON "price_list_overrides" ("price_list_id","product_id");--> statement-breakpoint
CREATE INDEX "price_list_overrides_list_idx" ON "price_list_overrides" ("price_list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "price_lists_org_name_uidx" ON "price_lists" ("org_id","name");--> statement-breakpoint
CREATE INDEX "price_lists_org_id_idx" ON "price_lists" ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_tags_team_name_uidx" ON "product_tags" ("team_id","name");--> statement-breakpoint
CREATE INDEX "product_tags_org_team_idx" ON "product_tags" ("org_id","team_id");--> statement-breakpoint
CREATE INDEX "stock_org_team_idx" ON "stock" ("org_id","team_id");--> statement-breakpoint
CREATE INDEX "station_lines_station_status_idx" ON "fulfillment_station_lines" ("station_id","status");--> statement-breakpoint
CREATE INDEX "station_lines_quotation_line_idx" ON "fulfillment_station_lines" ("quotation_line_id");--> statement-breakpoint
CREATE INDEX "fulfillment_stations_org_team_idx" ON "fulfillment_stations" ("org_id","team_id");--> statement-breakpoint
CREATE INDEX "quotation_charges_quotation_idx" ON "quotation_charges" ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotation_lines_quotation_idx" ON "quotation_lines" ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotations_org_team_idx" ON "quotations" ("org_id","team_id");--> statement-breakpoint
CREATE INDEX "quotations_org_status_idx" ON "quotations" ("org_id","status");--> statement-breakpoint
CREATE INDEX "quotations_org_customer_idx" ON "quotations" ("org_id","customer_id");--> statement-breakpoint
CREATE INDEX "quotations_org_site_idx" ON "quotations" ("org_id","site_id");--> statement-breakpoint
CREATE INDEX "invoice_charges_invoice_idx" ON "invoice_charges" ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_lines_invoice_idx" ON "invoice_lines" ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_org_number_uidx" ON "invoices" ("org_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_org_status_idx" ON "invoices" ("org_id","status");--> statement-breakpoint
CREATE INDEX "invoices_org_customer_idx" ON "invoices" ("org_id","customer_id");--> statement-breakpoint
CREATE INDEX "invoices_org_issued_at_idx" ON "invoices" ("org_id","issued_at");--> statement-breakpoint
CREATE INDEX "payments_org_invoice_idx" ON "payments" ("org_id","invoice_id");--> statement-breakpoint
CREATE INDEX "credit_note_charges_cn_idx" ON "credit_note_charges" ("credit_note_id");--> statement-breakpoint
CREATE INDEX "credit_note_lines_cn_idx" ON "credit_note_lines" ("credit_note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_notes_org_number_uidx" ON "credit_notes" ("org_id","credit_note_number");--> statement-breakpoint
CREATE INDEX "credit_notes_org_invoice_idx" ON "credit_notes" ("org_id","invoice_id");--> statement-breakpoint
CREATE INDEX "warranty_lines_org_serial_idx" ON "invoice_warranty_lines" ("org_id","serial_number");--> statement-breakpoint
CREATE INDEX "warranty_lines_org_invoice_idx" ON "invoice_warranty_lines" ("org_id","invoice_id");--> statement-breakpoint
CREATE INDEX "supplier_warranty_org_supplier_idx" ON "supplier_warranty_claims" ("org_id","supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_warranty_org_status_idx" ON "supplier_warranty_claims" ("org_id","status");--> statement-breakpoint
CREATE INDEX "warranty_claims_org_line_idx" ON "warranty_claims" ("org_id","warranty_line_id");--> statement-breakpoint
CREATE INDEX "warranty_claims_service_status_idx" ON "warranty_claims" ("org_id","service_status");--> statement-breakpoint
CREATE INDEX "warranty_items_org_idx" ON "warranty_items" ("org_id");--> statement-breakpoint
CREATE INDEX "customer_contacts_customer_idx" ON "customer_contacts" ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_contacts_org_idx" ON "customer_contacts" ("org_id");--> statement-breakpoint
CREATE INDEX "customers_org_id_idx" ON "customers" ("org_id");--> statement-breakpoint
CREATE INDEX "customers_org_type_idx" ON "customers" ("org_id","type");--> statement-breakpoint
CREATE INDEX "customers_org_phone_idx" ON "customers" ("org_id","phone");--> statement-breakpoint
CREATE INDEX "site_contacts_site_idx" ON "site_contacts" ("site_id");--> statement-breakpoint
CREATE INDEX "sites_org_customer_idx" ON "sites" ("org_id","customer_id");--> statement-breakpoint
CREATE INDEX "sites_org_status_idx" ON "sites" ("org_id","status");--> statement-breakpoint
CREATE INDEX "purchase_receipts_org_product_idx" ON "purchase_receipts" ("org_id","product_id");--> statement-breakpoint
CREATE INDEX "purchase_receipts_org_supplier_idx" ON "purchase_receipts" ("org_id","supplier_id");--> statement-breakpoint
CREATE INDEX "purchase_receipts_org_product_date_idx" ON "purchase_receipts" ("org_id","product_id","delivery_date");--> statement-breakpoint
CREATE INDEX "suppliers_org_id_idx" ON "suppliers" ("org_id");--> statement-breakpoint
CREATE INDEX "loyalty_redemptions_org_person_idx" ON "loyalty_redemptions" ("org_id","tradesperson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_codes_unit_serial_uidx" ON "qr_codes" ("unit_serial");--> statement-breakpoint
CREATE INDEX "qr_codes_org_status_idx" ON "qr_codes" ("org_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "tradespeople_org_phone_uidx" ON "tradespeople" ("org_id","phone");--> statement-breakpoint
CREATE INDEX "tradespeople_org_idx" ON "tradespeople" ("org_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_currency_id_currencies_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id");--> statement-breakpoint
ALTER TABLE "org_tax_config" ADD CONSTRAINT "org_tax_config_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "org_tax_config" ADD CONSTRAINT "org_tax_config_tax_type_id_tax_types_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "tax_types"("id");--> statement-breakpoint
ALTER TABLE "tax_types" ADD CONSTRAINT "tax_types_country_id_countries_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id");--> statement-breakpoint
ALTER TABLE "org_metadata" ADD CONSTRAINT "org_metadata_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "org_metadata" ADD CONSTRAINT "org_metadata_country_id_countries_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id");--> statement-breakpoint
ALTER TABLE "org_metadata" ADD CONSTRAINT "org_metadata_currency_id_currencies_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id");--> statement-breakpoint
ALTER TABLE "team_metadata" ADD CONSTRAINT "team_metadata_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_metadata" ADD CONSTRAINT "team_metadata_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_metadata" ADD CONSTRAINT "user_metadata_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_metadata" ADD CONSTRAINT "user_metadata_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "user_metadata" ADD CONSTRAINT "user_metadata_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "catalog_requests" ADD CONSTRAINT "catalog_requests_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "catalog_requests" ADD CONSTRAINT "catalog_requests_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "catalog_requests" ADD CONSTRAINT "catalog_requests_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "catalog_requests" ADD CONSTRAINT "catalog_requests_mapped_to_sku_products_id_fkey" FOREIGN KEY ("mapped_to_sku") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_location_overrides" ADD CONSTRAINT "product_location_overrides_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_location_overrides" ADD CONSTRAINT "product_location_overrides_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_location_overrides" ADD CONSTRAINT "product_location_overrides_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_group_id_product_groups_id_fkey" FOREIGN KEY ("product_group_id") REFERENCES "product_groups"("id");--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "price_list_overrides" ADD CONSTRAINT "price_list_overrides_price_list_id_price_lists_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "price_list_overrides" ADD CONSTRAINT "price_list_overrides_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "price_list_overrides" ADD CONSTRAINT "price_list_overrides_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "product_tag_assignments" ADD CONSTRAINT "product_tag_assignments_tag_id_product_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "product_tags"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_tag_assignments" ADD CONSTRAINT "product_tag_assignments_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "fulfillment_station_lines" ADD CONSTRAINT "fulfillment_station_lines_HSN6DMxJMGJA_fkey" FOREIGN KEY ("quotation_line_id") REFERENCES "quotation_lines"("id");--> statement-breakpoint
ALTER TABLE "fulfillment_station_lines" ADD CONSTRAINT "fulfillment_station_lines_1C4ZIwwuFOZn_fkey" FOREIGN KEY ("station_id") REFERENCES "fulfillment_stations"("id");--> statement-breakpoint
ALTER TABLE "fulfillment_station_lines" ADD CONSTRAINT "fulfillment_station_lines_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "fulfillment_station_lines" ADD CONSTRAINT "fulfillment_station_lines_marked_by_user_id_fkey" FOREIGN KEY ("marked_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "fulfillment_stations" ADD CONSTRAINT "fulfillment_stations_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "fulfillment_stations" ADD CONSTRAINT "fulfillment_stations_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "quotation_charges" ADD CONSTRAINT "quotation_charges_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quotation_charges" ADD CONSTRAINT "quotation_charges_tax_type_id_tax_types_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "tax_types"("id");--> statement-breakpoint
ALTER TABLE "quotation_charges" ADD CONSTRAINT "quotation_charges_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "invoice_charges" ADD CONSTRAINT "invoice_charges_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoice_charges" ADD CONSTRAINT "invoice_charges_tax_type_id_tax_types_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "tax_types"("id");--> statement-breakpoint
ALTER TABLE "invoice_charges" ADD CONSTRAINT "invoice_charges_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "invoice_counters" ADD CONSTRAINT "invoice_counters_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_issued_by_user_id_fkey" FOREIGN KEY ("issued_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "credit_note_charges" ADD CONSTRAINT "credit_note_charges_credit_note_id_credit_notes_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "credit_notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "credit_note_charges" ADD CONSTRAINT "credit_note_charges_tax_type_id_tax_types_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "tax_types"("id");--> statement-breakpoint
ALTER TABLE "credit_note_charges" ADD CONSTRAINT "credit_note_charges_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "credit_note_lines" ADD CONSTRAINT "credit_note_lines_credit_note_id_credit_notes_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "credit_notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "credit_note_lines" ADD CONSTRAINT "credit_note_lines_invoice_line_id_invoice_lines_id_fkey" FOREIGN KEY ("invoice_line_id") REFERENCES "invoice_lines"("id");--> statement-breakpoint
ALTER TABLE "credit_note_lines" ADD CONSTRAINT "credit_note_lines_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "credit_note_lines" ADD CONSTRAINT "credit_note_lines_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "invoice_warranty_lines" ADD CONSTRAINT "invoice_warranty_lines_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "invoice_warranty_lines" ADD CONSTRAINT "invoice_warranty_lines_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "invoice_warranty_lines" ADD CONSTRAINT "invoice_warranty_lines_invoice_line_id_invoice_lines_id_fkey" FOREIGN KEY ("invoice_line_id") REFERENCES "invoice_lines"("id");--> statement-breakpoint
ALTER TABLE "invoice_warranty_lines" ADD CONSTRAINT "invoice_warranty_lines_warranty_id_warranty_items_id_fkey" FOREIGN KEY ("warranty_id") REFERENCES "warranty_items"("id");--> statement-breakpoint
ALTER TABLE "supplier_warranty_claims" ADD CONSTRAINT "supplier_warranty_claims_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "supplier_warranty_claims" ADD CONSTRAINT "supplier_warranty_claims_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "supplier_warranty_claims" ADD CONSTRAINT "supplier_warranty_claims_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_warranty_line_id_invoice_warranty_lines_id_fkey" FOREIGN KEY ("warranty_line_id") REFERENCES "invoice_warranty_lines"("id");--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_handled_by_user_id_fkey" FOREIGN KEY ("handled_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "warranty_items" ADD CONSTRAINT "warranty_items_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "site_contacts" ADD CONSTRAINT "site_contacts_site_id_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "site_contacts" ADD CONSTRAINT "site_contacts_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_linked_by_user_id_fkey" FOREIGN KEY ("linked_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_tradesperson_id_tradespeople_id_fkey" FOREIGN KEY ("tradesperson_id") REFERENCES "tradespeople"("id");--> statement-breakpoint
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_processed_by_user_id_fkey" FOREIGN KEY ("processed_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_tradesperson_id_tradespeople_id_fkey" FOREIGN KEY ("tradesperson_id") REFERENCES "tradespeople"("id");--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_scanned_by_user_id_fkey" FOREIGN KEY ("scanned_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "tradespeople" ADD CONSTRAINT "tradespeople_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id");
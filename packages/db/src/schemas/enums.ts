import { pgEnum } from "drizzle-orm/pg-core";

export const stockModeEnum = pgEnum("stock_mode", ["group", "sku"]);
export const catalogRequestStatusEnum = pgEnum("catalog_request_status", [
  "pending",
  "mapped",
  "approved",
  "rejected",
]);
export const quotationStatusEnum = pgEnum("quotation_status", [
  "draft",
  "confirmed",
  "converted_to_invoice",
  "expired",
]);
export const stationLineStatusEnum = pgEnum("station_line_status", [
  "pending",
  "ready",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "active",
  "paid",
  "partially_credited",
  "fully_credited",
  "void",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "cheque",
  "store_credit",
]);
export const creditNoteReasonEnum = pgEnum("credit_note_reason", [
  "customer_return",
  "warranty_claim",
  "reissue_remaining",
  "pricing_error",
  "other",
]);
export const warrantyTypeEnum = pgEnum("warranty_type", [
  "replacement",
  "limited_replacement",
  "service",
]);
export const claimTypeEnum = pgEnum("claim_type", [
  "replacement",
  "service",
  "refund",
]);
export const claimResolutionEnum = pgEnum("claim_resolution", [
  "replaced_same_brand",
  "replaced_alternative_brand",
  "refund_issued",
  "sent_for_service",
  "rejected",
]);
export const serviceStatusEnum = pgEnum("service_status", [
  "received",
  "sent_to_supplier",
  "repaired",
  "ready_for_collection",
  "collected",
]);
export const supplierClaimStatusEnum = pgEnum("supplier_claim_status", [
  "pending",
  "accepted",
  "rejected",
  "replaced",
  "credited",
]);
export const customerTypeEnum = pgEnum("customer_type", [
  "retail",
  "account",
  "contractor",
]);
export const siteStatusEnum = pgEnum("site_status", [
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);
export const tradeTypeEnum = pgEnum("trade_type", [
  "plumber",
  "electrician",
  "painter",
  "carpenter",
  "mason",
  "other",
]);
export const redemptionTypeEnum = pgEnum("redemption_type", [
  "store_credit",
  "gift_voucher",
]);
export const qrStatusEnum = pgEnum("qr_status", ["registered", "redeemed"]);
export const taxAppliesToEnum = pgEnum("tax_applies_to", [
  "line",
  "invoice",
  "shipping",
]);
export type QuotationStatus =
  | "draft"
  | "confirmed"
  | "converted_to_invoice"
  | "expired"

export interface QuotationLine {
  id: string
  productName: string
  quantity: number
  unitPriceMinor: number
  lineTotalMinor: number
}

export interface Quotation {
  id: string
  number: string
  customerId: string
  customerName: string
  status: QuotationStatus
  totalMinor: number
  createdAt: string
  validUntil: string
  lines: QuotationLine[]
  notes?: string
}

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  converted_to_invoice: "Invoiced",
  expired: "Expired",
}

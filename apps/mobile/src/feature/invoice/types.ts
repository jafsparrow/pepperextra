export type InvoiceStatus =
  | "active"
  | "paid"
  | "partially_credited"
  | "fully_credited"
  | "void"

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "cheque"
  | "store_credit"

export interface InvoiceLine {
  id: string
  productName: string
  quantity: number
  unitPriceMinor: number
  vatMinor: number
  lineTotalMinor: number
}

export interface InvoicePayment {
  id: string
  amountMinor: number
  method: PaymentMethod
  paidAt: string
  reference?: string
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  status: InvoiceStatus
  subtotalMinor: number
  vatMinor: number
  totalMinor: number
  paidMinor: number
  createdAt: string
  lines: InvoiceLine[]
  payments: InvoicePayment[]
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  active: "Active",
  paid: "Paid",
  partially_credited: "Partially credited",
  fully_credited: "Fully credited",
  void: "Void",
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  store_credit: "Store credit",
}

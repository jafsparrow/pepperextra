export type CustomerType = "retail" | "account" | "contractor"

export type TradeType = "plumber" | "electrician" | "painter" | "carpenter" | "mason" | "other"

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  type: CustomerType
  tradeType?: TradeType
  /** customers.default_price_list_id — drives POS price resolution (BRD §8.20) */
  defaultPriceListId?: string
  pointsBalance?: number
  lastPurchaseAt?: string
  purchaseCount: number
  outstandingMinor?: number
  creditLimitMinor?: number
  notes?: string
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  retail: "Retail",
  account: "Account",
  contractor: "Contractor",
}

export const TRADE_TYPE_LABELS: Record<TradeType, string> = {
  plumber: "Plumber",
  electrician: "Electrician",
  painter: "Painter",
  carpenter: "Carpenter",
  mason: "Mason",
  other: "Other",
}

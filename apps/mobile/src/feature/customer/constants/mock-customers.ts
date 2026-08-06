import type { Customer } from "@/feature/customer/types"

// TEMP: sample data until the customers contract + API module exist.
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "c-1",
    name: "Acme Contracting",
    phone: "+968 9211 4455",
    email: "accounts@acme.om",
    type: "contractor",
    purchaseCount: 42,
    outstandingMinor: 1825000,
    creditLimitMinor: 5000000,
    notes: "Monthly settlement agreement.",
  },
  {
    id: "c-2",
    name: "Al Falah Retail",
    phone: "+968 9888 1122",
    type: "retail",
    purchaseCount: 17,
  },
  {
    id: "c-3",
    name: "Ahmed Al Balushi",
    phone: "+968 9123 4567",
    type: "retail",
    tradeType: "plumber",
    pointsBalance: 450,
    lastPurchaseAt: "2026-08-04T10:05:00Z",
    purchaseCount: 23,
  },
  {
    id: "c-4",
    name: "Green Valley Builder",
    phone: "+968 9444 8877",
    email: "procurement@gv.om",
    type: "contractor",
    purchaseCount: 68,
    outstandingMinor: 3500000,
    creditLimitMinor: 2500000,
  },
  {
    id: "c-5",
    name: "Ocean View Interiors",
    phone: "+968 9777 6655",
    type: "account",
    purchaseCount: 9,
    outstandingMinor: 267000,
    creditLimitMinor: 1000000,
  },
  {
    id: "c-6",
    name: "John Doe",
    phone: "+968 9000 1122",
    type: "retail",
    lastPurchaseAt: "2026-08-05T13:20:00Z",
    purchaseCount: 5,
  },
  {
    id: "c-7",
    name: "Said Al Hinai",
    phone: "+968 9333 2211",
    type: "retail",
    tradeType: "electrician",
    pointsBalance: 120,
    lastPurchaseAt: "2026-08-02T12:00:00Z",
    purchaseCount: 11,
  },
  {
    id: "c-8",
    name: "Mariam Al Zadjali",
    phone: "+968 9555 7788",
    type: "retail",
    tradeType: "painter",
    pointsBalance: 60,
    lastPurchaseAt: "2026-07-28T15:30:00Z",
    purchaseCount: 4,
  },
  {
    id: "c-9",
    name: "Rustaq Construction LLC",
    phone: "+968 9666 3344",
    email: "billing@rustaq.om",
    type: "contractor",
    purchaseCount: 31,
    outstandingMinor: 880000,
    creditLimitMinor: 3000000,
  },
]

export function findMockCustomer(id: string): Customer | undefined {
  return MOCK_CUSTOMERS.find((c) => c.id === id)
}

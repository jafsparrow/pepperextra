import type { Invoice } from "@/feature/invoice/types"

// TEMP: sample data until the invoices contract + API module exist.
export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    number: "INV-2026-00045",
    customerId: "c-6",
    customerName: "John Doe",
    status: "paid",
    subtotalMinor: 41000,
    vatMinor: 2050,
    totalMinor: 43050,
    paidMinor: 43050,
    createdAt: "2026-08-05T13:20:00Z",
    lines: [
      { id: "il-1", productName: "Emulsion Paint White 5L", quantity: 2, unitPriceMinor: 20500, vatMinor: 2050, lineTotalMinor: 43050 },
    ],
    payments: [{ id: "ip-1", amountMinor: 43050, method: "cash", paidAt: "2026-08-05T13:25:00Z" }],
  },
  {
    id: "inv-2",
    number: "INV-2026-00044",
    customerId: "c-2",
    customerName: "Al Falah Retail",
    status: "active",
    subtotalMinor: 114250,
    vatMinor: 5713,
    totalMinor: 119963,
    paidMinor: 0,
    createdAt: "2026-08-04T15:40:00Z",
    lines: [
      { id: "il-2", productName: 'Ball Valve 1/2" Brass', quantity: 12, unitPriceMinor: 8375, vatMinor: 5025, lineTotalMinor: 105525 },
      { id: "il-3", productName: "Garden Hose 20m", quantity: 1, unitPriceMinor: 13750, vatMinor: 688, lineTotalMinor: 14438 },
    ],
    payments: [],
  },
  {
    id: "inv-3",
    number: "INV-2026-00043",
    customerId: "c-4",
    customerName: "Green Valley Builder",
    status: "partially_credited",
    subtotalMinor: 163000,
    vatMinor: 8150,
    totalMinor: 171150,
    paidMinor: 50000,
    createdAt: "2026-08-03T10:00:00Z",
    lines: [
      { id: "il-4", productName: "PVC Solvent Cement 1L", quantity: 4, unitPriceMinor: 10000, vatMinor: 2000, lineTotalMinor: 42000 },
      { id: "il-5", productName: 'Rebar 12mm (12m)', quantity: 3, unitPriceMinor: 41000, vatMinor: 6150, lineTotalMinor: 129150 },
    ],
    payments: [{ id: "ip-2", amountMinor: 50000, method: "bank_transfer", paidAt: "2026-08-03T16:10:00Z", reference: "TRF-88213" }],
  },
  {
    id: "inv-4",
    number: "INV-2026-00042",
    customerId: "c-1",
    customerName: "Acme Contracting",
    status: "fully_credited",
    subtotalMinor: 52000,
    vatMinor: 2600,
    totalMinor: 54600,
    paidMinor: 0,
    createdAt: "2026-07-31T09:15:00Z",
    lines: [
      { id: "il-6", productName: "PVC Solvent Cement 250ml", quantity: 10, unitPriceMinor: 5200, vatMinor: 2600, lineTotalMinor: 54600 },
    ],
    payments: [],
  },
  {
    id: "inv-5",
    number: "INV-2026-00041",
    customerId: "c-3",
    customerName: "Ahmed Al Balushi (Plumber)",
    status: "void",
    subtotalMinor: 30000,
    vatMinor: 1500,
    totalMinor: 31500,
    paidMinor: 0,
    createdAt: "2026-07-30T08:05:00Z",
    lines: [
      { id: "il-7", productName: 'Copper Pipe 15mm (3m)', quantity: 4, unitPriceMinor: 7500, vatMinor: 1500, lineTotalMinor: 31500 },
    ],
    payments: [],
  },
  {
    id: "inv-6",
    number: "INV-2026-00040",
    customerId: "c-6",
    customerName: "John Doe",
    status: "active",
    subtotalMinor: 120000,
    vatMinor: 6000,
    totalMinor: 126000,
    paidMinor: 0,
    createdAt: "2026-07-29T17:30:00Z",
    lines: [
      { id: "il-8", productName: "Ceramic Tiles 60x60 (box)", quantity: 6, unitPriceMinor: 20000, vatMinor: 6000, lineTotalMinor: 126000 },
    ],
    payments: [],
  },
]

export function findMockInvoice(id: string): Invoice | undefined {
  return MOCK_INVOICES.find((inv) => inv.id === id)
}

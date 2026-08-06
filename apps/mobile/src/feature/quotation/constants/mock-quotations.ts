import type { Quotation } from "@/feature/quotation/types"

// TEMP: sample data until the quotations contract + API module exist.
export const MOCK_QUOTATIONS: Quotation[] = [
  {
    id: "q-1",
    number: "QT-00012",
    customerId: "c-1",
    customerName: "Acme Contracting",
    status: "confirmed",
    totalMinor: 230000,
    createdAt: "2026-08-05T09:30:00Z",
    validUntil: "2026-08-19T09:30:00Z",
    lines: [
      { id: "ql-1", productName: "Twin Core Wire 2.5mm (coil)", quantity: 5, unitPriceMinor: 18000, lineTotalMinor: 90000 },
      { id: "ql-2", productName: 'Conduit Pipe 20mm (3m)', quantity: 20, unitPriceMinor: 3500, lineTotalMinor: 70000 },
      { id: "ql-3", productName: "Junction Box 4-Way", quantity: 10, unitPriceMinor: 7000, lineTotalMinor: 70000 },
    ],
    notes: "Cash discount discussed.",
  },
  {
    id: "q-2",
    number: "QT-00011",
    customerId: "c-2",
    customerName: "Al Falah Retail",
    status: "confirmed",
    totalMinor: 85000,
    createdAt: "2026-08-04T14:15:00Z",
    validUntil: "2026-08-18T14:15:00Z",
    lines: [
      { id: "ql-4", productName: "PVC Solvent Cement 1L", quantity: 4, unitPriceMinor: 4500, lineTotalMinor: 18000 },
      { id: "ql-5", productName: "Ball Valve 1/2\" Brass", quantity: 8, unitPriceMinor: 8375, lineTotalMinor: 67000 },
    ],
  },
  {
    id: "q-3",
    number: "QT-00010",
    customerId: "c-3",
    customerName: "Ahmed Al Balushi (Plumber)",
    status: "draft",
    totalMinor: 45300,
    createdAt: "2026-08-04T10:05:00Z",
    validUntil: "2026-08-18T10:05:00Z",
    lines: [
      { id: "ql-6", productName: 'Copper Pipe 15mm (3m)', quantity: 6, unitPriceMinor: 7550, lineTotalMinor: 45300 },
    ],
  },
  {
    id: "q-4",
    number: "QT-00009",
    customerId: "c-4",
    customerName: "Green Valley Builder",
    status: "converted_to_invoice",
    totalMinor: 1420000,
    createdAt: "2026-07-30T11:40:00Z",
    validUntil: "2026-08-13T11:40:00Z",
    lines: [
      { id: "ql-7", productName: "Portland Cement 50kg", quantity: 40, unitPriceMinor: 28000, lineTotalMinor: 1120000 },
      { id: "ql-8", productName: "River Sand (per m³)", quantity: 6, unitPriceMinor: 50000, lineTotalMinor: 300000 },
    ],
  },
  {
    id: "q-5",
    number: "QT-00008",
    customerId: "c-5",
    customerName: "Ocean View Interiors",
    status: "expired",
    totalMinor: 267000,
    createdAt: "2026-07-20T08:20:00Z",
    validUntil: "2026-08-03T08:20:00Z",
    lines: [
      { id: "ql-9", productName: "Emulsion Paint White 20L", quantity: 3, unitPriceMinor: 89000, lineTotalMinor: 267000 },
    ],
  },
  {
    id: "q-6",
    number: "QT-00007",
    customerId: "c-1",
    customerName: "Acme Contracting",
    status: "draft",
    totalMinor: 615000,
    createdAt: "2026-07-28T16:50:00Z",
    validUntil: "2026-08-11T16:50:00Z",
    lines: [
      { id: "ql-10", productName: 'Rebar 12mm (12m)', quantity: 15, unitPriceMinor: 41000, lineTotalMinor: 615000 },
    ],
  },
]

export function findMockQuotation(id: string): Quotation | undefined {
  return MOCK_QUOTATIONS.find((q) => q.id === id)
}

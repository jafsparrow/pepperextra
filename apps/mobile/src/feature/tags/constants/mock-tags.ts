import type { ProductTag } from "@/feature/tags/types"

// TEMP: sample data until the tags contract + API module exist.
export const MOCK_TAGS: ProductTag[] = [
  {
    id: "tag-wires",
    name: "Wires",
    products: [
      { id: "p-1", name: "Twin Core Wire 2.5mm", sku: "WIR-2500", specCode: "WR25-STCT", brandTag: "STCT", unit: "coil", salePriceMinor: 18000, costPriceMinor: 12500, costUpdatedAt: "2026-08-01T08:00:00Z", stock: 34 },
      { id: "p-2", name: "Twin Core Wire 4mm", sku: "WIR-4000", specCode: "WR40-STCT", brandTag: "STCT", unit: "coil", salePriceMinor: 27500, costPriceMinor: 19100, costUpdatedAt: "2026-08-01T08:00:00Z", stock: 18 },
      { id: "p-3", name: "Single Core Wire 1.5mm", sku: "WIR-1500", specCode: "WR15-HILC", brandTag: "HILC", unit: "coil", salePriceMinor: 9900, costPriceMinor: 6400, costUpdatedAt: "2026-07-29T10:30:00Z", stock: 51 },
    ],
  },
  {
    id: "tag-pipes",
    name: "Pipes",
    products: [
      { id: "p-4", name: "Conduit Pipe 20mm", sku: "PIP-20", specCode: "PP20-STCT", brandTag: "STCT", unit: "3m", salePriceMinor: 3500, costPriceMinor: 2100, costUpdatedAt: "2026-08-02T09:00:00Z", stock: 120 },
      { id: "p-5", name: "Copper Pipe 15mm", sku: "PIP-C15", specCode: "PP15-HILC", brandTag: "HILC", unit: "3m", salePriceMinor: 7550, costPriceMinor: 5600, costUpdatedAt: "2026-08-02T09:00:00Z", stock: 44 },
      { id: "p-6", name: "UPVC Drain Pipe 110mm", sku: "PIP-110", specCode: "PP110UP-HILC", brandTag: "HILC", unit: "3m", salePriceMinor: 12800, costPriceMinor: 8900, costUpdatedAt: "2026-07-28T12:00:00Z", stock: 22 },
    ],
  },
  {
    id: "tag-cement",
    name: "Cement",
    products: [
      { id: "p-7", name: "Portland Cement 50kg", sku: "CEM-50", specCode: "CM50-STCT", brandTag: "STCT", unit: "bag", salePriceMinor: 28000, costPriceMinor: 22500, costUpdatedAt: "2026-08-03T07:30:00Z", stock: 210 },
      { id: "p-8", name: "White Cement 25kg", sku: "CEM-W25", specCode: "CM25-STCT", brandTag: "STCT", unit: "bag", salePriceMinor: 18500, costPriceMinor: 14900, costUpdatedAt: "2026-08-03T07:30:00Z", stock: 37 },
    ],
  },
  {
    id: "tag-paint",
    name: "Paint",
    products: [
      { id: "p-9", name: "Emulsion Paint White 20L", sku: "PNT-EW20", specCode: "PT20-STCT", brandTag: "STCT", unit: "bucket", salePriceMinor: 89000, costPriceMinor: 71200, costUpdatedAt: "2026-07-30T14:00:00Z", stock: 15 },
      { id: "p-10", name: "Emulsion Paint White 5L", sku: "PNT-EW5", specCode: "PT5-HILC", brandTag: "HILC", unit: "bucket", salePriceMinor: 20500, costPriceMinor: 16200, costUpdatedAt: "2026-07-30T14:00:00Z", stock: 41 },
    ],
  },
  {
    id: "tag-pvc",
    name: "PVC Fittings",
    products: [
      { id: "p-11", name: "Ball Valve 1/2\" Brass", sku: "PVC-BV12", specCode: "CV12-HILC", brandTag: "HILC", unit: "pc", salePriceMinor: 8375, costPriceMinor: 5900, costUpdatedAt: "2026-07-31T11:00:00Z", stock: 86 },
      { id: "p-12", name: "PVC Solvent Cement 1L", sku: "PVC-SC1", specCode: "GC1-STCT", brandTag: "STCT", unit: "tin", salePriceMinor: 10000, costPriceMinor: 6900, costUpdatedAt: "2026-07-31T11:00:00Z", stock: 64 },
    ],
  },
]

export function findMockTag(id: string): ProductTag | undefined {
  return MOCK_TAGS.find((t) => t.id === id)
}

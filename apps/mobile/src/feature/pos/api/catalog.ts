import { MOCK_TAGS } from '@/feature/tags/constants/mock-tags'
import type { PosProduct } from '@/feature/pos/types'

/**
 * PLACEHOLDER — returns a flat catalog from mock data. Will be replaced by a
 * TanStack Query call against the `product.list` contract (or a local SQLite
 * catalog for offline search, BRD §8.1). The shape already mirrors the DB
 * `products`/`product_images`/`stock` tables.
 */
export async function fetchCatalogProducts(): Promise<PosProduct[]> {
  return MOCK_TAGS.flatMap((tag) =>
    tag.products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      salePriceMinor: p.salePriceMinor,
      costPriceMinor: p.costPriceMinor,
      costUpdatedAt: p.costUpdatedAt,
      stock: p.stock,
    })),
  )
}

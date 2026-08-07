/**
 * POS product model — mirrors the DB catalog schema
 * (`products` + `product_images` + `stock` tables, see .agents/02_DATABASE_SCHEMA.md).
 * Optional fields map 1:1 to nullable DB columns and are absent until the
 * real catalog query is wired up.
 */
export interface PosProduct {
  id: string
  name: string
  sku: string
  specCode?: string
  brandTag?: string
  unit?: string
  /** base_price_minor, or the customer's active price-list override */
  salePriceMinor: number
  /** active_cost_price_minor — cost visibility gated by role (BRD §8.2) */
  costPriceMinor?: number
  /** cost_last_updated */
  costUpdatedAt?: string
  /** stock.quantity for the active team/location */
  stock: number
  /** products.reorder_threshold */
  reorderThreshold?: number
  /** primary product_images.image_url */
  imageUrl?: string
  eligibleForLoyalty?: boolean
}

export interface CartLine {
  product: PosProduct
  quantity: number
  /** Charged unit price. May be overridden by the POS price sheet; never mutates the catalog. */
  unitPriceMinor: number
}

export interface PosViewOptions {
  hideImages: boolean
  showStock: boolean
  /** Quick-spec capsule panel under the search bar (device-local, toggleable). */
  showSpecCapsules?: boolean
}

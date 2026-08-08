import type { AlternativeColor } from '@/feature/pos/constants/alternatives';

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
  /** products.product_group_id — groups interchangeable items for alternatives */
  productGroupId?: string
  /** merged same-group + explicit alternatives, ordered per docs (BRD §8.1) */
  alternatives?: PosProduct[]
  /** id of the is_primary alternative; falls back to the first alternative */
  defaultAlternativeId?: string
  /** which price source won the resolution chain (BRD §8.20) */
  priceSource?: 'priceList' | 'location' | 'base'
}

export interface CartAlternative {
  /** assigned slot; one per colour per line */
  color: AlternativeColor
  product: PosProduct
  /** Charged unit price, snapshotted when the alternative is added. */
  unitPriceMinor: number
}

export interface CartLine {
  product: PosProduct
  quantity: number
  /** Charged unit price. May be overridden by the POS price sheet; never mutates the catalog. */
  unitPriceMinor: number
  /** colour-coded alternative rows attached to this line */
  alternatives: CartAlternative[]
  /** selected alternative product id; undefined = the base (white) row */
  selectedAlternativeId?: string
}

/** What a confirm action resolves: the radio-mixed selection or a single colour. */
export type CartResolveMode = 'selected' | AlternativeColor

export interface PosViewOptions {
  hideImages: boolean
  showStock: boolean
  /** Quick-spec capsule panel under the search bar (device-local, toggleable). */
  showSpecCapsules?: boolean
}

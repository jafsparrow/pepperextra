export interface TaggedProduct {
  id: string
  name: string
  sku: string
  specCode?: string
  brandTag?: string
  unit?: string
  salePriceMinor: number
  costPriceMinor?: number
  costUpdatedAt?: string
  stock: number
}

export interface ProductTag {
  id: string
  name: string
  products: TaggedProduct[]
}

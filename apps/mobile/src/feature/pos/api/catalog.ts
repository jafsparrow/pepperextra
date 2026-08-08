import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"
import { orpc } from "@/lib/orpc"
import type { PosProduct } from "@/feature/pos/types"

type UseCatalogProductsOptions = {
  /** selected customer's default price list — drives override resolution */
  priceListId?: string | null
}

/**
 * POS catalog via the real catalog sync endpoints.
 *
 * Fetches the org-scoped delta (`contracts.catalog.sync`, full payload when
 * `since` is omitted) plus the per-location stock stream
 * (`contracts.catalog.getStock`) and joins them into `PosProduct[]`.
 *
 * Price resolution (BRD §8.20 / DB schema §2): explicit price-list override →
 * team location override → base price. A document-level price list is not
 * selectable on mobile yet, so only the customer default price list applies.
 * The override data ships in the sync delta, so no server round-trips.
 *
 * Note: this is the online wiring step. Offline reads should move to local
 * expo-sqlite (spec: `.agents/mobile/features/sync-feature.md`) — that layer
 * is not built yet, so the catalog loads over the network on mount.
 */
export function useCatalogProducts({ priceListId }: UseCatalogProductsOptions = {}) {
  const { data: session } = authClient.useSession()
  const organizationId = session?.session?.activeOrganizationId
  console.log("useCatalogProducts: organizationId", organizationId)
  const teamId = session?.session?.activeTeamId ?? undefined

  const delta = useQuery(
    orpc.catalog.sync.queryOptions({
      input: { organizationId: organizationId ?? "", teamId, since: undefined },
      enabled: !!organizationId,
    })
  )

  const stock = useQuery(
    orpc.catalog.getStock.queryOptions({
      input: { organizationId: organizationId ?? "", teamId: teamId ?? "" },
      enabled: !!organizationId && !!teamId,
    })
  )

  const products = useMemo<PosProduct[]>(() => {
    const rows = delta.data?.products ?? []

    const primaryImageByProduct = new Map<string, string>()
    for (const image of delta.data?.productImages ?? []) {
      if (image.isPrimary && !primaryImageByProduct.has(image.productId)) {
        primaryImageByProduct.set(image.productId, image.imageUrl)
      }
    }

    const stockByProduct = new Map<string, number>()
    for (const entry of stock.data?.stock ?? []) {
      stockByProduct.set(entry.productId, Number(entry.quantity))
    }

    // Price resolution chain: price-list override -> location override -> base.
    const priceListOverrideByProduct = new Map<string, number>()
    if (priceListId) {
      for (const o of delta.data?.priceListOverrides ?? []) {
        if (o.priceListId === priceListId) {
          priceListOverrideByProduct.set(o.productId, Number(o.priceMinor))
        }
      }
    }
    const locationOverrideByProduct = new Map<string, number>()
    for (const o of delta.data?.productLocationOverrides ?? []) {
      if (o.priceOverrideMinor != null) {
        locationOverrideByProduct.set(o.productId, Number(o.priceOverrideMinor))
      }
    }

    const activeGroupIds = new Set(
      (delta.data?.productGroups ?? [])
        .filter((g) => !g.deletedAt)
        .map((g) => g.id)
    )

    const byId = new Map<string, PosProduct>()
    for (const p of rows) {
      if (p.deletedAt) continue
      const priceListPrice = priceListOverrideByProduct.get(p.id)
      const locationPrice = locationOverrideByProduct.get(p.id)
      const basePrice = Number(p.basePriceMinor)
      const priceSource = priceListPrice != null ? "priceList" : locationPrice != null ? "location" : "base"
      const product: PosProduct = {
        id: p.id,
        name: p.name,
        sku: p.skuCode ?? "",
        specCode: p.specCode ?? undefined,
        brandTag: p.brandTag ?? undefined,
        unit: p.unit ?? undefined,
        salePriceMinor: priceListPrice ?? locationPrice ?? basePrice,
        priceSource,
        stock: stockByProduct.get(p.id) ?? 0,
        reorderThreshold: p.reorderThreshold ?? undefined,
        imageUrl: primaryImageByProduct.get(p.id),
        eligibleForLoyalty: p.eligibleForLoyalty,
        productGroupId:
          p.productGroupId && activeGroupIds.has(p.productGroupId) ? p.productGroupId : undefined,
      }
      byId.set(p.id, product)
    }

    // Alternatives = same product_group ∪ explicit product_alternatives.
    // Explicit rows arrive server-ordered (sort_order asc, is_primary desc);
    // same-group members are appended after them, deduped by id.
    const explicitAltByProduct = new Map<string, string[]>()
    for (const a of delta.data?.productAlternatives ?? []) {
      if (a.deletedAt) continue
      const list = explicitAltByProduct.get(a.productId) ?? []
      list.push(a.alternativeProductId)
      explicitAltByProduct.set(a.productId, list)
    }
    const defaultAltByProduct = new Map<string, string>()
    for (const a of delta.data?.productAlternatives ?? []) {
      if (a.deletedAt || !a.isPrimary) continue
      if (!defaultAltByProduct.has(a.productId)) {
        defaultAltByProduct.set(a.productId, a.alternativeProductId)
      }
    }

    const result: PosProduct[] = []
    for (const product of byId.values()) {
      const groupId = product.productGroupId
      const merged: PosProduct[] = []
      const seen = new Set<string>()

      const explicitIds = explicitAltByProduct.get(product.id) ?? []
      for (const altId of explicitIds) {
        const alt = byId.get(altId)
        if (!alt || alt.id === product.id || seen.has(alt.id)) continue
        seen.add(alt.id)
        merged.push(alt)
      }

      if (groupId) {
        for (const alt of byId.values()) {
          if (alt.id === product.id || alt.productGroupId !== groupId || seen.has(alt.id)) continue
          seen.add(alt.id)
          merged.push(alt)
        }
      }

      if (merged.length > 0) {
        product.alternatives = merged
        product.defaultAlternativeId =
          defaultAltByProduct.get(product.id) && merged.some((a) => a.id === defaultAltByProduct.get(product.id))
            ? defaultAltByProduct.get(product.id)
            : merged[0].id
      }
      result.push(product)
    }

    return result
  }, [delta.data, stock.data, priceListId])

  return {
    products,
    isLoading: delta.isLoading || stock.isLoading,
    isError: delta.isError || stock.isError,
    error: delta.error ?? stock.error ?? null,
  }
}

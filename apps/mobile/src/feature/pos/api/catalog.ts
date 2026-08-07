import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"
import { orpc } from "@/lib/orpc"
import type { PosProduct } from "@/feature/pos/types"

/**
 * POS catalog via the real catalog sync endpoints.
 *
 * Fetches the org-scoped delta (`contracts.catalog.sync`, full payload when
 * `since` is omitted) plus the per-location stock stream
 * (`contracts.catalog.getStock`) and joins them into `PosProduct[]`.
 *
 * Note: this is the online wiring step. Offline reads should move to local
 * expo-sqlite (spec: `.agents/mobile/features/sync-feature.md`) — that layer
 * is not built yet, so the catalog loads over the network on mount.
 */
export function useCatalogProducts() {
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

    return rows
      .filter((p) => !p.deletedAt)
      .map(
        (p) =>
          ({
            id: p.id,
            name: p.name,
            sku: p.skuCode ?? "",
            specCode: p.specCode ?? undefined,
            brandTag: p.brandTag ?? undefined,
            unit: p.unit ?? undefined,
            salePriceMinor: Number(p.basePriceMinor),
            stock: stockByProduct.get(p.id) ?? 0,
            reorderThreshold: p.reorderThreshold ?? undefined,
            imageUrl: primaryImageByProduct.get(p.id),
            eligibleForLoyalty: p.eligibleForLoyalty,
          }) satisfies PosProduct
      )
  }, [delta.data, stock.data])

  return {
    products,
    isLoading: delta.isLoading || stock.isLoading,
    isError: delta.isError || stock.isError,
    error: delta.error ?? stock.error ?? null,
  }
}

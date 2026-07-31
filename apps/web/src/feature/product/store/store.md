# Product Store

No client-side state store is used for this feature. Data fetching is handled
by TanStack Query via the `orpc.product.*` utilities, and list/row mutations
invalidate the `PRODUCT_QUERY_KEYS` factory keys.

If a `zustand` store becomes necessary (e.g. shared selection across pages),
place it here.

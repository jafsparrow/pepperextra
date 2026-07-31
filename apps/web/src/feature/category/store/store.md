# Category Store

No client-side state store is used for this feature. Data fetching is handled
by TanStack Query via the `orpc.productGroup.*` utilities, and mutations
invalidate the `CATEGORY_QUERY_KEYS` factory keys.

If a `zustand` store becomes necessary (e.g. shared category selection across
pages), place it here.

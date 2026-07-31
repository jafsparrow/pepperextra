# Supplier Store

No client-side state store is used for this feature. Data fetching is handled
by TanStack Query via the `orpc.supplier.*` utilities, and mutations invalidate
the `SUPPLIER_QUERY_KEYS` factory keys.

If a `zustand` store becomes necessary, place it here.

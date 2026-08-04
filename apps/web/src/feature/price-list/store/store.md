# Price List Store

No client-side state store is used for this feature. Data fetching is handled
by TanStack Query via the `orpc.priceList.*` utilities, and list/row mutations
invalidate the `PRICE_LIST_QUERY_KEYS` factory keys.

If a `zustand` store becomes necessary (e.g. shared price list selection across
quotation/invoice creation), place it here.

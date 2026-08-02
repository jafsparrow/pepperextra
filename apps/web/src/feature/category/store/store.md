# Category Store

TanStack Query hooks and server-state for the category feature.

- Uses `orpc.category.list` for the category tree.
- Mutations (`orpc.category.create/update/delete`) invalidate `CATEGORY_QUERY_KEYS.lists()`.

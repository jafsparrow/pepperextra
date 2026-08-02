# Category Schema

Frontend-specific Zod schemas that are NOT part of `packages/contract`.

- `categoryFormSchema` — UI form schema for the category add/edit form.
  `parentId` selects the parent node (null = top level); `sortOrder` controls
  ordering among siblings.

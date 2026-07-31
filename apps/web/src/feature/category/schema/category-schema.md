# Category Schema

Frontend-specific Zod schemas that are NOT part of `packages/contract`.

- `categoryFormSchema` — UI form schema for the category (product group) add/edit form.
  `brandPriority` is captured as a comma-separated string in the form and split
  into an array before calling `orpc.productGroup.create/update`.

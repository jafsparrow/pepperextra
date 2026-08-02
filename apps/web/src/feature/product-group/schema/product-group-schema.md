# Product Group Schema

Frontend-specific Zod schemas that are NOT part of `packages/contract`.

- `productGroupFormSchema` — UI form schema for the product group add/edit form.
  `brandPriority` is captured as a comma-separated string in the form and split
  into an array before calling `orpc.productGroup.create/update`.

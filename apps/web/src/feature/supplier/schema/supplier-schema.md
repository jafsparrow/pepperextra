# Supplier Schema

Frontend-specific Zod schemas that are NOT part of `packages/contract`.

- `supplierFormSchema` — UI form schema for the supplier (vendor) add/edit form.
  The shape mirrors `supplierCreateSchema` from `packages/contract` so form values
  map 1:1 onto the `orpc.supplier.create/update` inputs.

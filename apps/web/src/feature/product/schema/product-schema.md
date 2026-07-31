# Product Schema

Frontend-specific Zod schemas that are NOT part of `packages/contract`.

- `productFormSchema` — UI form schema for the product add/edit form.
  Uses major-unit monetary input (`basePrice`) that is converted to minor units
  (`basePriceMinor`) before being sent to the `orpc.product.create/update` contracts.

# Customer Schema

Frontend-specific Zod schemas that are NOT part of `packages/contract`.

- `customerFormSchema` — UI form schema for the customer add/edit form.
  `creditLimit` is captured in major units and converted to minor units
  (`creditLimitMinor`) before calling `orpc.customer.create/update`.

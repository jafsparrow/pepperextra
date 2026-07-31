import { oc } from "@orpc/contract"
import z from "zod"

export const countrySchema = z.object({
  id: z.string(),
  name: z.string(),
  isoCode: z.string(),
  currencyCode: z.string(),
  currencySymbol: z.string(),
})

export type Country = z.infer<typeof countrySchema>

export const listCountries = oc
  .route({
    method: "GET",
    path: "/countries",
  })
  .output(z.array(countrySchema))

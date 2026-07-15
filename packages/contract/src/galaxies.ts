import { oc } from "@orpc/contract"
import z from "zod"

export const listGalxy = oc
  .route({
    method: "GET",
    path: "/planets",
  })
  .input(
    z.object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
      cursor: z.coerce.number().int().min(0).default(0),
    })
  )
  .output(z.object({ item: z.string() }))

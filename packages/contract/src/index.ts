import { oc, populateContractRouterPaths } from "@orpc/contract"
import z, { success } from "zod"
import { listGalxy } from "./galaxies.js"

export const planetSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  description: z.string(),
})

export type Planet = z.infer<typeof planetSchema>

const listPlanets = oc
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
  .output(z.array(planetSchema))

const findPlanet = oc
  .route({ method: "GET", path: "/planets/${id}" })
  .input(
    z.object({
      id: z.coerce.number().int().min(1),
    })
  )
  .output(planetSchema)

const createPlanet = oc
  .route({ method: "POST", path: "/planets" })
  .input(
    z.object({
      name: z.string().min(2),
      description: z.string().optional(),
    })
  )
  .output(planetSchema)

const deletePlanet = oc
  .route({ method: "DELETE", path: "/planets/${id}" })
  .input(z.object({ id: z.coerce.number().int().min(1) }))
  .output(z.object({ success: z.boolean() }))

export const contracts = populateContractRouterPaths({
  planet: {
    list: listPlanets,
    find: findPlanet,
    create: createPlanet,
    delete: deletePlanet,
  },
  galaxy: {
    list: listGalxy,
  },
})

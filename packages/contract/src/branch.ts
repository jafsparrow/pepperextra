import { oc } from "@orpc/contract"
import z from "zod"

export const branchProfileSchema = z.object({
  teamId: z.string(),
  organizationId: z.string(),
  name: z.string(),
  tagline: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  mapUrl: z.string().nullable().optional(),
  emblemImage: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
})

export type BranchProfile = z.infer<typeof branchProfileSchema>

export const branchProfileUpdateSchema = z.object({
  tagline: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  mapUrl: z.string().nullable().optional(),
  emblemImage: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
})

export const getBranchProfile = oc
  .route({ method: "GET", path: "/teams/${teamId}/profile" })
  .input(z.object({ teamId: z.string() }))
  .output(branchProfileSchema)

export const updateBranchProfile = oc
  .route({ method: "PUT", path: "/teams/${teamId}/profile" })
  .input(branchProfileUpdateSchema.extend({ teamId: z.string() }))
  .output(branchProfileSchema)

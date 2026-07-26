import { oc } from "@orpc/contract"
import z from "zod"

export const organizationSettingsSchema = z.object({
  organizationId: z.string(),
  country: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  taxNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  dateFormat: z.string().nullable().optional(),
})

export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>

export const organizationSettingsUpdateSchema = z.object({
  country: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  taxNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  dateFormat: z.string().nullable().optional(),
})

export const getOrganizationSettings = oc
  .route({
    method: "GET",
    path: "/organizations/${organizationId}/settings",
  })
  .input(
    z.object({
      organizationId: z.string(),
    }),
  )
  .output(organizationSettingsSchema)

export const updateOrganizationSettings = oc
  .route({
    method: "PUT",
    path: "/organizations/${organizationId}/settings",
  })
  .input(
    organizationSettingsUpdateSchema.extend({
      organizationId: z.string(),
    }),
  )
  .output(organizationSettingsSchema)

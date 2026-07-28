import { oc } from "@orpc/contract"
import z from "zod"

// --- Team Settings ---

export const teamSettingsSchema = z.object({
  teamId: z.string(),
  organizationId: z.string(),
  printEnabled: z.boolean().nullable().optional(),
  paperWidth: z.string().nullable().optional(),
  defaultPrinterIp: z.string().nullable().optional(),
  receiptFooter: z.string().nullable().optional(),
})

export type TeamSettings = z.infer<typeof teamSettingsSchema>

export const teamSettingsUpdateSchema = z.object({
  printEnabled: z.boolean().nullable().optional(),
  paperWidth: z.string().nullable().optional(),
  defaultPrinterIp: z.string().nullable().optional(),
  receiptFooter: z.string().nullable().optional(),
})

export const getTeamSettings = oc
  .route({
    method: "GET",
    path: "/teams/{teamId}/settings",
  })
  .input(z.object({ teamId: z.string() }))
  .output(teamSettingsSchema)

export const updateTeamSettings = oc
  .route({
    method: "PUT",
    path: "/teams/{teamId}/settings",
  })
  .input(teamSettingsUpdateSchema.extend({ teamId: z.string() }))
  .output(teamSettingsSchema)

// --- Tax Configs ---

export const taxConfigSchema = z.object({
  id: z.string(),
  teamId: z.string().nullable().optional(),
  organizationId: z.string(),
  name: z.string(),
  rate: z.string(),
  type: z.enum(["percentage", "fixed"]),
  isDefault: z.boolean().nullable().optional(),
  active: z.boolean().nullable().optional(),
})

export type TaxConfig = z.infer<typeof taxConfigSchema>

export const taxConfigCreateSchema = z.object({
  name: z.string().min(1, "Tax name is required"),
  rate: z.string().min(1, "Tax rate is required"),
  type: z.enum(["percentage", "fixed"]).default("percentage"),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
})

export const taxConfigUpdateSchema = taxConfigCreateSchema.partial()

export const listTaxConfigs = oc
  .route({
    method: "GET",
    path: "/teams/{teamId}/taxes",
  })
  .input(z.object({ teamId: z.string() }))
  .output(z.array(taxConfigSchema))

export const createTaxConfig = oc
  .route({
    method: "POST",
    path: "/teams/{teamId}/taxes",
  })
  .input(taxConfigCreateSchema.extend({ teamId: z.string(), organizationId: z.string() }))
  .output(taxConfigSchema)

export const updateTaxConfig = oc
  .route({
    method: "PUT",
    path: "/teams/{teamId}/taxes/{id}",
  })
  .input(taxConfigUpdateSchema.extend({ teamId: z.string(), id: z.string() }))
  .output(taxConfigSchema)

export const deleteTaxConfig = oc
  .route({
    method: "DELETE",
    path: "/teams/{teamId}/taxes/{id}",
  })
  .input(z.object({ teamId: z.string(), id: z.string() }))
  .output(z.object({ success: z.boolean() }))

// --- Service Charges ---

export const serviceChargeSchema = z.object({
  id: z.string(),
  teamId: z.string().nullable().optional(),
  organizationId: z.string(),
  name: z.string(),
  amount: z.string(),
  type: z.enum(["percentage", "fixed"]),
  isDefault: z.boolean().nullable().optional(),
  active: z.boolean().nullable().optional(),
})

export type ServiceCharge = z.infer<typeof serviceChargeSchema>

export const serviceChargeCreateSchema = z.object({
  name: z.string().min(1, "Charge name is required"),
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["percentage", "fixed"]).default("fixed"),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
})

export const serviceChargeUpdateSchema = serviceChargeCreateSchema.partial()

export const listServiceCharges = oc
  .route({
    method: "GET",
    path: "/teams/{teamId}/service-charges",
  })
  .input(z.object({ teamId: z.string() }))
  .output(z.array(serviceChargeSchema))

export const createServiceCharge = oc
  .route({
    method: "POST",
    path: "/teams/{teamId}/service-charges",
  })
  .input(serviceChargeCreateSchema.extend({ teamId: z.string(), organizationId: z.string() }))
  .output(serviceChargeSchema)

export const updateServiceCharge = oc
  .route({
    method: "PUT",
    path: "/teams/{teamId}/service-charges/{id}",
  })
  .input(serviceChargeUpdateSchema.extend({ teamId: z.string(), id: z.string() }))
  .output(serviceChargeSchema)

export const deleteServiceCharge = oc
  .route({
    method: "DELETE",
    path: "/teams/{teamId}/service-charges/{id}",
  })
  .input(z.object({ teamId: z.string(), id: z.string() }))
  .output(z.object({ success: z.boolean() }))

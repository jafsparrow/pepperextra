import z from "zod"

export const supplierFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  paymentTermsDays: z.number().int().min(0).optional(),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>

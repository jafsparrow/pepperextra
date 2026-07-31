import z from "zod"

export const categoryFormSchema = z.object({
  specName: z.string().min(1, "Spec name is required"),
  brandPriority: z.string().optional(),
  stockTrackingMode: z.enum(["group", "sku"]).optional(),
  groupReorderThreshold: z.number().int().min(0).optional(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

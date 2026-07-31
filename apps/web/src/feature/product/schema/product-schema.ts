import z from "zod"

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  skuCode: z.string().min(1, "SKU is required"),
  productGroupId: z.string().optional(),
  specCode: z.string().optional(),
  brandTag: z.string().optional(),
  basePrice: z
    .string()
    .refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Enter a valid price"
    )
    .optional(),
  unit: z.string().optional(),
  aliases: z.string().optional(),
  eligibleForLoyalty: z.boolean().optional(),
  reorderThreshold: z.number().int().min(0).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

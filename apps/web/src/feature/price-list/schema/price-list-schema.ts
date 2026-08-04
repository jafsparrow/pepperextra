import z from "zod"

export const priceListFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type PriceListFormValues = z.infer<typeof priceListFormSchema>

export const overrideFormSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  price: z
    .string()
    .refine(
      (v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0,
      "Enter a valid price"
    ),
})

export type OverrideFormValues = z.infer<typeof overrideFormSchema>

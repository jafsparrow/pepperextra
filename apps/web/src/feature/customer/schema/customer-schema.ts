import z from "zod"
import { customerTypeSchema } from "@repo/contracts"

export const customerFormSchema = z.object({
  type: customerTypeSchema,
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  creditLimit: z
    .string()
    .refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Enter a valid credit limit"
    )
    .optional(),
  paymentTermsDays: z.number().int().min(0).optional(),
  vatNumber: z.string().optional(),
  billingAddress: z.string().optional(),
  notes: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

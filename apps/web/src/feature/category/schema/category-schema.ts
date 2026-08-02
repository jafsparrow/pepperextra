import z from "zod"

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

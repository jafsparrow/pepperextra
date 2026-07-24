import * as z from "zod"

export const branchSchema = z.object({
  name: z.string().trim().min(2, "Branch name must be at least 2 characters"),
})

export type BranchFormValues = z.infer<typeof branchSchema>

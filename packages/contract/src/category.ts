import { oc } from "@orpc/contract"
import z from "zod"

export const categorySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  parentId: z.string().nullable().optional(),
  name: z.string(),
  sortOrder: z.number().int().default(0),
})

export type Category = z.infer<typeof categorySchema>

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const listCategories = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/categories",
  })
  .input(
    z.object({
      organizationId: z.string(),
    })
  )
  .output(z.array(categorySchema))

export const createCategory = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/categories",
  })
  .input(
    categoryCreateSchema.extend({
      organizationId: z.string(),
    })
  )
  .output(categorySchema)

export const updateCategory = oc
  .route({
    method: "PUT",
    path: "/organizations/{organizationId}/categories/{id}",
  })
  .input(
    categoryUpdateSchema.extend({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(categorySchema)

export const deleteCategory = oc
  .route({
    method: "DELETE",
    path: "/organizations/{organizationId}/categories/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.object({ success: z.boolean() }))

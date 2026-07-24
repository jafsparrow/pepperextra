import { oc } from "@orpc/contract"
import z from "zod"

export const organizationStaffUserCreateInputSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
})

export type CreateOrganizationStaffUserDto = z.infer<
  typeof organizationStaffUserCreateInputSchema
>

export const organizationStaffUserSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.literal("staff"),
  status: z.enum(["active", "banned"]),
  temporaryPassword: z.string(),
  banReason: z.string().optional(),
})

export type OrganizationStaffUser = z.infer<typeof organizationStaffUserSchema>

export const createUser = oc
  .route({
    method: "POST",
    path: "/users",
  })
  .input(
    z.object({
      name: z.string().min(1),
      email: z.email(),
      password: z.string().min(8),
    })
  )
  .output(z.object({ id: z.string(), name: z.string(), email: z.string() }))

export const passwordReset = oc
  .route({
    method: "POST",
    path: "/users/password-reset",
  })
  .input(
    z.object({
      email: z.string().email(),
      newPassword: z.string().min(8),
    })
  )
  .output(z.object({ success: z.boolean() }))

export const userUpdate = oc
  .route({
    method: "PUT",
    path: "/users/:id",
  })
  .input(
    z.object({
      name: z.string().min(1).optional(),
      email: z.email().optional(),
    })
  )
  .output(z.object({ id: z.string(), name: z.string(), email: z.string() }))

export const userBan = oc
  .route({
    method: "POST",
    path: "/users/:id/ban",
  })
  .input(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })
  )
  .output(z.object({ success: z.boolean(), message: z.string() }))

export const createOrganizationStaffUser = oc
  .route({
    method: "POST",
    path: "/organizations/:organizationId/staff-users",
  })
  .input(organizationStaffUserCreateInputSchema)
  .output(organizationStaffUserSchema)

export const resetOrganizationStaffUserPassword = oc
  .route({
    method: "POST",
    path: "/organizations/:organizationId/staff-users/:id/reset-password",
  })
  .input(
    z.object({
      organizationId: z.string().min(1),
      userId: z.string().min(1),
    })
  )
  .output(
    z.object({
      userId: z.string(),
      organizationId: z.string(),
      temporaryPassword: z.string(),
    })
  )

export const banOrganizationStaffUser = oc
  .route({
    method: "POST",
    path: "/organizations/:organizationId/staff-users/:id/ban",
  })
  .input(
    z.object({
      organizationId: z.string().min(1),
      id: z.string().min(1),
      reason: z.string().optional(),
    })
  )
  .output(
    z.object({
      id: z.string(),
      organizationId: z.string(),
      status: z.enum(["active", "banned"]),
      banReason: z.string().optional(),
    })
  )

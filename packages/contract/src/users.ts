import { oc } from "@orpc/contract"
import z from "zod"

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

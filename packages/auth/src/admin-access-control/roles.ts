import { createAccessControl } from "better-auth/plugins"
import { statement } from "./resource_permissions"

export const ac = createAccessControl(statement)

export const customAdminRole = ac.newRole({
  organization: ["create", "read", "update", "delete", "approve", "suspend"],
  user: ["read", "update", "delete", "ban", "list", "impersonate"],
  billing: ["read", "update", "process-refund", "view-usage"],
  system: ["read", "update"],
})

export const financeRole = ac.newRole({
  organization: ["read"],
  user: ["read", "list"],
  billing: ["read", "update", "process-refund", "view-usage"],
  system: ["read"],
})

export const ALL_ROLES = {
  customAdminRole,
  financeRole,
} as const

// 🪄 Magically infer your app's exact types based on your Better Auth schema
export type AppRoleName = keyof typeof ALL_ROLES
export type ResourceStatements = typeof statement

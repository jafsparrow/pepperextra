import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/organization/access"
import { orgStatements } from "./org-resource-permissions.js"

export const orgAccessControl = createAccessControl(orgStatements)

// Define organization roles with permissions based on orgStatements
export const staff = orgAccessControl.newRole({
  orders: ["create", "read"],
})

export const cashier = orgAccessControl.newRole({
  orders: ["create", "read"],
  billing: ["create", "read"],
})

export const manager = orgAccessControl.newRole({
  orders: ["create", "read", "update"],
  menu: ["create", "read", "update", "delete"],
  inventory: ["read", "update"],
  reports: ["read"],
  staff: ["read"],
})

export default {
  staff,
  cashier,
  manager,
}

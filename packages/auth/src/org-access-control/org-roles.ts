import { createAccessControl } from "better-auth/plugins/access"
import { defaultRoles } from "better-auth/plugins/organization/access"
import { orgStatements } from "./org-resource-permissions.js"

export const orgAccessControl = createAccessControl(orgStatements)

// owner — the super entity. Cannot be reassigned and doesn't share credentials.
// Full read/write on every org + branch resource.
const fullAccess = Object.fromEntries(
  Object.entries(orgStatements).map(([resource, actions]) => [
    resource,
    [...actions],
  ])
) as Parameters<typeof orgAccessControl.newRole>[0]

export const owner = orgAccessControl.newRole(fullAccess)

// manager — org-level manager acting on the owner's behalf. Full operational
// control, but can't delete the org or manage the access-control configuration.
export const manager = orgAccessControl.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  ac: ["read"],
  branches: ["create", "read", "update", "delete"],
  locations: ["create", "read", "update", "delete"],
  catalog: ["create", "read", "update", "delete"],
  menu: ["create", "read", "update", "delete"],
  customers: ["create", "read", "update", "delete"],
  inventory: ["create", "read", "update", "adjust", "delete"],
  staff: ["create", "read", "update", "delete", "reset_password"],
  quotations: [
    "create",
    "read",
    "update",
    "cancel",
    "confirm",
    "dispatch",
    "delete",
  ],
  orders: ["create", "read", "update", "cancel", "delete"],
  billing: ["create", "read", "update", "delete"],
  payments: ["create", "read", "refund"],
  creditNotes: ["create", "read", "delete"],
  discounts: ["create", "read", "update", "delete"],
  kitchen: ["read", "update", "complete"],
  stationQueue: ["read", "update", "complete"],
  reports: ["read", "export"],
  settings: ["read", "update"],
})

// branchManager — branch-scoped management (renamed from location_manager).
// Reads broadly, writes within own branch. Branch scoping is enforced at runtime.
export const branchManager = orgAccessControl.newRole({
  team: ["update"],
  member: ["read"],
  branches: ["read", "update"],
  locations: ["read", "update"],
  catalog: ["read"],
  menu: ["read"],
  customers: ["create", "read", "update"],
  inventory: ["read", "update", "adjust"],
  staff: ["read"],
  quotations: [
    "create",
    "read",
    "update",
    "cancel",
    "confirm",
    "dispatch",
  ],
  orders: ["create", "read", "update", "cancel"],
  billing: ["create", "read"],
  payments: ["create", "read"],
  creditNotes: ["create", "read"],
  discounts: ["read"],
  kitchen: ["read", "update", "complete"],
  stationQueue: ["read", "update", "complete"],
  reports: ["read"],
  settings: ["read"],
})

// salesperson — quotation engine + catalog. Margin is read-only (limited),
// discount floor is enforced at runtime.
export const salesperson = orgAccessControl.newRole({
  catalog: ["read"],
  menu: ["read"],
  customers: ["create", "read", "update"],
  quotations: [
    "create",
    "read",
    "update",
    "cancel",
    "confirm",
    "dispatch",
  ],
  orders: ["create", "read"],
  discounts: ["read"],
  inventory: ["read"],
  stationQueue: ["read"],
  reports: ["read"],
})

// cashier — billing, payments, credit notes.
export const cashier = orgAccessControl.newRole({
  catalog: ["read"],
  customers: ["read"],
  quotations: ["read"],
  orders: ["create", "read", "update"],
  billing: ["create", "read", "update"],
  payments: ["create", "read"],
  creditNotes: ["create", "read"],
  inventory: ["read"],
  stationQueue: ["read"],
  reports: ["read"],
})

// stationStaff — fulfilment station queue. Own-station scoping is enforced at runtime.
export const stationStaff = orgAccessControl.newRole({
  catalog: ["read"],
  quotations: ["read"],
  orders: ["read"],
  inventory: ["read"],
  kitchen: ["read", "update", "complete"],
  stationQueue: ["read", "update", "complete"],
})

// staff — base role (default for org-created members).
export const staff = orgAccessControl.newRole({
  catalog: ["read"],
  menu: ["read"],
  orders: ["create", "read"],
  inventory: ["read"],
  stationQueue: ["read"],
})

export const systemRoles = defaultRoles

const orgRoles = {
  owner,
  manager,
  branchManager,
  salesperson,
  cashier,
  stationStaff,
  staff,
}

export default orgRoles

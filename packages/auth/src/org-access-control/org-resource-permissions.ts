export const orgStatements = {
  // Better Auth core org-management resources (used by the built-in org/team/member/invitation routes)
  organization: ["update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],

  // BuildMate business resources
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
} as const

export type OrgResourceName = keyof typeof orgStatements

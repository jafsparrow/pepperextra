export const orgStatements = {
  orders: ["create", "read", "update", "cancel", "delete"],
  billing: ["create", "read", "update", "delete"],
  kitchen: ["read", "update", "complete"],
  inventory: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update", "delete"],
  menu: ["create", "read", "update", "delete"],
  customers: ["create", "read", "update", "delete"],
  reports: ["read", "export"],
  settings: ["read", "update"],
} as const

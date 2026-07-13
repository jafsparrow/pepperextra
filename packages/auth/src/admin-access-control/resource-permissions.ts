// admin resources are defined in this file,
// and are used to control access to the admin panel
export const statement = {
  organization: ["create", "read", "update", "delete", "approve", "suspend"],
  user: ["read", "update", "delete", "ban", "list", "impersonate"],
  billing: ["read", "update", "process-refund", "view-usage"],
  system: ["read", "update"],
} as const

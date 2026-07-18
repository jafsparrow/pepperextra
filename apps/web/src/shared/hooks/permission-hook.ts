// hooks/usePermission.ts
import { ALL_ROLES } from "@pepperextra/auth/roles"
import type { AppRoleName, ResourceStatements } from "@pepperextra/auth/roles"
import { useAuthorization } from "./authorization-hook"

// Enforce that you can only pass valid resources and valid actions defined in your file
type GuardConfig = {
  [Resource in keyof ResourceStatements]?: ResourceStatements[Resource][number][]
}

export function usePermission(requiredPermissions: GuardConfig) {
  const { user, isLoading } = useAuthorization()

  if (isLoading) return { isAllowed: false, isPending: true }
  if (!user) return { isAllowed: false, isPending: false }

  // 1. Get the current user's role from Better Auth (e.g. "customAdminRole")
  const userRoleName = user.role as AppRoleName
  const roleObject = ALL_ROLES[userRoleName]

  // 2. Handle cases where the user's role doesn't exist in our map
  if (!roleObject) {
    return { isAllowed: false, isPending: false }
  }

  // 3. Evaluate the permissions locally using your Better Auth role logic
  const isAllowed = Object.entries(requiredPermissions).every(
    ([resource, actions]) => {
      // Better Auth's ac schema roles allow you to view permissions as arrays/objects
      const allowedActionsForResource =
        (roleObject.statements as any)[resource] || []

      return (actions as string[]).every((action) =>
        allowedActionsForResource.includes(action)
      )
    }
  )

  return { isAllowed, isPending: false }
}

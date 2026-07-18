import { authClient } from "@pepperextra/auth/client"

type AuthorizationUser =
  | {
      role?: string | null
      [key: string]: unknown
    }
  | null
  | undefined

export function getUserRole(user: AuthorizationUser) {
  return user?.role ?? null
}

export function hasRole(user: AuthorizationUser, allowedRoles: string[]) {
  if (!user?.role) return false
  return allowedRoles.includes(user.role)
}

export function isAdmin(user: AuthorizationUser) {
  return user?.role === "admin"
}

export function useAuthorization() {
  const { data: session, isPending } = authClient.useSession()

  const user = session?.user

  return {
    user,
    session: session?.session,
    isLoading: isPending,
    isAdmin: isAdmin(user),
    hasRole: (allowedRoles: string[]) => hasRole(user, allowedRoles),
  }
}

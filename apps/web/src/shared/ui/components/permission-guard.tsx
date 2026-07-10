// components/PermissionGuard.tsx
import { usePermission } from "@/shared/hooks/permission-hook"
import type { ResourceStatements } from "@pepperextra/auth/roles"
import type { ReactNode } from "react"

interface GuardProps {
  children: ReactNode
  fallback?: ReactNode
  has: {
    [Resource in keyof ResourceStatements]?: ResourceStatements[Resource][number][]
  }
}

export function PermissionGuard({
  children,
  fallback = null,
  has,
}: GuardProps) {
  const { isAllowed, isPending } = usePermission(has)

  if (isPending) return null
  return isAllowed ? <>{children}</> : <>{fallback}</>
}

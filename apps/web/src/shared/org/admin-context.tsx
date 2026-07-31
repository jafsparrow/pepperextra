import { createContext, useContext, useState } from "react"
import { authClient } from "@repo/auth/client"

export interface AdminContext {
  orgId: string | undefined
  teamId: string | undefined
  setTeamId: (teamId: string | undefined) => void
}

const AdminContext = createContext<AdminContext | null>(null)

export function useAdminContext() {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error("useAdminContext must be used within AdminContextProvider")
  }
  return ctx
}

export function AdminContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const [teamId, setTeamId] = useState<string | undefined>(undefined)

  return (
    <AdminContext.Provider value={{ orgId: activeOrg?.id, teamId, setTeamId }}>
      {children}
    </AdminContext.Provider>
  )
}

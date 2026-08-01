import { createContext, useContext, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@repo/auth/client"
import { orpc } from "@/shared/utils/orpc"

export interface OrgCurrency {
  code: string | undefined
  symbol: string | undefined
  decimalPlaces: number | undefined
}

export interface AdminContext {
  orgId: string | undefined
  teamId: string | undefined
  setTeamId: (teamId: string | undefined) => void
  currency: OrgCurrency | undefined
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

  const { data: settings } = useQuery({
    ...orpc.organizationSettings.get.queryOptions({
      input: { organizationId: activeOrg?.id ?? "" },
    }),
    enabled: !!activeOrg?.id,
  })

  const currency: OrgCurrency | undefined = settings
    ? {
        code: settings.currency ?? undefined,
        symbol: settings.currencySymbol ?? undefined,
        decimalPlaces: settings.currencyDecimalPlaces ?? undefined,
      }
    : undefined

  return (
    <AdminContext.Provider
      value={{ orgId: activeOrg?.id, teamId, setTeamId, currency }}
    >
      {children}
    </AdminContext.Provider>
  )
}

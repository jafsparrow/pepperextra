import { useEffect } from "react"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@repo/auth/client"
import { orpc } from "@/shared/utils/orpc"
import { Spinner } from "@workspace/ui/components/spinner"

const ONBOARDING_PATH = "/org/onboarding"

export function OnboardingRedirect() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data: activeOrg, isPending: isActiveOrgPending } =
    authClient.useActiveOrganization()

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    ...orpc.organizationSettings.get.queryOptions({
      input: { organizationId: activeOrg?.id ?? "" },
    }),
    enabled: !!activeOrg?.id,
  })

  useEffect(() => {
    if (
      activeOrg &&
      settings &&
      settings.onboardingCompleted === false &&
      pathname !== ONBOARDING_PATH
    ) {
      navigate({ to: ONBOARDING_PATH })
    }
  }, [activeOrg, settings, pathname, navigate])

  if (!activeOrg) return null

  const resolving = isActiveOrgPending || isSettingsLoading
  const shouldBlock =
    resolving || (settings?.onboardingCompleted === false && pathname !== ONBOARDING_PATH)

  if (!shouldBlock) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <Spinner />
    </div>
  )
}

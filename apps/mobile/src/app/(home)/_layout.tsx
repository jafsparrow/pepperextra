import { Redirect } from "expo-router"

import AppTabs from "@/components/app-tabs"
import { authClient } from "@/lib/auth-client"

/**
 * Protected group. The tab navigator only renders for an active session that
 * has completed the forced password reset.
 */
export default function TabsLayout() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null
  if (!session) return <Redirect href="/login" />
  if (session.user.passwordResetRequired) return <Redirect href="/set-password" />

  return <AppTabs />
}

import { Redirect, Stack } from "expo-router"

import { authClient } from "@/lib/auth-client"

/**
 * Auth group. Renders the login/set-password screens for signed-out users or
 * users still on the forced password reset. Signed-in users that already set a
 * password are pushed into the tabs.
 */
export default function AuthLayout() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null
  if (session && !session.user.passwordResetRequired) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="set-password" />
    </Stack>
  )
}

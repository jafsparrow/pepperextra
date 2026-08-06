import { Redirect, Stack, usePathname } from "expo-router"

import { authClient } from "@/lib/auth-client"

/**
 * Auth group. Renders the login/set-password screens for signed-out users or
 * users still on the forced password reset. Signed-in users that already set a
 * password are pushed into the home group.
 *
 * This layout is the Expo Router equivalent of a router `beforeLoad` guard:
 * it decides post-login where to go based on the session, so the login screen
 * itself stays a plain sign-in form.
 */
export default function AuthLayout() {
  const { data: session, isPending } = authClient.useSession()
  const pathname = usePathname()

  if (isPending) return null
  if (session && session.user.passwordResetRequired) {
    // Don't redirect to the screen we're already on (e.g. after the forced
    // reset redirect already landed on /set-password). Redirecting to the
    // current route makes expo-router re-run the replace in a loop, which
    // crashes with "Maximum update depth exceeded".
    if (pathname !== "/set-password") {
      return <Redirect href="/set-password" />
    }
  } else if (session) {
    return <Redirect href="/" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="set-password" />
    </Stack>
  )
}

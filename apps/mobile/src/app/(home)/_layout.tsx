import { Redirect, Stack } from "expo-router"

import { authClient } from "@/lib/auth-client"

/**
 * Protected group. Tab roots render inside the native tab bar; every other
 * route here is pushed on top with a native header + back button.
 */
export default function HomeLayout() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null
  if (!session) return <Redirect href="/login" />
  if (session.user.passwordResetRequired) return <Redirect href="/set-password" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tag-products" options={{ presentation: 'transparentModal', headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
      <Stack.Screen name="profile" options={{ headerShown: true, title: "Profile" }} />
      <Stack.Screen name="pos" options={{ headerShown: false }} />
      <Stack.Screen name="pos/cart" options={{ headerShown: true, title: "Cart" }} />
      <Stack.Screen name="fulfilment" options={{ headerShown: true, title: "Fulfilment Station" }} />
      <Stack.Screen name="quotation/[id]" options={{ headerShown: true, title: "Quotation" }} />
      <Stack.Screen name="invoice/[id]" options={{ headerShown: true, title: "Invoice" }} />
      <Stack.Screen name="customer/[id]" options={{ headerShown: true, title: "Customer" }} />
    </Stack>
  )
}

import { Redirect } from "expo-router"
import { useState } from "react"
import { Text } from "react-native"

import { useMutation } from "@tanstack/react-query"

import { AuthButton } from "@/feature/auth/ui/components/auth-button"
import { AuthError } from "@/feature/auth/ui/components/auth-error"
import { AuthScreen } from "@/feature/auth/ui/components/auth-screen"
import { AuthTextField } from "@/feature/auth/ui/components/auth-text-field"
import { authClient } from "@/lib/auth-client"
import { orpc } from "@/lib/orpc"

const MIN_PASSWORD_LENGTH = 8

export default function SetPasswordScreen() {
  const { data: session, isPending } = authClient.useSession()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const resetMutation = useMutation(
    orpc.user.changeOwnPassword.mutationOptions({
      onSuccess: () => {
        void authClient.getSession()
      },
      onError: (error) => console.log(error),
    }),
  )

  if (!isPending && !session) {
    return <Redirect href="/login" />
  }

  const submit = () => {
    console.log("Submitting password change", {
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.")
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setFormError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      )
      return
    }
    setFormError(null)
    resetMutation.mutate({ currentPassword, newPassword })
  }

  return (
    <AuthScreen
      title="Set your password"
      subtitle="You must set a new password before continuing."
    >
      <Text>{JSON.stringify(session)}</Text>
      <AuthTextField
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="next"
      />
      <AuthTextField
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="next"
      />
      <AuthTextField
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <AuthError message={formError ?? resetMutation.error?.message ?? null} />
      <AuthButton
        title="Set password"
        isPending={resetMutation.isPending}
        onPress={submit}
      />
    </AuthScreen>
  )
}

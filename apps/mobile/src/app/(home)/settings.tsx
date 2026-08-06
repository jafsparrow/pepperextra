import { useState } from "react"
import { ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme"
import { useChangePassword } from "@/feature/auth/hooks/use-change-password"
import { useSignOut } from "@/feature/auth/hooks/use-sign-out"
import { AuthButton } from "@/feature/auth/ui/components/auth-button"
import { AuthError } from "@/feature/auth/ui/components/auth-error"
import { AuthTextField } from "@/feature/auth/ui/components/auth-text-field"

const MIN_PASSWORD_LENGTH = 8

export default function SettingsScreen() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const { changePassword, isPending: isChanging, error } = useChangePassword()
  const { signOutUser, isPending: isSigningOut } = useSignOut()

  const submitChange = async () => {
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.")
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    setFormError(null)
    setPasswordChanged(false)
    const ok = await changePassword({ currentPassword, newPassword })
    if (ok) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordChanged(true)
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.heading}>
              Settings
            </ThemedText>

            <ThemedView style={styles.card}>
              <ThemedText type="smallBold">Change password</ThemedText>
              <AuthTextField
                label="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                textContentType="password"
                autoComplete="current-password"
              />
              <AuthTextField
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <AuthTextField
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <AuthError message={formError ?? error} />
              {passwordChanged ? (
                <ThemedText type="small" style={styles.success}>
                  Password updated.
                </ThemedText>
              ) : null}
              <AuthButton
                title="Update password"
                isPending={isChanging}
                onPress={() => void submitChange()}
              />
            </ThemedView>

            <ThemedView style={styles.card}>
              <ThemedText type="smallBold">Session</ThemedText>
              <AuthButton
                title="Sign out"
                isPending={isSigningOut}
                onPress={() => void signOutUser()}
              />
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    alignItems: "center",
  },
  section: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
    paddingTop: Spacing.four,
  },
  heading: {
    fontSize: 28,
    lineHeight: 34,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: "transparent",
  },
  success: {
    color: "#16a34a",
  },
})

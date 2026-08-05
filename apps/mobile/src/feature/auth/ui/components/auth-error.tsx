import { StyleSheet } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Spacing } from "@/constants/theme"

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.error}>
      {message}
    </ThemedText>
  )
}

const styles = StyleSheet.create({
  error: {
    color: "#dc2626",
    marginTop: -Spacing.one,
  },
})

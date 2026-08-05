import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"

export type AuthButtonProps = PressableProps & {
  title: string
  isPending?: boolean
}

export function AuthButton({
  title,
  isPending,
  disabled,
  ...rest
}: AuthButtonProps) {
  const theme = useTheme()

  return (
    <Pressable
      disabled={disabled || isPending}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.text },
        (pressed || disabled || isPending) && styles.muted,
      ]}
      {...rest}>
      {isPending ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <ThemedText type="smallBold" themeColor="background">
          {title}
        </ThemedText>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  muted: {
    opacity: 0.6,
  },
})

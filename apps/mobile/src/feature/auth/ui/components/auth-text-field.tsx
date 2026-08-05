import { StyleSheet, TextInput, type TextInputProps, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"

export type AuthTextFieldProps = TextInputProps & {
  label: string
}

export function AuthTextField({ label, style, ...rest }: AuthTextFieldProps) {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={theme.textSecondary}
        {...rest}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
          style,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
})

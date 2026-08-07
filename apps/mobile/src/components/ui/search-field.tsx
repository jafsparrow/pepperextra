import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
};

export function SearchField({ value, onChangeText, placeholder, onClear }: SearchFieldProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.icon}>
        🔍
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Tokens.muted}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
      />
      {value && onClear ? (
        <Pressable onPress={onClear} hitSlop={8} style={styles.clearButton}>
          <ThemedText type="small" style={styles.clearText}>
            ✕
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  icon: {
    opacity: 0.8,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.three,
    color: Tokens.foreground,
    fontSize: 16,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.background,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  clearText: {
    color: Tokens.foregroundSecondary,
  },
});

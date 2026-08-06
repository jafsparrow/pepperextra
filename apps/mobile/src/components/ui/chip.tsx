import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';

type ChipProps = PropsWithChildren<{
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
}>;

export function Chip({ children, color = Tokens.foregroundSecondary, backgroundColor, borderColor }: ChipProps) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: backgroundColor ?? 'transparent' },
        borderColor ? { borderColor } : null,
      ]}>
      <ThemedText type="small" style={[{ color }, styles.text]}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 600,
  },
});

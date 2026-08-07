import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from 'react-native';

import { Spacing, Tokens } from '@/constants/theme';

export const TabletBreakpoint = 768;

type FabProps = {
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
};

export function Fab({ label, icon, onPress, color = Tokens.primary, style }: FabProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TabletBreakpoint;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.fab,
        isTablet ? styles.fabTablet : styles.fabCompact,
        { backgroundColor: color },
        style,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.icon}>{icon}</Text>
      {isTablet && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

type FabGroupProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function FabGroup({ children, style }: FabGroupProps) {
  return <View style={[styles.group, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.three,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabTablet: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  fabCompact: {
    width: 56,
    height: 56,
  },
  icon: {
    color: Tokens.primaryForeground,
    fontSize: 18,
  },
  label: {
    color: Tokens.primaryForeground,
    fontWeight: 700,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
});

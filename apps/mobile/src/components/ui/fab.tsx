import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Spacing, Tokens } from '@/constants/theme';

type FabProps = {
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
};

export function Fab({ label, icon, onPress, color = Tokens.primary, style }: FabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: color }, style, pressed && styles.pressed]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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

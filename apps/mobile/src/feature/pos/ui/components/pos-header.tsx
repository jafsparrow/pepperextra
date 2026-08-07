import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';
import type { Customer } from '@/feature/customer/types';

type PosHeaderProps = {
  customer: Customer | null;
  onBack: () => void;
  onSearchCustomer: () => void;
  onScanCustomer: () => void;
  onMore: () => void;
};

type HeaderButtonProps = {
  icon: string;
  accessibilityLabel: string;
  onPress: () => void;
};

function HeaderButton({ icon, accessibilityLabel, onPress }: HeaderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={styles.icon}>
        {icon}
      </ThemedText>
    </Pressable>
  );
}

export function PosHeader({ customer, onBack, onSearchCustomer, onScanCustomer, onMore }: PosHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <ThemedText style={styles.backGlyph}>←</ThemedText>
      </Pressable>

      <View style={styles.titles}>
        <ThemedText style={styles.title}>New Quotation</ThemedText>
        {customer ? (
          <ThemedText type="small" style={styles.customerName}>
            {customer.name}
          </ThemedText>
        ) : (
          <ThemedText type="small" style={styles.customerHint}>
            Select a customer
          </ThemedText>
        )}
      </View>

      <View style={styles.trailing}>
        <HeaderButton icon="👤" accessibilityLabel="Search customer" onPress={onSearchCustomer} />
        <HeaderButton icon="📷" accessibilityLabel="Scan customer card" onPress={onScanCustomer} />
        <HeaderButton icon="⋮" accessibilityLabel="More options" onPress={onMore} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  titles: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: 700,
  },
  customerName: {
    color: Tokens.primary,
    fontWeight: 600,
  },
  customerHint: {
    color: Tokens.muted,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  icon: {
    fontSize: 16,
  },
  backGlyph: {
    fontSize: 20,
    lineHeight: 24,
    color: Tokens.foreground,
  },
  pressed: {
    opacity: 0.7,
  },
});

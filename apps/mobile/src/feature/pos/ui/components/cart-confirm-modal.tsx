import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';
import { ALTERNATIVE_COLOR_HEX } from '@/feature/pos/constants/alternatives';
import { resolveCartLines } from '@/feature/pos/store/cart-store';
import type { CartLine, CartResolveMode } from '@/feature/pos/types';
import { DEFAULT_CURRENCY, applyTax, formatMinorUnits } from '@/lib/money';

type CartConfirmModalProps = {
  visible: boolean;
  mode: CartResolveMode;
  lines: CartLine[];
  onClose: () => void;
};

function titleForMode(mode: CartResolveMode): string {
  return mode === 'selected' ? 'Confirm quotation' : `${mode[0].toUpperCase()}${mode.slice(1)} alternative`;
}

export function CartConfirmModal({ visible, mode, lines, onClose }: CartConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const resolved = resolveCartLines(lines, mode);
  const subtotal = resolved.reduce((sum, l) => sum + l.unitPriceMinor * l.quantity, 0);
  const tax = applyTax(subtotal);

  const confirm = () => {
    onClose();
    Alert.alert(
      'Draft quotation ready',
      'Contracts + alternative-brand pricing land here.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}
          onPress={() => {}}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>{titleForMode(mode)}</ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold">✕</ThemedText>
            </Pressable>
          </View>

          {mode !== 'selected' ? (
            <View style={[styles.modeBar, { borderLeftColor: ALTERNATIVE_COLOR_HEX[mode] }]}>
              <ThemedText type="small" style={styles.modeText}>
                Applying the {mode} alternative to every line that has one.
              </ThemedText>
            </View>
          ) : null}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {resolved.map((line) => (
              <View key={line.product.id} style={styles.item}>
                <View style={styles.itemBody}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {line.product.name}
                  </ThemedText>
                  <ThemedText type="small" style={styles.itemMeta}>
                    {line.product.sku} · {line.quantity} × {formatMinorUnits(line.unitPriceMinor, DEFAULT_CURRENCY)}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.itemTotal}>
                  {formatMinorUnits(line.unitPriceMinor * line.quantity, DEFAULT_CURRENCY)}
                </ThemedText>
              </View>
            ))}
          </ScrollView>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <ThemedText type="small" style={styles.muted}>Subtotal</ThemedText>
              <ThemedText type="smallBold">{formatMinorUnits(subtotal, DEFAULT_CURRENCY)}</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText type="small" style={styles.muted}>VAT (5%)</ThemedText>
              <ThemedText type="smallBold">{formatMinorUnits(tax, DEFAULT_CURRENCY)}</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText>Total</ThemedText>
              <ThemedText>{formatMinorUnits(subtotal + tax, DEFAULT_CURRENCY)}</ThemedText>
            </View>
          </View>

          <Pressable
            onPress={confirm}
            style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
            <ThemedText style={styles.confirmLabel}>Confirm quotation</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: Tokens.card,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 700,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.background,
  },
  modeBar: {
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  modeText: {
    color: Tokens.foregroundSecondary,
  },
  list: {
    flexGrow: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Tokens.border,
  },
  itemBody: {
    flex: 1,
    gap: Spacing.half,
  },
  itemMeta: {
    color: Tokens.foregroundSecondary,
  },
  itemTotal: {
    minWidth: 70,
    textAlign: 'right',
  },
  totals: {
    gap: Spacing.one,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muted: {
    color: Tokens.muted,
  },
  confirmButton: {
    backgroundColor: Tokens.primary,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  confirmLabel: {
    color: Tokens.primaryForeground,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});

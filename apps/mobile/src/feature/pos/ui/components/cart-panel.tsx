import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Spacing, Tokens } from '@/constants/theme';
import { changeCartLineQty, clearCart, useCart } from '@/feature/pos/store/cart-store';
import { DEFAULT_CURRENCY, formatMinorUnits } from '@/lib/money';

type CartPanelProps = {
  canSeeCosts: boolean;
  onConfirm: () => void;
};

export function CartPanel({ canSeeCosts, onConfirm }: CartPanelProps) {
  const { lines, subtotal } = useCart();

  const costTotal = canSeeCosts
    ? lines.reduce((sum, l) => sum + (l.product.costPriceMinor ?? 0) * l.quantity, 0)
    : null;

  if (lines.length === 0) {
    return <EmptyState title="Cart is empty." message="Add products from the catalog to start a quotation." />;
  }

  return (
    <View>
      {lines.map((line) => {
        const overridden = line.unitPriceMinor !== line.product.salePriceMinor;
        return (
          <View key={line.product.id} style={styles.line}>
            <View style={styles.lineInfo}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {line.product.name}
              </ThemedText>
              <View style={styles.priceRow}>
                <ThemedText type="small" style={styles.muted}>
                  {formatMinorUnits(line.unitPriceMinor, DEFAULT_CURRENCY)} each
                </ThemedText>
                {overridden ? (
                  <ThemedText type="small" style={styles.listPrice}>
                    {formatMinorUnits(line.product.salePriceMinor, DEFAULT_CURRENCY)}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            <View style={styles.qtyControl}>
              <Pressable
                onPress={() => changeCartLineQty(line.product.id, -1)}
                style={({ pressed }) => [styles.qtyButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold">−</ThemedText>
              </Pressable>
              <ThemedText type="smallBold" style={styles.qtyValue}>
                {line.quantity}
              </ThemedText>
              <Pressable
                onPress={() => changeCartLineQty(line.product.id, 1)}
                style={({ pressed }) => [styles.qtyButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold">+</ThemedText>
              </Pressable>
            </View>
            <ThemedText type="smallBold" style={styles.lineTotal}>
              {formatMinorUnits(line.unitPriceMinor * line.quantity, DEFAULT_CURRENCY)}
            </ThemedText>
          </View>
        );
      })}

      <View style={styles.totalRow}>
        <ThemedText type="small" style={styles.muted}>
          Subtotal
        </ThemedText>
        <ThemedText>{formatMinorUnits(subtotal, DEFAULT_CURRENCY)}</ThemedText>
      </View>
      {costTotal != null ? (
        <View style={styles.totalRow}>
          <ThemedText type="small" style={styles.muted}>
            Cost (staff only)
          </ThemedText>
          <ThemedText>{formatMinorUnits(costTotal, DEFAULT_CURRENCY)}</ThemedText>
        </View>
      ) : null}

      <Pressable
        onPress={onConfirm}
        style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
        <ThemedText style={styles.confirmLabel}>Confirm quotation</ThemedText>
      </Pressable>
      <Pressable onPress={clearCart} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
        <ThemedText type="small" style={styles.clearLabel}>
          Clear cart
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Tokens.border,
  },
  lineInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  listPrice: {
    color: Tokens.muted,
    textDecorationLine: 'line-through',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Tokens.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
  },
  lineTotal: {
    minWidth: 70,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  muted: {
    color: Tokens.muted,
  },
  confirmButton: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    backgroundColor: Tokens.primary,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  confirmLabel: {
    color: Tokens.primaryForeground,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  clearLabel: {
    color: Tokens.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});

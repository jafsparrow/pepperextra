import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Spacing, Tokens } from '@/constants/theme';
import {
  ALTERNATIVE_COLOR_HEX,
  ALTERNATIVE_COLOR_TINT,
  ALTERNATIVE_COLORS,
  MAX_ALTERNATIVES_PER_ITEM,
  type AlternativeColor,
} from '@/feature/pos/constants/alternatives';
import {
  addAlternative,
  alterCart,
  changeCartLineQty,
  clearCart,
  removeAlternative,
  setLineSelection,
  useCart,
} from '@/feature/pos/store/cart-store';
import type { CartLine, CartResolveMode, PosProduct } from '@/feature/pos/types';
import { DEFAULT_CURRENCY, applyTax, formatMinorUnits } from '@/lib/money';
import { AlternativePickerModal } from '@/feature/pos/ui/components/alternative-picker-modal';
import { CartConfirmModal } from '@/feature/pos/ui/components/cart-confirm-modal';

type CartPanelProps = {
  canSeeCosts: boolean;
};

type RadioDotProps = {
  selected: boolean;
  color: string;
  onPress: () => void;
};

function RadioDot({ selected, color, onPress }: RadioDotProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.radio, pressed && styles.pressed]}>
      <View style={[styles.radioOuter, { borderColor: color }, selected && { borderColor: Tokens.primary }]}>
        {selected ? <View style={[styles.radioInner, { backgroundColor: Tokens.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

function priceSourceLabel(product: PosProduct): string {
  if (product.priceSource === 'priceList') return 'price list';
  if (product.priceSource === 'location') return 'loc price';
  return 'base price';
}

function PriceSourceBadge({ product }: { product: PosProduct }) {
  if (product.priceSource !== 'priceList' && product.priceSource !== 'location') return null;
  return (
    <ThemedText type="small" style={styles.priceSource}>
      {priceSourceLabel(product)}
    </ThemedText>
  );
}

function CartLineGroup({ line }: { line: CartLine }) {
  const addedIds = new Set(line.alternatives.map((a) => a.product.id));
  const available = line.product.alternatives ?? [];
  const slotsFree = Math.max(0, MAX_ALTERNATIVES_PER_ITEM - line.alternatives.length);
  const canAddMore = slotsFree > 0 && available.some((a) => !addedIds.has(a.id));
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={styles.group}>
      <View style={[styles.row, styles.baseRow]}>
        <RadioDot
          selected={line.selectedAlternativeId == null}
          color={Tokens.primary}
          onPress={() => setLineSelection(line.product.id, null)}
        />
        <View style={styles.lineInfo}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {line.product.name}
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText type="small" style={styles.muted}>
              {formatMinorUnits(line.unitPriceMinor, DEFAULT_CURRENCY)} each
            </ThemedText>
            <PriceSourceBadge product={line.product} />
            {line.unitPriceMinor !== line.product.salePriceMinor ? (
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

      {line.alternatives.map((alt) => {
        const selected = line.selectedAlternativeId === alt.product.id;
        const isDefault = alt.product.id === line.product.defaultAlternativeId;
        return (
          <View
            key={alt.color}
            style={[styles.row, styles.altRow, { backgroundColor: ALTERNATIVE_COLOR_TINT[alt.color] }]}>
            <RadioDot
              selected={selected}
              color={ALTERNATIVE_COLOR_HEX[alt.color]}
              onPress={() => setLineSelection(line.product.id, alt.product.id)}
            />
            <View style={styles.lineInfo}>
              <View style={styles.altTitleRow}>
                <View style={[styles.swatch, { backgroundColor: ALTERNATIVE_COLOR_HEX[alt.color] }]} />
                <ThemedText type="smallBold" numberOfLines={1} style={styles.altName}>
                  {alt.product.name}
                </ThemedText>
                {isDefault ? (
                  <ThemedText type="small" style={styles.defaultBadge}>
                    default
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText type="small" style={styles.muted}>
                {formatMinorUnits(alt.unitPriceMinor, DEFAULT_CURRENCY)} each
              </ThemedText>
            </View>
            <Pressable
              onPress={() => removeAlternative(line.product.id, alt.color)}
              accessibilityLabel={`Remove ${alt.color} alternative`}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
              <ThemedText type="small" style={styles.muted}>
                ✕
              </ThemedText>
            </Pressable>
            <ThemedText type="smallBold" style={styles.lineTotal}>
              {formatMinorUnits(alt.unitPriceMinor * line.quantity, DEFAULT_CURRENCY)}
            </ThemedText>
          </View>
        );
      })}

      {canAddMore ? (
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [styles.addAltButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.addAltLabel}>
            + Alt · {slotsFree} slot{slotsFree === 1 ? '' : 's'} left
          </ThemedText>
        </Pressable>
      ) : null}

      <AlternativePickerModal
        visible={pickerVisible}
        line={line}
        onClose={() => setPickerVisible(false)}
        onSelect={(productId) => {
          addAlternative(line.product.id, productId);
          setPickerVisible(false);
        }}
      />
    </View>
  );
}

export function CartPanel({ canSeeCosts }: CartPanelProps) {
  const { lines, subtotal, colorTotals, tax, total, hasAlternatives } = useCart();
  const [confirmMode, setConfirmMode] = useState<CartResolveMode | null>(null);

  const costTotal = canSeeCosts
    ? lines.reduce((sum, l) => sum + (l.product.costPriceMinor ?? 0) * l.quantity, 0)
    : null;

  const canAlter = lines.some((line) => {
    if (line.alternatives.length >= MAX_ALTERNATIVES_PER_ITEM) return false;
    const added = new Set(line.alternatives.map((a) => a.product.id));
    return (line.product.alternatives ?? []).some((a) => !added.has(a.id));
  });

  const presentColors: AlternativeColor[] = ALTERNATIVE_COLORS.filter((color) =>
    lines.some((l) => l.alternatives.some((a) => a.color === color))
  );

  if (lines.length === 0) {
    return <EmptyState title="Cart is empty." message="Add products from the catalog to start a quotation." />;
  }

  return (
    <View>
      {hasAlternatives || canAlter ? (
        <Pressable
          onPress={alterCart}
          style={({ pressed }) => [styles.alterButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.alterLabel}>
            Alter
          </ThemedText>
        </Pressable>
      ) : null}

      {lines.map((line) => (
        <CartLineGroup key={line.product.id} line={line} />
      ))}

      <View style={styles.summaryCard}>
        <ThemedText type="smallBold" style={styles.summaryTitle}>
          Current selection
        </ThemedText>
        <View style={styles.totalRow}>
          <ThemedText type="small" style={styles.muted}>
            Subtotal
          </ThemedText>
          <ThemedText type="smallBold">{formatMinorUnits(subtotal, DEFAULT_CURRENCY)}</ThemedText>
        </View>
        <View style={styles.totalRow}>
          <ThemedText type="small" style={styles.muted}>
            VAT (5%)
          </ThemedText>
          <ThemedText type="smallBold">{formatMinorUnits(tax, DEFAULT_CURRENCY)}</ThemedText>
        </View>
        <View style={styles.totalRow}>
          <ThemedText>Total</ThemedText>
          <ThemedText>{formatMinorUnits(total, DEFAULT_CURRENCY)}</ThemedText>
        </View>
        {costTotal != null ? (
          <View style={styles.totalRow}>
            <ThemedText type="small" style={styles.muted}>
              Cost (staff only)
            </ThemedText>
            <ThemedText type="smallBold">{formatMinorUnits(costTotal, DEFAULT_CURRENCY)}</ThemedText>
          </View>
        ) : null}
        <Pressable
          onPress={() => setConfirmMode('selected')}
          style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
          <ThemedText style={styles.confirmLabel}>Confirm quotation</ThemedText>
        </Pressable>
      </View>

      {presentColors.map((color) => {
        const subtotalColor = colorTotals[color];
        const taxColor = applyTax(subtotalColor);
        return (
          <Pressable
            key={color}
            onPress={() => setConfirmMode(color)}
            style={({ pressed }) => [
              styles.colourCard,
              { borderLeftColor: ALTERNATIVE_COLOR_HEX[color] },
              pressed && styles.pressed,
            ]}>
            <View style={styles.colourCardHeader}>
              <View style={[styles.swatch, { backgroundColor: ALTERNATIVE_COLOR_HEX[color] }]} />
              <ThemedText type="smallBold" style={styles.colourCardTitle}>
                {color[0].toUpperCase()}
                {color.slice(1)} alternative
              </ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText type="small" style={styles.muted}>
                Subtotal
              </ThemedText>
              <ThemedText type="smallBold">{formatMinorUnits(subtotalColor, DEFAULT_CURRENCY)}</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText type="small" style={styles.muted}>
                VAT (5%)
              </ThemedText>
              <ThemedText type="smallBold">{formatMinorUnits(taxColor, DEFAULT_CURRENCY)}</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText type="smallBold">Total</ThemedText>
              <ThemedText type="smallBold">{formatMinorUnits(subtotalColor + taxColor, DEFAULT_CURRENCY)}</ThemedText>
            </View>
          </Pressable>
        );
      })}

      <Pressable onPress={clearCart} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
        <ThemedText type="small" style={styles.clearLabel}>
          Clear cart
        </ThemedText>
      </Pressable>

      <CartConfirmModal
        visible={confirmMode != null}
        mode={confirmMode ?? 'selected'}
        lines={lines}
        onClose={() => setConfirmMode(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Tokens.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  baseRow: {},
  altRow: {
    paddingLeft: Spacing.four,
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
  altTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  altName: {
    flexShrink: 1,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  defaultBadge: {
    color: Tokens.primary,
  },
  priceSource: {
    color: Tokens.steel,
  },
  listPrice: {
    color: Tokens.muted,
    textDecorationLine: 'line-through',
  },
  radio: {
    padding: Spacing.half,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  removeButton: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.one,
  },
  lineTotal: {
    minWidth: 70,
    textAlign: 'right',
  },
  addAltButton: {
    marginLeft: Spacing.four,
    marginRight: Spacing.three,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.one,
    alignItems: 'center',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Tokens.primary,
  },
  addAltLabel: {
    color: Tokens.primary,
  },
  alterButton: {
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Tokens.primary,
  },
  alterLabel: {
    color: Tokens.primary,
  },
  summaryCard: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    padding: Spacing.three,
    backgroundColor: Tokens.card,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Tokens.border,
    gap: Spacing.one,
  },
  summaryTitle: {
    color: Tokens.foregroundSecondary,
    marginBottom: Spacing.one,
  },
  colourCard: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.three,
    backgroundColor: Tokens.card,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderLeftWidth: 4,
    gap: Spacing.one,
  },
  colourCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  colourCardTitle: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muted: {
    color: Tokens.muted,
  },
  confirmButton: {
    marginTop: Spacing.two,
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

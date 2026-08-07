import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';
import { DEFAULT_CURRENCY, formatMinorUnits } from '@/lib/money';
import type { PosProduct } from '@/feature/pos/types';

type QuantitySheetProps = {
  visible: boolean;
  product: PosProduct | null;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
};

const QUICK_AMOUNTS = [1, 5, 10] as const;
const MAX_QUANTITY = 999;

function parseQuantity(value: string): number {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(n, MAX_QUANTITY);
}

export function QuantitySheet({ visible, product, onClose, onConfirm }: QuantitySheetProps) {
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState('1');

  const qty = parseQuantity(quantity);
  const canConfirm = qty > 0;

  const confirm = () => {
    if (!canConfirm || !product) return;
    onConfirm(qty);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={() => setQuantity('1')}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}
          onPress={() => {}}>
          <View style={styles.header}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {product?.name ?? 'Select quantity'}
            </ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold">✕</ThemedText>
            </Pressable>
          </View>

          {product ? (
            <View style={styles.preview}>
              <ThemedText type="small" style={styles.previewLine}>
                {qty} × {formatMinorUnits(product.salePriceMinor, DEFAULT_CURRENCY)}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.previewTotal}>
                = {formatMinorUnits(product.salePriceMinor * qty, DEFAULT_CURRENCY)}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.chips}>
            {QUICK_AMOUNTS.map((amount) => {
              const selected = qty === amount;
              return (
                <Pressable
                  key={amount}
                  onPress={() => setQuantity(String(amount))}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={selected && styles.chipLabelSelected}>
                    {amount}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
            autoFocus
            placeholder="Quantity"
            placeholderTextColor={Tokens.muted}
            style={styles.input}
          />

          <Pressable
            onPress={confirm}
            disabled={!canConfirm}
            style={({ pressed }) => [
              styles.confirmButton,
              !canConfirm && styles.confirmButtonDisabled,
              pressed && canConfirm && styles.pressed,
            ]}>
            <ThemedText style={styles.confirmLabel}>Add {qty} to cart</ThemedText>
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
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  previewLine: {
    color: Tokens.foregroundSecondary,
  },
  previewTotal: {
    color: Tokens.primary,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: Tokens.background,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  chipSelected: {
    backgroundColor: Tokens.primary,
    borderColor: Tokens.primary,
  },
  chipLabelSelected: {
    color: Tokens.primaryForeground,
  },
  input: {
    backgroundColor: Tokens.background,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: Tokens.foreground,
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: Tokens.primary,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmLabel: {
    color: Tokens.primaryForeground,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});

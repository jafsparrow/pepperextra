import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Spacing, Tokens } from '@/constants/theme';
import {
  MAX_ALTERNATIVES_PER_ITEM,
} from '@/feature/pos/constants/alternatives';
import type { CartLine } from '@/feature/pos/types';
import { DEFAULT_CURRENCY, formatMinorUnits } from '@/lib/money';

type AlternativePickerModalProps = {
  visible: boolean;
  line: CartLine | null;
  onClose: () => void;
  onSelect: (productId: string) => void;
};

export function AlternativePickerModal({ visible, line, onClose, onSelect }: AlternativePickerModalProps) {
  const insets = useSafeAreaInsets();
  const alternatives = line?.product.alternatives ?? [];
  const slotsUsed = line?.alternatives.length ?? 0;
  const slotsFree = Math.max(0, MAX_ALTERNATIVES_PER_ITEM - slotsUsed);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}
          onPress={() => {}}>
          <View style={styles.header}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {line?.product.name ?? ''}
            </ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold">✕</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="small" style={styles.subtitle}>
            Pick an alternative brand · {slotsUsed} of {MAX_ALTERNATIVES_PER_ITEM} slots used
          </ThemedText>

          {alternatives.length === 0 ? (
            <EmptyState title="No alternatives for this item." message="Check the product group setup." />
          ) : (
            alternatives.map((alt) => {
              const added = line?.alternatives.some((a) => a.product.id === alt.id) ?? false;
              const isDefault = alt.id === line?.product.defaultAlternativeId;
              const disabled = added || slotsFree === 0;
              return (
                <Pressable
                  key={alt.id}
                  disabled={disabled}
                  onPress={() => onSelect(alt.id)}
                  style={({ pressed }) => [
                    styles.item,
                    added && styles.itemAdded,
                    disabled && styles.itemDisabled,
                    pressed && !disabled && styles.pressed,
                  ]}>
                  <View style={styles.itemBody}>
                    <View style={styles.itemTitleRow}>
                      <View style={[styles.swatch, { backgroundColor: Tokens.primary }]} />
                      <ThemedText type="smallBold" numberOfLines={1} style={styles.itemName}>
                        {alt.name}
                      </ThemedText>
                      {isDefault ? (
                        <ThemedText type="small" style={styles.defaultBadge}>
                          default
                        </ThemedText>
                      ) : null}
                    </View>
                    <ThemedText type="small" style={styles.itemMeta}>
                      {alt.sku} · {formatMinorUnits(alt.salePriceMinor, DEFAULT_CURRENCY)} each
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={added ? styles.addedLabel : styles.addLabel}>
                    {added ? 'Added' : slotsFree === 0 ? 'Full' : '+ Alt'}
                  </ThemedText>
                </Pressable>
              );
            })
          )}
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
  subtitle: {
    color: Tokens.muted,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: Tokens.background,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  itemAdded: {
    backgroundColor: '#e7e0d6',
    borderColor: Tokens.border,
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemBody: {
    flex: 1,
    gap: Spacing.half,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemName: {
    flex: 1,
  },
  itemMeta: {
    color: Tokens.foregroundSecondary,
  },
  defaultBadge: {
    color: Tokens.primary,
  },
  addLabel: {
    color: Tokens.primary,
  },
  addedLabel: {
    color: Tokens.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});

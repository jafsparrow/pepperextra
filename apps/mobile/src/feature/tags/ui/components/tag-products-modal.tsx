import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SearchField } from '@/components/ui/search-field';
import { Spacing, Tokens } from '@/constants/theme';
import type { ProductTag, TaggedProduct } from '@/feature/tags/types';
import { formatMinorUnits } from '@/lib/money';
import { useTheme } from '@/hooks/use-theme';

type TagProductsModalProps = {
  tag: ProductTag;
  isPinned: boolean;
  canSeeCosts: boolean;
  onTogglePin: () => void;
  onAddToQuote: (product: TaggedProduct) => void;
  onClose: () => void;
};

export function TagProductsModal({
  tag,
  isPinned,
  canSeeCosts,
  onTogglePin,
  onAddToQuote,
  onClose,
}: TagProductsModalProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tag.products;
    return tag.products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [tag.products, query]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.background }]} onPress={() => {}}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>{tag.name}</ThemedText>
            <Pressable
              onPress={onTogglePin}
              style={({ pressed }) => [styles.pinButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={isPinned ? styles.pinned : styles.unpinned}>
                {isPinned ? '★ Pinned' : '☆ Pin'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.search}>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search products" />
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {products.length === 0 ? (
              <ThemedText type="small" style={styles.empty}>
                No products match “{query}”.
              </ThemedText>
            ) : (
              products.map((product) => (
                <View key={product.id} style={styles.productRow}>
                  <View style={styles.productBody}>
                    <ThemedText type="smallBold">{product.name}</ThemedText>
                    <ThemedText type="small" style={styles.meta}>
                      {product.sku}
                      {product.unit ? ` · per ${product.unit}` : ''} · Stock {product.stock}
                    </ThemedText>
                    {canSeeCosts && product.costPriceMinor != null ? (
                      <ThemedText type="small" style={styles.cost}>
                        Cost {formatMinorUnits(product.costPriceMinor)}
                        {product.costUpdatedAt ? ` · updated ${product.costUpdatedAt.slice(0, 10)}` : ''}
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.productTrailing}>
                    <ThemedText type="smallBold" style={styles.price}>
                      {formatMinorUnits(product.salePriceMinor)}
                    </ThemedText>
                    <Pressable
                      onPress={() => onAddToQuote(product)}
                      style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                      <ThemedText type="small" style={styles.addLabel}>
                        Add to quote
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
  },
  pinButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  pinned: {
    color: Tokens.primary,
  },
  unpinned: {
    color: Tokens.foregroundSecondary,
  },
  search: {
    paddingBottom: Spacing.three,
  },
  list: {
    flexGrow: 0,
  },
  empty: {
    textAlign: 'center',
    color: Tokens.muted,
    paddingVertical: Spacing.four,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Tokens.border,
  },
  productBody: {
    flex: 1,
    gap: Spacing.half,
  },
  meta: {
    color: Tokens.foregroundSecondary,
  },
  cost: {
    color: Tokens.steel,
  },
  productTrailing: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  price: {
    color: Tokens.primary,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: Tokens.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  addLabel: {
    color: Tokens.primaryForeground,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.7,
  },
});

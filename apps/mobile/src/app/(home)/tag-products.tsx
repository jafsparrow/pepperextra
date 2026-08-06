import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { SearchField } from '@/components/ui/search-field';
import { Spacing, Tokens } from '@/constants/theme';
import { useRole } from '@/feature/roles/hooks/use-role';
import { findMockTag } from '@/feature/tags/constants/mock-tags';
import { togglePinnedTag, usePinnedTagIds } from '@/feature/tags/store/use-pinned-tags';
import { useTheme } from '@/hooks/use-theme';
import { formatMinorUnits } from '@/lib/money';

export default function TagProductsRoute() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [query, setQuery] = useState('');
  const { canSeeCosts } = useRole();
  const pinnedTagIds = usePinnedTagIds();

  const tag = id ? findMockTag(id) : undefined;
  const isPinned = tag ? pinnedTagIds.includes(tag.id) : false;

  const products = useMemo(() => {
    if (!tag) return [];
    const q = query.trim().toLowerCase();
    if (!q) return tag.products;
    return tag.products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [tag, query]);

  if (!tag) return null;

  const close = () => router.back();

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.three }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{tag.name}</ThemedText>
          <Pressable
            onPress={() => togglePinnedTag(tag.id)}
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
                    onPress={() => router.push('/pos')}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28,25,23,0.35)',
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

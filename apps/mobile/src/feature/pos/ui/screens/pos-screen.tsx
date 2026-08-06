import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { Section } from '@/components/ui/section';
import { Spacing, Tokens } from '@/constants/theme';
import { MOCK_TAGS } from '@/feature/tags/constants/mock-tags';
import type { TaggedProduct } from '@/feature/tags/types';
import { useRole } from '@/feature/roles/hooks/use-role';
import { DEFAULT_CURRENCY, formatMinorUnits } from '@/lib/money';

interface CartLine {
  product: TaggedProduct
  quantity: number
}

const ALL_PRODUCTS = MOCK_TAGS.flatMap((tag) => tag.products)

/**
 * PLACEHOLDER — POS / quotation creation. Primary differentiator (BRD §8.1).
 * Full flow: customer + price-list selection, alternative-brand pricing,
 * margin bottom sheet, multi-confirm, PDF + WhatsApp share.
 */
export function PosScreen() {
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const { canSeeCosts } = useRole();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  const subtotal = cart.reduce((sum, line) => sum + line.product.salePriceMinor * line.quantity, 0);
  const costTotal = canSeeCosts
    ? cart.reduce((sum, line) => sum + (line.product.costPriceMinor ?? 0) * line.quantity, 0)
    : null;

  const addToCart = (product: TaggedProduct) => {
    setCart((lines) => {
      const existing = lines.find((l) => l.product.id === product.id);
      if (existing) {
        return lines.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...lines, { product, quantity: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((lines) =>
      lines
        .map((l) => (l.product.id === id ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const confirm = () => {
    if (cart.length === 0) return;
    Alert.alert('Draft quotation ready', 'Contracts + alternative-brand pricing land here.', [{ text: 'OK' }]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Find a product">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or SKU"
            placeholderTextColor={Tokens.muted}
            style={styles.search}
            autoCorrect={false}
          />
          <View style={styles.results}>
            {query.trim() === '' ? (
              <ThemedText type="small" style={styles.hint}>
                Start typing to search the catalog.
              </ThemedText>
            ) : results.length === 0 ? (
              <EmptyState title="No products found." message="Try a different search." />
            ) : (
              results.map((product) => (
                <ListItem
                  key={product.id}
                  title={product.name}
                  subtitle={`${product.sku} · stock ${product.stock}`}
                  trailing={
                    <View style={styles.productAction}>
                      <ThemedText type="smallBold">{formatMinorUnits(product.salePriceMinor, DEFAULT_CURRENCY)}</ThemedText>
                      <Pressable onPress={() => addToCart(product)} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                        <ThemedText type="smallBold" style={styles.addButtonLabel}>Add</ThemedText>
                      </Pressable>
                    </View>
                  }
                />
              ))
            )}
          </View>
        </Section>

        <Section title="Cart">
          {cart.length === 0 ? (
            <EmptyState title="Cart is empty." message="Add products from the search above." />
          ) : (
            <View>
              {cart.map((line) => (
                <View key={line.product.id} style={styles.cartLine}>
                  <View style={styles.cartInfo}>
                    <ThemedText>{line.product.name}</ThemedText>
                    <ThemedText type="small" style={styles.mutedText}>
                      {formatMinorUnits(line.product.salePriceMinor, DEFAULT_CURRENCY)} each
                    </ThemedText>
                  </View>
                  <View style={styles.qtyControl}>
                    <Pressable onPress={() => changeQty(line.product.id, -1)} style={({ pressed }) => [styles.qtyButton, pressed && styles.pressed]}>
                      <ThemedText type="smallBold">−</ThemedText>
                    </Pressable>
                    <ThemedText type="smallBold" style={styles.qtyValue}>{line.quantity}</ThemedText>
                    <Pressable onPress={() => changeQty(line.product.id, 1)} style={({ pressed }) => [styles.qtyButton, pressed && styles.pressed]}>
                      <ThemedText type="smallBold">+</ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText type="smallBold" style={styles.lineTotal}>
                    {formatMinorUnits(line.product.salePriceMinor * line.quantity, DEFAULT_CURRENCY)}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.totalRow}>
                <ThemedText type="small" style={styles.mutedText}>Subtotal</ThemedText>
                <ThemedText>{formatMinorUnits(subtotal, DEFAULT_CURRENCY)}</ThemedText>
              </View>
              {costTotal != null ? (
                <View style={styles.totalRow}>
                  <ThemedText type="small" style={styles.mutedText}>Cost (staff only)</ThemedText>
                  <ThemedText>{formatMinorUnits(costTotal, DEFAULT_CURRENCY)}</ThemedText>
                </View>
              ) : null}
              <Pressable onPress={confirm} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
                <ThemedText style={styles.confirmLabel}>Confirm quotation</ThemedText>
              </Pressable>
            </View>
          )}
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  search: {
    backgroundColor: Tokens.background,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    color: Tokens.foreground,
    fontSize: 16,
  },
  results: {
    marginTop: Spacing.two,
  },
  hint: {
    color: Tokens.muted,
  },
  productAction: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  addButton: {
    backgroundColor: Tokens.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  addButtonLabel: {
    color: Tokens.primaryForeground,
  },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Tokens.border,
  },
  cartInfo: {
    flex: 1,
    gap: Spacing.half,
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
  mutedText: {
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
  pressed: {
    opacity: 0.7,
  },
});

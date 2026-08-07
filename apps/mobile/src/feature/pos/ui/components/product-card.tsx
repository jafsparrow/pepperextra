import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';
import { DEFAULT_CURRENCY, formatMinorUnits } from '@/lib/money';
import type { PosProduct } from '@/feature/pos/types';

type ProductCardProps = {
  product: PosProduct;
  hideImages: boolean;
  showStock: boolean;
  onAdd: (product: PosProduct) => void;
  onOpenQuantity: (product: PosProduct) => void;
};

function productInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export function ProductCard({ product, hideImages, showStock, onAdd, onOpenQuantity }: ProductCardProps) {
  return (
    <View style={styles.card}>
      {!hideImages ? (
        product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <ThemedText type="smallBold" style={styles.thumbText}>
              {productInitials(product.name)}
            </ThemedText>
          </View>
        )
      ) : null}

      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" style={styles.meta}>
          {product.sku}
          {product.unit ? ` · per ${product.unit}` : ''}
        </ThemedText>
        {showStock ? (
          product.stock > 0 ? (
            <ThemedText type="small" style={styles.stock}>
              In stock: {product.stock}
            </ThemedText>
          ) : (
            <ThemedText type="small" style={styles.stockEmpty}>
              Out of stock
            </ThemedText>
          )
        ) : null}
      </View>

      <View style={styles.trailing}>
        <ThemedText type="smallBold" style={styles.price}>
          {formatMinorUnits(product.salePriceMinor, DEFAULT_CURRENCY)}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable
            onPress={() => onOpenQuantity(product)}
            accessibilityLabel={`Enter quantity for ${product.name}`}
            style={({ pressed }) => [styles.qtyButton, pressed && styles.pressed]}>
            <ThemedText type="small" style={styles.qtyGlyph}>
              🔢
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => onAdd(product)}
            accessibilityLabel={`Add one ${product.name}`}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.addLabel}>
              +
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: Tokens.card,
    borderRadius: Spacing.three,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Spacing.two,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.border,
  },
  thumbText: {
    color: Tokens.foregroundSecondary,
    fontSize: 16,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  meta: {
    color: Tokens.foregroundSecondary,
  },
  stock: {
    color: Tokens.success,
  },
  stockEmpty: {
    color: Tokens.danger,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  price: {
    color: Tokens.primary,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  qtyButton: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.background,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  qtyGlyph: {
    fontSize: 15,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.primary,
  },
  addLabel: {
    color: Tokens.primaryForeground,
    fontSize: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});

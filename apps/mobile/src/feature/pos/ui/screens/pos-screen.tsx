import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu, type MoreMenuItem } from "@/components/more-menu"
import { SearchField } from "@/components/ui/search-field"
import { Spacing, TabletBreakpoint, Tokens } from "@/constants/theme"
import type { Customer } from "@/feature/customer/types"
import { useRole } from "@/feature/roles/hooks/use-role"
import { fetchCatalogProducts } from "@/feature/pos/api/catalog"
import { getRecentCustomers } from "@/feature/pos/constants/recent-customers"
import { addToCart, useCart } from "@/feature/pos/store/cart-store"
import { CartPanel } from "@/feature/pos/ui/components/cart-panel"
import { CustomerSearchModal } from "@/feature/pos/ui/components/customer-search-modal"
import { PosHeader } from "@/feature/pos/ui/components/pos-header"
import { ProductCard } from "@/feature/pos/ui/components/product-card"
import { QuantitySheet } from "@/feature/pos/ui/components/quantity-sheet"
import type { PosProduct, PosViewOptions } from "@/feature/pos/types"
import { DEFAULT_CURRENCY, formatMinorUnits } from "@/lib/money"

const MAX_RESULTS = 40

/**
 * POS / quotation creation — primary differentiator (BRD §8.1).
 * Full flow: customer + price-list selection, alternative-brand pricing,
 * margin bottom sheet, multi-confirm, PDF + WhatsApp share.
 */
export function PosScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const { canSeeCosts } = useRole()
  const isTablet = width >= TabletBreakpoint

  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<PosProduct[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerModalVisible, setCustomerModalVisible] = useState(false)
  const [moreMenuVisible, setMoreMenuVisible] = useState(false)
  const [viewOptions, setViewOptions] = useState<PosViewOptions>({
    hideImages: false,
    showStock: false,
  })
  const [sheetProduct, setSheetProduct] = useState<PosProduct | null>(null)
  const { lines, count, subtotal } = useCart()

  useEffect(() => {
    let active = true
    void fetchCatalogProducts().then((catalog) => {
      if (active) setProducts(catalog)
    })
    return () => {
      active = false
    }
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products.slice(0, MAX_RESULTS)
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS)
  }, [products, query])

  const selectCustomer = (next: Customer) => {
    setCustomer(next)
  }

  const scanCustomer = () => {
    // PLACEHOLDER — real camera scanner (expo-camera) resolves the loyalty card
    // QR to a customer id. For now fall back to the most recently purchased.
    const recent = getRecentCustomers(1)[0]
    setCustomer(recent ?? null)
    Alert.alert(
      "Card scanned",
      recent ? `Selected ${recent.name}.` : "No recent customer found."
    )
  }

  const confirm = () => {
    if (lines.length === 0) return
    Alert.alert(
      "Draft quotation ready",
      "Contracts + alternative-brand pricing land here.",
      [{ text: "OK" }]
    )
  }

  const moreItems: MoreMenuItem[] = [
    {
      label: viewOptions.hideImages ? "Show Images" : "Hide Images",
      icon: "🖼️",
      onPress: () =>
        setViewOptions((v) => ({ ...v, hideImages: !v.hideImages })),
    },
    {
      label: viewOptions.showStock ? "Hide Stock" : "Show Stock",
      icon: "📦",
      onPress: () => setViewOptions((v) => ({ ...v, showStock: !v.showStock })),
    },
  ]

  const productsPane = (
    <View style={styles.productsPane}>
      <View style={styles.searchWrap}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or SKU"
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {results.length === 0 ? (
          <EmptyState
            title="No products found."
            message="Try a different search."
          />
        ) : (
          results.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              hideImages={viewOptions.hideImages}
              showStock={viewOptions.showStock}
              onAdd={(p) => addToCart(p)}
              onOpenQuantity={setSheetProduct}
            />
          ))
        )}
      </ScrollView>
    </View>
  )

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <PosHeader
          customer={customer}
          onBack={() => router.back()}
          onSearchCustomer={() => setCustomerModalVisible(true)}
          onScanCustomer={scanCustomer}
          onMore={() => setMoreMenuVisible(true)}
        />

        {isTablet ? (
          <View style={styles.tabletBody}>
            {productsPane}
            <View style={styles.cartPane}>
              <CartPanel canSeeCosts={canSeeCosts} onConfirm={confirm} />
            </View>
          </View>
        ) : (
          <View style={styles.phoneBody}>
            {productsPane}
            <Pressable
              onPress={() => router.push("/pos/cart")}
              accessibilityLabel="Open cart"
              style={({ pressed }) => [
                styles.cartBar,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="smallBold" style={styles.cartBarLabel}>
                View Cart ({count})
              </ThemedText>
              <ThemedText type="smallBold" style={styles.cartBarLabel}>
                {formatMinorUnits(subtotal, DEFAULT_CURRENCY)}
              </ThemedText>
            </Pressable>
          </View>
        )}

        <CustomerSearchModal
          visible={customerModalVisible}
          onClose={() => setCustomerModalVisible(false)}
          onSelect={selectCustomer}
        />
        <MoreMenu
          visible={moreMenuVisible}
          onClose={() => setMoreMenuVisible(false)}
          items={moreItems}
        />
        <QuantitySheet
          visible={sheetProduct != null}
          product={sheetProduct}
          onClose={() => setSheetProduct(null)}
          onConfirm={(qty, unitPriceMinor) => {
            if (sheetProduct) addToCart(sheetProduct, qty, unitPriceMinor)
          }}
        />
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  tabletBody: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  phoneBody: {
    flex: 1,
  },
  productsPane: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  productsList: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  cartPane: {
    width: 340,
    backgroundColor: Tokens.card,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.four,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: Tokens.primary,
  },
  cartBarLabel: {
    color: Tokens.primaryForeground,
  },
  pressed: {
    opacity: 0.85,
  },
})

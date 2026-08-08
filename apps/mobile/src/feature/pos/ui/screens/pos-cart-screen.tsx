import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Section } from '@/components/ui/section';
import { Spacing } from '@/constants/theme';
import { useRole } from '@/feature/roles/hooks/use-role';
import { CartPanel } from '@/feature/pos/ui/components/cart-panel';

/**
 * Cart screen — used in the mobile layout where the cart is a separate route
 * (`/pos/cart`). On tablet the same CartPanel renders as the right-hand pane of
 * the POS screen instead.
 */
export function PosCartScreen() {
  const { canSeeCosts } = useRole();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="Cart">
            <CartPanel canSeeCosts={canSeeCosts} />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
});

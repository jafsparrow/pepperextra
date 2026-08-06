import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { SearchField } from '@/components/ui/search-field';
import { BottomTabInset, Spacing, Tokens } from '@/constants/theme';
import { MOCK_CUSTOMERS } from '@/feature/customer/constants/mock-customers';
import { TRADE_TYPE_LABELS, type Customer } from '@/feature/customer/types';
import { useNetworkStatus } from '@/hooks/use-network-status';

type Filter = 'all' | 'account' | 'contractor' | 'tradesperson'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'account', label: 'Account' },
  { key: 'contractor', label: 'Contractor' },
  { key: 'tradesperson', label: 'Tradesperson' },
]

export function CustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_CUSTOMERS.filter((customer) => {
      if (filter === 'account' && customer.type !== 'account') return false;
      if (filter === 'contractor' && customer.type !== 'contractor') return false;
      if (filter === 'tradesperson' && !customer.tradeType) return false;
      if (!q) return true;
      return (
        customer.name.toLowerCase().includes(q) ||
        (customer.phone ?? '').toLowerCase().includes(q) ||
        (customer.email ?? '').toLowerCase().includes(q) ||
        customer.id.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      const aTime = a.lastPurchaseAt ? new Date(a.lastPurchaseAt).getTime() : 0;
      const bTime = b.lastPurchaseAt ? new Date(b.lastPurchaseAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [query, filter]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Customers" />

        {isOffline ? (
          <ThemedText type="small" style={styles.offlineNote}>
            Offline — showing cached customers.
          </ThemedText>
        ) : null}

        <SearchField value={query} onChangeText={setQuery} placeholder="Search name, phone, email" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(({ key, label }) => {
            const selected = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={({ pressed }) => [
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="small" style={selected ? styles.filterLabelSelected : styles.filterLabel}>
                  {label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <EmptyState title="No customers found." message="Try a different search or filter." />
          ) : (
            filtered.map((customer) => (
              <ListItem
                key={customer.id}
                title={customer.name}
                subtitle={customerSubtitle(customer)}
                leading={<Avatar name={customer.name} />}
                trailing={
                  customer.tradeType ? (
                    <ThemedText type="smallBold" style={styles.points}>
                      {customer.pointsBalance ?? 0} pts
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" style={styles.count}>
                      {customer.purchaseCount} orders
                    </ThemedText>
                  )
                }
                onPress={() => router.push(`/customer/${customer.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function customerSubtitle(customer: Customer): string {
  const parts: string[] = [];
  if (customer.tradeType) parts.push(TRADE_TYPE_LABELS[customer.tradeType]);
  if (customer.phone) parts.push(customer.phone);
  if (customer.lastPurchaseAt) {
    parts.push(`Last purchase ${new Date(customer.lastPurchaseAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`);
  }
  return parts.join(' · ');
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={styles.avatar}>
      <ThemedText type="smallBold" style={styles.avatarLabel}>
        {initial}
      </ThemedText>
    </View>
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
    paddingBottom: BottomTabInset + Spacing.five,
  },
  offlineNote: {
    color: Tokens.primary,
    textAlign: 'center',
  },
  filterRow: {
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  filterChipSelected: {
    backgroundColor: Tokens.steel,
    borderColor: Tokens.steel,
  },
  filterLabel: {
    color: Tokens.foregroundSecondary,
  },
  filterLabelSelected: {
    color: Tokens.primaryForeground,
    fontWeight: 600,
  },
  list: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    backgroundColor: Tokens.card,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Tokens.steel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: Tokens.primaryForeground,
  },
  points: {
    color: Tokens.success,
  },
  count: {
    color: Tokens.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});

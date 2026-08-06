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
import { Section } from '@/components/ui/section';
import { StatusChip } from '@/components/ui/status-chip';
import { BottomTabInset, Spacing, Tokens } from '@/constants/theme';
import { MOCK_INVOICES } from '@/feature/invoice/constants/mock-invoices';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/feature/invoice/types';
import { INVOICE_STATUS_TONES } from '@/feature/invoice/constants/status-tones';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { formatMinorUnits } from '@/lib/money';

const PAGE_SIZE = 10;

const STATUS_FILTERS: (InvoiceStatus | 'all')[] = ['all', 'active', 'paid', 'partially_credited', 'fully_credited', 'void'];

export function InvoicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_INVOICES.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.number.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q)
      );
    });
  }, [query, statusFilter]);

  const shown = filtered.slice(0, visibleCount);

  const summary = useMemo(() => {
    const live = MOCK_INVOICES.filter((inv) => inv.status !== 'void');
    const total = live.reduce((sum, inv) => sum + inv.totalMinor, 0);
    const received = live.reduce((sum, inv) => sum + inv.paidMinor, 0);
    return { total, received, pending: total - received };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Invoices" />

        {isOffline ? (
          <ThemedText type="small" style={styles.offlineNote}>
            Offline — showing cached invoices.
          </ThemedText>
        ) : null}

        <Section title="Today's summary (this location)">
          <View style={styles.summaryRow}>
            <SummaryCell label="Total" value={formatMinorUnits(summary.total)} />
            <SummaryCell label="Received" value={formatMinorUnits(summary.received)} accent={Tokens.success} />
            <SummaryCell label="Pending" value={formatMinorUnits(summary.pending)} accent={Tokens.danger} />
          </View>
        </Section>

        <SearchField value={query} onChangeText={setQuery} placeholder="Search number or customer" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((status) => {
            const selected = statusFilter === status;
            return (
              <Pressable
                key={status}
                onPress={() => setStatusFilter(status)}
                style={({ pressed }) => [
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="small" style={selected ? styles.filterLabelSelected : styles.filterLabel}>
                  {status === 'all' ? 'All' : INVOICE_STATUS_LABELS[status]}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Section title="Invoices">
          {shown.length === 0 ? (
            <EmptyState title="No invoices found." message="Try a different search or filter." />
          ) : (
            shown.map((inv) => (
              <ListItem
                key={inv.id}
                title={inv.number}
                subtitle={`${inv.customerName} · ${INVOICE_STATUS_LABELS[inv.status]}`}
                leading={<StatusChip label={INVOICE_STATUS_LABELS[inv.status]} tone={INVOICE_STATUS_TONES[inv.status]} />}
                trailing={
                  <View style={styles.rowTrailing}>
                    <ThemedText type="smallBold">{formatMinorUnits(inv.totalMinor)}</ThemedText>
                    <ThemedText type="small" style={styles.date}>
                      {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </ThemedText>
                  </View>
                }
                onPress={() => router.push(`/invoice/${inv.id}`)}
              />
            ))
          )}
        </Section>

        {filtered.length > shown.length ? (
          <Pressable onPress={() => setVisibleCount((c) => c + PAGE_SIZE)} style={styles.loadMore}>
            <ThemedText type="smallBold" style={styles.loadMoreLabel}>
              Load More
            </ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function SummaryCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.summaryCell}>
      <ThemedText type="small" style={styles.summaryLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={[styles.summaryValue, accent ? { color: accent } : undefined]}>
        {value}
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
  summaryRow: {
    flexDirection: 'row',
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Tokens.border,
  },
  summaryLabel: {
    color: Tokens.foregroundSecondary,
  },
  summaryValue: {
    fontSize: 16,
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
  rowTrailing: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  date: {
    color: Tokens.muted,
  },
  loadMore: {
    alignSelf: 'center',
    backgroundColor: Tokens.primary,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  loadMoreLabel: {
    color: Tokens.primaryForeground,
  },
  pressed: {
    opacity: 0.7,
  },
});

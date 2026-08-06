import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { ListItem } from '@/components/ui/list-item';
import { SearchField } from '@/components/ui/search-field';
import { Section } from '@/components/ui/section';
import { StatusChip, type StatusTone } from '@/components/ui/status-chip';
import { BottomTabInset, Spacing, Tokens } from '@/constants/theme';
import { QUOTATION_STATUS_LABELS, type QuotationStatus } from '@/feature/quotation/types';
import { MOCK_QUOTATIONS } from '@/feature/quotation/constants/mock-quotations';
import { QUOTATION_STATUS_TONES } from '@/feature/quotation/constants/status-tones';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { formatMinorUnits } from '@/lib/money';

const PAGE_SIZE = 10;

const STATUS_FILTERS: (QuotationStatus | 'all')[] = ['all', 'draft', 'confirmed', 'converted_to_invoice', 'expired'];

const STATUS_FILTER_TONES: Record<QuotationStatus, StatusTone> = QUOTATION_STATUS_TONES;

export function QuotationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_QUOTATIONS.filter((item) => {
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
    const total = MOCK_QUOTATIONS.length;
    const pending = MOCK_QUOTATIONS.filter((q) => q.status === 'confirmed' || q.status === 'draft').length;
    const expired = MOCK_QUOTATIONS.filter((q) => q.status === 'expired').length;
    return { total, pending, expired };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Quotations" />

        {isOffline ? (
          <ThemedText type="small" style={styles.offlineNote}>
            Offline — showing cached quotations.
          </ThemedText>
        ) : null}

        <Section title="Quotation summary">
          <View style={styles.summaryRow}>
            <SummaryCell label="Total" value={`${summary.total}`} />
            <SummaryCell label="Pending" value={`${summary.pending}`} accent={Tokens.primary} />
            <SummaryCell label="Expired" value={`${summary.expired}`} accent={Tokens.danger} />
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
                <ThemedText
                  type="small"
                  style={selected ? styles.filterLabelSelected : styles.filterLabel}>
                  {status === 'all' ? 'All' : QUOTATION_STATUS_LABELS[status]}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Section title="Quotations">
          {shown.length === 0 ? (
            <EmptyState title="No quotations found." message="Try a different search or filter." />
          ) : (
            shown.map((q) => (
              <ListItem
                key={q.id}
                title={q.number}
                subtitle={q.customerName}
                leading={<ImagePlaceholder />}
                status={<StatusChip label={QUOTATION_STATUS_LABELS[q.status]} tone={STATUS_FILTER_TONES[q.status]} />}
                trailing={
                  <View style={styles.rowTrailing}>
                    <ThemedText type="smallBold">{formatMinorUnits(q.totalMinor)}</ThemedText>
                    <ThemedText type="small" style={styles.date}>
                      {new Date(q.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </ThemedText>
                  </View>
                }
                onPress={() => router.push(`/quotation/${q.id}`)}
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
    fontSize: 20,
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

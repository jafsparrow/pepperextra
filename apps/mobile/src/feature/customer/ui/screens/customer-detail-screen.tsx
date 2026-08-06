import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { Section } from '@/components/ui/section';
import { StatusChip, type StatusTone } from '@/components/ui/status-chip';
import { Spacing, Tokens } from '@/constants/theme';
import { CUSTOMER_TYPE_LABELS, TRADE_TYPE_LABELS } from '@/feature/customer/types';
import { findMockCustomer } from '@/feature/customer/constants/mock-customers';
import { INVOICE_STATUS_TONES } from '@/feature/invoice/constants/status-tones';
import { INVOICE_STATUS_LABELS } from '@/feature/invoice/types';
import { MOCK_INVOICES } from '@/feature/invoice/constants/mock-invoices';
import { LoyaltyCardQr } from '@/feature/qr-scan/ui/components/loyalty-card-qr';
import { DEFAULT_CURRENCY, formatMinorUnits } from '@/lib/money';

interface Redemption {
  id: string
  date: string
  description: string
  points: number
}

const REDEMPTIONS: Record<string, Redemption[]> = {
  'c-3': [
    { id: 'r-1', date: '2026-07-10', description: 'Gift voucher OMR 5', points: 500 },
    { id: 'r-2', date: '2026-05-02', description: '25% off next quote', points: 250 },
  ],
  'c-7': [
    { id: 'r-3', date: '2026-06-18', description: 'Gift voucher OMR 2', points: 200 },
  ],
}

export function CustomerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const customer = findMockCustomer(params.id);

  if (!customer) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState title="Customer not found." message="It may have been deleted." />
      </ThemedView>
    );
  }

  const invoices = MOCK_INVOICES.filter((inv) => inv.customerId === customer.id);
  const redemptions = REDEMPTIONS[customer.id] ?? [];
  const hasLoyalty = customer.tradeType != null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <View style={styles.headTitles}>
            <ThemedText type="title" style={styles.headName}>{customer.name}</ThemedText>
            <ThemedText type="small" style={styles.mutedText}>{customer.id}</ThemedText>
          </View>
          <View style={styles.chipColumn}>
            <StatusChip tone={toneForType(customer.type)} label={CUSTOMER_TYPE_LABELS[customer.type]} />
            {customer.tradeType ? (
              <StatusChip tone="steel" label={TRADE_TYPE_LABELS[customer.tradeType]} />
            ) : null}
          </View>
        </View>

        <Section title="Profile">
          <View style={styles.contactBlock}>
            <InfoRow label="Phone" value={customer.phone ?? '—'} />
            <InfoRow label="Email" value={customer.email ?? '—'} />
            <InfoRow label="Orders" value={String(customer.purchaseCount)} />
            {customer.notes ? <InfoRow label="Notes" value={customer.notes} /> : null}
          </View>
        </Section>

        {isCreditCustomer(customer.type) && (
          <Section title="Credit status">
            <CreditStatusBar outstandingMinor={customer.outstandingMinor ?? 0} creditLimitMinor={customer.creditLimitMinor ?? 0} />
          </Section>
        )}

        {hasLoyalty && (
          <Section title="Loyalty">
            <View style={styles.pointsCard}>
              <ThemedText type="small" style={styles.pointsLabel}>Current points</ThemedText>
              <ThemedText style={styles.pointsValue}>{customer.pointsBalance ?? 0}</ThemedText>
            </View>
            {redemptions.length > 0 && (
              <View style={styles.redemptionList}>
                {redemptions.map((red) => (
                  <View key={red.id} style={styles.redemptionRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText>{red.description}</ThemedText>
                      <ThemedText type="small" style={styles.mutedText}>{red.date}</ThemedText>
                    </View>
                    <ThemedText type="smallBold" style={styles.redemptionPoints}>−{red.points} pts</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </Section>
        )}

        {hasLoyalty && (
          <Section title="Loyalty card">
            <LoyaltyCardQr customerId={customer.id} name={customer.name} />
            <View style={styles.actionRow}>
              <Pressable onPress={() => {}} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.actionLabel}>Print card</ThemedText>
              </Pressable>
            </View>
          </Section>
        )}

        <Section title="Purchase history">
          {invoices.length === 0 ? (
            <EmptyState title="No purchases yet." message="Create an invoice for this customer to get started." />
          ) : (
            <View style={styles.list}>
              {invoices.map((inv) => (
                <ListItem
                  key={inv.id}
                  title={inv.number}
                  subtitle={`${inv.lines.length} line${inv.lines.length === 1 ? '' : 's'} · ${new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  leading={<StatusChip tone={INVOICE_STATUS_TONES[inv.status]} label={INVOICE_STATUS_LABELS[inv.status]} />}
                  trailing={<ThemedText>{formatMinorUnits(inv.totalMinor, DEFAULT_CURRENCY)}</ThemedText>}
                />
              ))}
            </View>
          )}
        </Section>

        <View style={styles.actionRow}>
          <Pressable onPress={() => router.push('/pos')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <ThemedText style={styles.primaryLabel}>New quotation</ThemedText>
          </Pressable>
          <Pressable onPress={() => router.push('/pos')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <ThemedText style={styles.primaryLabel}>New invoice</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" style={styles.mutedText}>{label}</ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

function CreditStatusBar({ outstandingMinor, creditLimitMinor }: { outstandingMinor: number; creditLimitMinor: number }) {
  const usage = creditLimitMinor > 0 ? outstandingMinor / creditLimitMinor : 0;
  const over = outstandingMinor > creditLimitMinor;
  const pct = Math.min(100, Math.round(usage * 100));
  return (
    <View>
      <View style={styles.creditRow}>
        <ThemedText type="small" style={styles.mutedText}>Outstanding</ThemedText>
        <ThemedText type="smallBold" style={over ? styles.dangerText : undefined}>
          {formatMinorUnits(outstandingMinor, DEFAULT_CURRENCY)}
        </ThemedText>
      </View>
      <View style={styles.creditRow}>
        <ThemedText type="small" style={styles.mutedText}>Credit limit</ThemedText>
        <ThemedText type="small">{formatMinorUnits(creditLimitMinor, DEFAULT_CURRENCY)}</ThemedText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }, over ? styles.fillOver : undefined]} />
      </View>
      {over ? (
        <ThemedText type="small" style={styles.dangerText}>Over the credit limit — hold new sales.</ThemedText>
      ) : null}
    </View>
  );
}

function isCreditCustomer(type: string): boolean {
  return type === 'account' || type === 'contractor';
}

function toneForType(type: string): StatusTone {
  if (type === 'contractor') return 'primary';
  if (type === 'account') return 'steel';
  return 'neutral';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headTitles: {
    flex: 1,
    gap: Spacing.one,
  },
  headName: {
    fontSize: 26,
  },
  chipColumn: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  contactBlock: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  pointsCard: {
    backgroundColor: Tokens.card,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  pointsLabel: {
    color: Tokens.foregroundSecondary,
  },
  pointsValue: {
    color: Tokens.success,
    fontSize: 40,
    fontWeight: 700,
  },
  redemptionList: {
    backgroundColor: Tokens.card,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  redemptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Tokens.border,
  },
  redemptionPoints: {
    color: Tokens.success,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Tokens.card,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  fill: {
    height: '100%',
    backgroundColor: Tokens.primary,
  },
  fillOver: {
    backgroundColor: Tokens.danger,
  },
  mutedText: {
    color: Tokens.muted,
  },
  dangerText: {
    color: Tokens.danger,
  },
  list: {
    backgroundColor: Tokens.card,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Tokens.border,
    alignItems: 'center',
    backgroundColor: Tokens.card,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: Tokens.primary,
    alignItems: 'center',
  },
  actionLabel: {
    color: Tokens.foreground,
  },
  primaryLabel: {
    color: Tokens.primaryForeground,
  },
  pressed: {
    opacity: 0.7,
  },
});

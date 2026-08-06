import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ListItem } from '@/components/ui/list-item';
import { Section } from '@/components/ui/section';
import { StatusChip } from '@/components/ui/status-chip';
import { Spacing, Tokens } from '@/constants/theme';
import { QUOTATION_STATUS_LABELS, type QuotationStatus } from '@/feature/quotation/types';
import { findMockQuotation } from '@/feature/quotation/constants/mock-quotations';
import { QUOTATION_STATUS_TONES } from '@/feature/quotation/constants/status-tones';
import { formatMinorUnits } from '@/lib/money';

function notImplemented(action: string) {
  Alert.alert(action, 'This action is wired to the quotations API once it lands. For now it is a stub.')
}

export function QuotationDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const quotation = id ? findMockQuotation(id) : undefined

  if (!quotation) {
    return (
      <ThemedView style={styles.missing}>
        <ThemedText type="subtitle">Quotation not found</ThemedText>
      </ThemedView>
    )
  }

  const status = quotation.status as QuotationStatus
  const isDraft = status === 'draft'

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headRow}>
          <View style={styles.headTitles}>
            <ThemedText style={styles.number}>{quotation.number}</ThemedText>
            <ThemedText type="small" style={styles.customer}>
              {quotation.customerName}
            </ThemedText>
          </View>
          <StatusChip label={QUOTATION_STATUS_LABELS[status]} tone={QUOTATION_STATUS_TONES[status]} />
        </View>

        <Section title="Details">
          <ListItem
            title="Valid until"
            subtitle={new Date(quotation.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
          <ListItem title="Created" subtitle={new Date(quotation.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          {quotation.notes ? <ListItem title="Notes" subtitle={quotation.notes} /> : null}
        </Section>

        <Section title={`Line items (${quotation.lines.length})`}>
          {quotation.lines.map((line) => (
            <ListItem
              key={line.id}
              title={line.productName}
              subtitle={`${line.quantity} × ${formatMinorUnits(line.unitPriceMinor)}`}
              trailing={<ThemedText type="smallBold">{formatMinorUnits(line.lineTotalMinor)}</ThemedText>}
            />
          ))}
          <View style={styles.totalRow}>
            <ThemedText type="smallBold">Total</ThemedText>
            <ThemedText type="smallBold" style={styles.totalValue}>
              {formatMinorUnits(quotation.totalMinor)}
            </ThemedText>
          </View>
        </Section>

        <Section title="Terms">
          <ThemedText type="small" style={styles.terms}>
            Prices quoted in the customer&apos;s price list. Quotation expires on the valid-until date.
          </ThemedText>
        </Section>

        <View style={styles.actions}>
          <ActionButton label="Convert to Invoice" onPress={() => notImplemented('Convert to Invoice')} primary />
          {isDraft ? <ActionButton label="Edit" onPress={() => notImplemented('Edit quotation')} /> : null}
          <ActionButton label="Send to Customer (WhatsApp)" onPress={() => notImplemented('WhatsApp PDF')} />
          <ActionButton label="Print / PDF" onPress={() => notImplemented('Print / PDF')} />
          <ActionButton label="Fulfilment progress" onPress={() => router.push('/fulfilment')} />
        </View>
      </ScrollView>
    </ThemedView>
  )
}

function ActionButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <ThemedView type="backgroundElement" style={[styles.actionButton, primary && styles.actionButtonPrimary]}>
      <ThemedText type="smallBold" style={primary ? styles.actionLabelPrimary : undefined} onPress={onPress}>
        {label}
      </ThemedText>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
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
  number: {
    fontSize: 26,
    fontWeight: 700,
  },
  customer: {
    color: Tokens.foregroundSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  totalValue: {
    color: Tokens.primary,
    fontSize: 18,
  },
  terms: {
    color: Tokens.foregroundSecondary,
    padding: Spacing.three,
  },
  actions: {
    gap: Spacing.three,
  },
  actionButton: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  actionButtonPrimary: {
    backgroundColor: Tokens.primary,
    borderColor: Tokens.primary,
  },
  actionLabelPrimary: {
    color: Tokens.primaryForeground,
  },
})

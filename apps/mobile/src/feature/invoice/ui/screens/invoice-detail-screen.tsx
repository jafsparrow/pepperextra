import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ListItem } from '@/components/ui/list-item';
import { Section } from '@/components/ui/section';
import { StatusChip } from '@/components/ui/status-chip';
import { Colors, Spacing, Tokens } from '@/constants/theme';
import { findMockInvoice } from '@/feature/invoice/constants/mock-invoices';
import { INVOICE_STATUS_LABELS } from '@/feature/invoice/types';
import { INVOICE_STATUS_TONES } from '@/feature/invoice/constants/status-tones';
import {
  PAYMENT_METHOD_LABELS,
  type Invoice,
  type PaymentMethod,
} from '@/feature/invoice/types';
import { DEFAULT_CURRENCY, formatMinorUnits } from '@/lib/money';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'cheque', 'store_credit'];

function notImplemented(action: string) {
  Alert.alert(action, 'This action is wired to the invoices API once it lands. For now it is a stub.')
}

function parseAmountToMinorUnits(input: string): number {
  const value = Number.parseFloat(input.replace(',', '.'))
  if (Number.isNaN(value) || value < 0) return 0
  return Math.round(value * 10 ** DEFAULT_CURRENCY.decimals)
}

export function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [invoice, setInvoice] = useState<Invoice | undefined>(() =>
    id ? findMockInvoice(id) : undefined,
  )
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)

  if (!invoice) {
    return (
      <ThemedView style={styles.missing}>
        <ThemedText type="subtitle">Invoice not found</ThemedText>
      </ThemedView>
    )
  }

  const balance = invoice.totalMinor - invoice.paidMinor
  const canVoid = invoice.status === 'active' && invoice.payments.length === 0
  const progress = invoice.totalMinor > 0 ? invoice.paidMinor / invoice.totalMinor : 0

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headRow}>
          <View style={styles.headTitles}>
            <ThemedText style={styles.number}>{invoice.number}</ThemedText>
            <ThemedText type="small" style={styles.customer}>
              {invoice.customerName}
            </ThemedText>
            <ThemedText type="small" style={styles.date}>
              Issued {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </ThemedText>
          </View>
          <StatusChip label={INVOICE_STATUS_LABELS[invoice.status]} tone={INVOICE_STATUS_TONES[invoice.status]} />
        </View>

        <Section title={`Line items (${invoice.lines.length})`}>
          {invoice.lines.map((line) => (
            <ListItem
              key={line.id}
              title={line.productName}
              subtitle={`${line.quantity} × ${formatMinorUnits(line.unitPriceMinor)} · VAT ${formatMinorUnits(line.vatMinor)}`}
              trailing={<ThemedText type="smallBold">{formatMinorUnits(line.lineTotalMinor)}</ThemedText>}
            />
          ))}
          <View style={styles.totals}>
            <TotalRow label="Subtotal" value={formatMinorUnits(invoice.subtotalMinor)} />
            <TotalRow label="VAT" value={formatMinorUnits(invoice.vatMinor)} />
            <TotalRow label="Grand total" value={formatMinorUnits(invoice.totalMinor)} strong />
          </View>
        </Section>

        <Section title="Payments">
          <View style={styles.balanceBlock}>
            <View style={styles.balanceLine}>
              <ThemedText type="small" style={styles.balanceLabel}>Paid</ThemedText>
              <ThemedText type="smallBold" style={styles.balancePaid}>{formatMinorUnits(invoice.paidMinor)}</ThemedText>
            </View>
            <View style={styles.balanceLine}>
              <ThemedText type="small" style={styles.balanceLabel}>Balance</ThemedText>
              <ThemedText type="smallBold" style={[styles.balanceValue, balance > 0 && styles.balanceDue]}>
                {formatMinorUnits(balance)}
              </ThemedText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
          </View>

          {invoice.payments.length === 0 ? (
            <ThemedText type="small" style={styles.noPayments}>No payments recorded.</ThemedText>
          ) : (
            invoice.payments.map((p) => (
              <ListItem
                key={p.id}
                title={PAYMENT_METHOD_LABELS[p.method]}
                subtitle={`${new Date(p.paidAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${p.reference ? ` · ${p.reference}` : ''}`}
                trailing={<ThemedText type="smallBold">{formatMinorUnits(p.amountMinor)}</ThemedText>}
              />
            ))
          )}

          {balance > 0 && invoice.status !== 'void' && invoice.status !== 'fully_credited' ? (
            <View style={styles.actionPad}>
              <ActionButton label="Record payment" onPress={() => setPaymentModalVisible(true)} primary />
            </View>
          ) : null}
        </Section>

        <Section title="Credit notes">
          <ThemedText type="small" style={styles.noPayments}>
            {invoice.status === 'partially_credited'
              ? '1 credit note issued for returned items.'
              : invoice.status === 'fully_credited'
                ? 'Invoice fully credited.'
                : 'No credit notes against this invoice.'}
          </ThemedText>
          {invoice.status === 'partially_credited' ? (
            <View style={styles.actionPad}>
              <ActionButton label="Reissue remaining items as invoice" onPress={() => notImplemented('Reissue remaining items')} />
            </View>
          ) : null}
        </Section>

        <Section title="Warranty">
          <ThemedText type="small" style={styles.noPayments}>
            Warranty lines are linked on the web admin. No active warranty on this invoice.
          </ThemedText>
        </Section>

        <View style={styles.actions}>
          <ActionButton label="Print / PDF" onPress={() => notImplemented('Print / PDF')} />
          <ActionButton label="Share via WhatsApp" onPress={() => notImplemented('WhatsApp PDF')} />
          {canVoid ? <ActionButton label="Void invoice" onPress={() => notImplemented('Void invoice')} danger /> : null}
        </View>
      </ScrollView>

      <RecordPaymentModal
        visible={paymentModalVisible}
        balance={balance}
        onClose={() => setPaymentModalVisible(false)}
        onRecord={(amountMinor, method) => {
          setInvoice((current) => {
            if (!current) return current
            const payment = {
              id: `ip-${Date.now()}`,
              amountMinor,
              method,
              paidAt: new Date().toISOString(),
            }
            const paidMinor = current.paidMinor + amountMinor
            const status = paidMinor >= current.totalMinor ? 'paid' : current.status
            return { ...current, payments: [...current.payments, payment], paidMinor, status }
          })
          setPaymentModalVisible(false)
        }}
      />
    </ThemedView>
  )
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <ThemedText type={strong ? 'smallBold' : 'small'} style={!strong && styles.totalLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={strong ? styles.totalValue : undefined}>
        {value}
      </ThemedText>
    </View>
  )
}

function ActionButton({
  label,
  onPress,
  primary,
  danger,
}: {
  label: string
  onPress: () => void
  primary?: boolean
  danger?: boolean
}) {
  return (
    <ThemedView type="backgroundElement" style={[styles.actionButton, primary && styles.actionButtonPrimary, danger && styles.actionButtonDanger]}>
      <ThemedText
        type="smallBold"
        style={[primary && styles.actionLabelPrimary, danger && styles.actionLabelDanger]}
        onPress={onPress}>
        {label}
      </ThemedText>
    </ThemedView>
  )
}

function RecordPaymentModal({
  visible,
  balance,
  onClose,
  onRecord,
}: {
  visible: boolean
  balance: number
  onClose: () => void
  onRecord: (amountMinor: number, method: PaymentMethod) => void
}) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')

  const submit = () => {
    const minor = parseAmountToMinorUnits(amount)
    if (minor <= 0) {
      Alert.alert('Enter an amount', 'Please enter an amount greater than zero.')
      return
    }
    if (minor > balance) {
      Alert.alert('Amount exceeds balance', `Balance remaining is ${formatMinorUnits(balance)}.`)
      return
    }
    onRecord(minor, method)
    setAmount('')
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ThemedText style={styles.sheetTitle}>Record payment</ThemedText>
          <ThemedText type="small" style={styles.balanceLabel}>
            Balance remaining: {formatMinorUnits(balance)}
          </ThemedText>

          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map((m) => {
              const selected = method === m
              return (
                <Pressable
                  key={m}
                  onPress={() => setMethod(m)}
                  style={[styles.methodChip, selected && styles.methodChipSelected]}>
                  <ThemedText type="small" style={selected && styles.methodLabelSelected}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </ThemedText>
                </Pressable>
              )
            })}
          </View>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder={`Amount in ${DEFAULT_CURRENCY.code} (e.g. 45.200)`}
            placeholderTextColor={Tokens.muted}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <View style={styles.actionPad}>
            <ActionButton label="Save payment" onPress={submit} primary />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  date: {
    color: Tokens.muted,
  },
  totals: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: Tokens.foregroundSecondary,
  },
  totalValue: {
    color: Tokens.primary,
    fontSize: 18,
  },
  balanceBlock: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  balanceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: Tokens.foregroundSecondary,
  },
  balancePaid: {
    color: Tokens.success,
  },
  balanceValue: {
    color: Tokens.foreground,
  },
  balanceDue: {
    color: Tokens.danger,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.backgroundSelected,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Tokens.success,
  },
  noPayments: {
    color: Tokens.foregroundSecondary,
    padding: Spacing.three,
  },
  actionPad: {
    padding: Spacing.three,
    paddingTop: Spacing.one,
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
  actionButtonDanger: {
    borderColor: Tokens.danger,
  },
  actionLabelPrimary: {
    color: Tokens.primaryForeground,
  },
  actionLabelDanger: {
    color: Tokens.danger,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Tokens.card,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 700,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  methodChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  methodChipSelected: {
    backgroundColor: Tokens.steel,
    borderColor: Tokens.steel,
  },
  methodLabelSelected: {
    color: Tokens.primaryForeground,
    fontWeight: 600,
  },
  input: {
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    color: Tokens.foreground,
  },
})

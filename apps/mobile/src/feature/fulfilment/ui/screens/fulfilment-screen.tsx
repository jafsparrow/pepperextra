import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ListItem } from '@/components/ui/list-item';
import { Section } from '@/components/ui/section';
import { StatusChip } from '@/components/ui/status-chip';
import { Spacing, Tokens } from '@/constants/theme';
import { useRole } from '@/feature/roles/hooks/use-role';

interface FulfilmentItem {
  id: string
  station: string
  orderNumber: string
  productName: string
  quantity: number
  ready: boolean
}

const INITIAL_ITEMS: FulfilmentItem[] = [
  { id: 'f-1', station: 'Station A — Electrical', orderNumber: 'QT-00012', productName: 'Twin Core Wire 2.5mm', quantity: 5, ready: false },
  { id: 'f-2', station: 'Station A — Electrical', orderNumber: 'QT-00012', productName: 'Junction Box 4-Way', quantity: 10, ready: false },
  { id: 'f-3', station: 'Station B — Plumbing', orderNumber: 'QT-00011', productName: 'Ball Valve 1/2" Brass', quantity: 8, ready: false },
  { id: 'f-4', station: 'Station C — Building', orderNumber: 'QT-00009', productName: 'Portland Cement 50kg', quantity: 40, ready: true },
  { id: 'f-5', station: 'Station C — Building', orderNumber: 'QT-00009', productName: 'River Sand (per m³)', quantity: 6, ready: true },
]

/**
 * PLACEHOLDER — Fulfilment Station (BRD §8.6). Reached from the More (⋮) menu.
 * Station staff see only their station's pending items and mark them ready.
 */
export function FulfilmentScreen() {
  const { canSeeCosts } = useRole();
  const [items, setItems] = useState<FulfilmentItem[]>(INITIAL_ITEMS);

  const stations = Array.from(new Set(items.map((i) => i.station)));

  const toggleReady = (id: string) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ready: !i.ready } : i)));
  };

  const pendingCount = items.filter((i) => !i.ready).length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <ThemedText type="small" style={styles.mutedText}>Pending across all stations</ThemedText>
          <ThemedText style={[styles.number, pendingCount > 0 ? styles.pendingNumber : styles.doneNumber]}>{pendingCount}</ThemedText>
        </View>

        {canSeeCosts ? (
          <ThemedText type="small" style={styles.mutedText}>
            Manager view — you can see progress across all stations.
          </ThemedText>
        ) : null}

        {stations.map((station) => {
          const stationItems = items.filter((i) => i.station === station);
          const ready = stationItems.every((i) => i.ready);
          return (
            <Section
              key={station}
              title={station}
              actionLabel={ready ? 'All ready' : `${stationItems.filter((i) => !i.ready).length} pending`}
              onAction={() => {}}>
              {stationItems.map((item) => (
                <ListItem
                  key={item.id}
                  title={item.productName}
                  subtitle={`${item.orderNumber} · qty ${item.quantity}`}
                  leading={
                    <StatusChip tone={item.ready ? 'success' : 'neutral'} label={item.ready ? 'Ready' : 'Pending'} />
                  }
                  onPress={() => toggleReady(item.id)}
                />
              ))}
            </Section>
          );
        })}

        <Pressable onPress={() => {}} style={({ pressed }) => [styles.printButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.printLabel}>Print / reprint station pick lists</ThemedText>
        </Pressable>
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
  summary: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  mutedText: {
    color: Tokens.muted,
  },
  number: {
    fontSize: 40,
    fontWeight: 700,
  },
  pendingNumber: {
    color: Tokens.primary,
  },
  doneNumber: {
    color: Tokens.success,
  },
  printButton: {
    borderWidth: 1,
    borderColor: Tokens.border,
    backgroundColor: Tokens.card,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  printLabel: {
    color: Tokens.foreground,
  },
  pressed: {
    opacity: 0.7,
  },
});

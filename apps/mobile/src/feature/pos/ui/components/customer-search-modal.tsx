import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/search-field';
import { Spacing, Tokens } from '@/constants/theme';
import { CUSTOMER_TYPE_LABELS } from '@/feature/customer/types';
import type { Customer } from '@/feature/customer/types';
import { getRecentCustomers, searchCustomers } from '@/feature/pos/constants/recent-customers';

type CustomerSearchModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
};

export function CustomerSearchModal({ visible, onClose, onSelect }: CustomerSearchModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const customers = useMemo(() => {
    const q = query.trim();
    return q === '' ? getRecentCustomers() : searchCustomers(q);
  }, [query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}
          onPress={() => {}}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Select customer</ThemedText>
            <Pressable
              onPress={close}
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold">✕</ThemedText>
            </Pressable>
          </View>

          <View style={styles.search}>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search name or phone" />
          </View>

          {query.trim() === '' ? (
            <ThemedText type="small" style={styles.hint}>
              Recently purchased
            </ThemedText>
          ) : null}

          <FlatList
            data={customers}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  setQuery('');
                  onClose();
                }}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                <View style={styles.itemBody}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" style={styles.itemMeta}>
                    {item.phone ?? 'No phone'} · {CUSTOMER_TYPE_LABELS[item.type]}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={styles.itemMeta}>
                  {item.purchaseCount} purchases
                </ThemedText>
              </Pressable>
            )}
            ListEmptyComponent={
              <EmptyState title="No customers found." message="Try a different search." />
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: Tokens.card,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.background,
  },
  search: {
    paddingBottom: Spacing.three,
  },
  hint: {
    color: Tokens.muted,
    paddingBottom: Spacing.one,
  },
  list: {
    flexGrow: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Tokens.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  itemBody: {
    flex: 1,
    gap: Spacing.half,
  },
  itemMeta: {
    color: Tokens.foregroundSecondary,
  },
  pressed: {
    opacity: 0.6,
  },
});

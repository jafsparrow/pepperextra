import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { Spacing, Tokens } from '@/constants/theme'
import {
  addSpecCode,
  removeSpecCode,
  useSpecCodeLists,
  type SpecCodeListKey,
} from '@/feature/pos/store/spec-code-store'

type SpecCodeEditModalProps = {
  visible: boolean
  onClose: () => void
}

const TABS: { key: SpecCodeListKey; label: string }[] = [
  { key: 'types', label: 'Types' },
  { key: 'sizes', label: 'Sizes' },
  { key: 'brands', label: 'Brands' },
]

/**
 * Full-screen editor for the device-local quick-spec capsules. Three tabs
 * (Types / Sizes / Brands); each shows the existing codes as deletable chips
 * plus an input to add a new one. Tokens are stored verbatim, so leading or
 * trailing symbols (e.g. "-HILC") are kept exactly as typed.
 */
export function SpecCodeEditModal({ visible, onClose }: SpecCodeEditModalProps) {
  const insets = useSafeAreaInsets()
  const lists = useSpecCodeLists()
  const [tab, setTab] = useState<SpecCodeListKey>('types')
  const [input, setInput] = useState('')

  const selectTab = (next: SpecCodeListKey) => {
    setTab(next)
    setInput('')
  }

  const add = () => {
    const value = input.trim()
    if (!value) return
    addSpecCode(tab, value)
    setInput('')
  }

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
          <ThemedText style={styles.title}>Quick spec codes</ThemedText>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">✕</ThemedText>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {TABS.map(({ key, label }) => {
            const selected = tab === key
            return (
              <Pressable
                key={key}
                onPress={() => selectTab(key)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabSelected,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={selected && styles.tabLabelSelected}>
                  {label}
                </ThemedText>
              </Pressable>
            )
          })}
        </View>

        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.chips}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {lists[tab].map((token) => (
              <Pressable
                key={token}
                onPress={() => removeSpecCode(tab, token)}
                accessibilityLabel={`Remove ${token}`}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.chipLabel}>
                  {token}
                </ThemedText>
                <ThemedText type="small" style={styles.chipRemove}>
                  ✕
                </ThemedText>
              </Pressable>
            ))}
            {lists[tab].length === 0 ? (
              <ThemedText type="small" style={styles.empty}>
                No codes yet — add one below.
              </ThemedText>
            ) : (
              <ThemedText type="small" style={styles.hint}>
                Tap a code to remove it.
              </ThemedText>
            )}
          </ScrollView>

          <View style={[styles.inputRow, { paddingBottom: insets.bottom + Spacing.three }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={add}
              autoCorrect={false}
              autoCapitalize="characters"
              placeholder="e.g. -HILC"
              placeholderTextColor={Tokens.muted}
              returnKeyType="done"
              style={styles.input}
            />
            <Pressable
              onPress={add}
              disabled={!input.trim()}
              style={({ pressed }) => [
                styles.addButton,
                !input.trim() && styles.addButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.addLabel}>
                Add
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Tokens.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 700,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  tabSelected: {
    backgroundColor: Tokens.primary,
    borderColor: Tokens.primary,
  },
  tabLabelSelected: {
    color: Tokens.primaryForeground,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  scroll: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  chipRemove: {
    color: Tokens.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  empty: {
    color: Tokens.muted,
  },
  hint: {
    width: '100%',
    color: Tokens.muted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  input: {
    flex: 1,
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: Tokens.foreground,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: Tokens.primary,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addLabel: {
    color: Tokens.primaryForeground,
  },
  pressed: {
    opacity: 0.6,
  },
})

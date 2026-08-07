import { Pressable, StyleSheet, View } from 'react-native'

import { ThemedText } from '@/components/themed-text'
import { Spacing, Tokens } from '@/constants/theme'
import { useSpecCodeLists } from '@/feature/pos/store/spec-code-store'

type SpecCodePanelProps = {
  onAppend: (token: string) => void
}

/**
 * Quick-spec capsule panel under the POS search bar. Three columns of
 * tap-to-append chips (type / size / brand) with no headers to keep the
 * screen compact. Each chip appends its literal token to the search query, so
 * e.g. PP → 110UP → -HILC composes "PP110UP-HILC".
 */
export function SpecCodePanel({ onAppend }: SpecCodePanelProps) {
  const lists = useSpecCodeLists()
  const columns = [
    { key: 'types', values: lists.types },
    { key: 'sizes', values: lists.sizes },
    { key: 'brands', values: lists.brands },
  ] as const
  const isEmpty = columns.every((c) => c.values.length === 0)

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <ThemedText type="small" style={styles.empty}>
          No quick spec codes yet
        </ThemedText>
      ) : (
        <View style={styles.columns}>
          {columns.map((column) => (
            <View key={column.key} style={styles.column}>
              {column.values.map((token) => (
                <Pressable
                  key={token}
                  onPress={() => onAppend(token)}
                  style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.chipLabel}>
                    {token}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  empty: {
    color: Tokens.muted,
    paddingVertical: Spacing.two,
    textAlign: 'center',
  },
  columns: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  column: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    alignContent: 'flex-start',
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 1,
    borderRadius: 999,
    backgroundColor: Tokens.background,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.6,
  },
})
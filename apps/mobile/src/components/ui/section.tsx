import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Tokens } from '@/constants/theme';

type SectionProps = PropsWithChildren<{
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}>;

export function Section({ title, actionLabel, onAction, children }: SectionProps) {
  return (
    <View style={styles.wrapper}>
      {title ? (
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>
          {actionLabel && onAction ? (
            <ThemedText type="small" style={styles.action} onPress={onAction}>
              {actionLabel}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
      <ThemedView type="backgroundElement" style={styles.card}>
        {children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Tokens.foregroundSecondary,
  },
  action: {
    color: Tokens.steel,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
});

import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

export function ScreenHeader({ title, subtitle, trailing }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titles}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  titles: {
    gap: Spacing.half,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  subtitle: {
    opacity: 0.8,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});

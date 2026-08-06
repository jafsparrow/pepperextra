import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Tokens } from '@/constants/theme';

type ListItemProps = {
  title: string;
  subtitle?: ReactNode;
  status?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  titleColor?: string;
  style?: ViewStyle;
};

export function ListItem({ title, subtitle, status, leading, trailing, onPress, titleColor, style }: ListItemProps) {
  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>
        <ThemedText type="smallBold" style={titleColor ? { color: titleColor } : undefined}>
          {title}
        </ThemedText>
        {subtitle ? (
          typeof subtitle === 'string' ? (
            <ThemedText type="small" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          ) : (
            subtitle
          )
        ) : null}
        {status ? <View style={styles.status}>{status}</View> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        style,
        pressed && onPress ? styles.pressed : null,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Tokens.border,
  },
  leading: {
    minWidth: 40,
    alignItems: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  subtitle: {
    color: Tokens.foregroundSecondary,
  },
  status: {
    alignSelf: 'flex-start',
  },
  trailing: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  pressed: {
    backgroundColor: Colors.light.backgroundSelected,
  },
});

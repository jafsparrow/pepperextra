import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Tokens } from '@/constants/theme';

export function ImagePlaceholder() {
  return (
    <View style={styles.box}>
      <ThemedText type="small" style={styles.glyph}>
        ▤
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Tokens.border,
  },
  glyph: {
    color: Tokens.foregroundSecondary,
    fontSize: 18,
  },
});

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Tokens } from '@/constants/theme';

export function OfflineIndicator() {
  return (
    <View style={styles.banner}>
      <ThemedText type="small" style={styles.text}>
        Offline — showing cached data. Live actions (QR, fulfilment) need a connection.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Tokens.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  text: {
    color: Tokens.primaryForeground,
    textAlign: 'center',
    fontWeight: 600,
  },
});

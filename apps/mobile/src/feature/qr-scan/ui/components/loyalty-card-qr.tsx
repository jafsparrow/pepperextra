import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';

/**
 * The customer loyalty card QR. Encodes the customer id and doubles as the
 * tradesperson loyalty card (BRD §8.15). Printable at the counter.
 */
export function LoyaltyCardQr({ customerId, name }: { customerId: string; name: string }) {
  return (
    <View style={styles.container}>
      <QRCode value={customerId} size={168} backgroundColor="#ffffff" color={Tokens.foreground} />
      <ThemedText type="smallBold" style={styles.name}>
        {name}
      </ThemedText>
      <ThemedText type="small" style={styles.hint}>
        Scan this card at the counter to load {name.split(' ')[0]}&apos;s profile and award loyalty points.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    backgroundColor: Tokens.card,
  },
  name: {
    fontSize: 18,
  },
  hint: {
    color: Tokens.foregroundSecondary,
    textAlign: 'center',
  },
});

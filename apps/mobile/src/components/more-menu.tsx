import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Tokens } from '@/constants/theme';

export type MoreMenuItem = {
  label: string;
  icon?: string;
  danger?: boolean;
  onPress: () => void;
};

type MoreMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: MoreMenuItem[];
};

export function MoreMenu({ visible, onClose, items }: MoreMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {items.map((item, index) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.item, index > 0 && styles.separator, pressed && styles.pressed]}
              onPress={() => {
                onClose()
                item.onPress()
              }}>
              {item.icon ? <ThemedText style={styles.icon}>{item.icon}</ThemedText> : null}
              <ThemedText type="smallBold" style={item.danger ? styles.danger : undefined}>
                {item.label}
              </ThemedText>
            </Pressable>
          ))}
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
    backgroundColor: Tokens.card,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Tokens.border,
  },
  icon: {
    fontSize: 16,
  },
  danger: {
    color: Tokens.danger,
  },
  pressed: {
    opacity: 0.6,
  },
});

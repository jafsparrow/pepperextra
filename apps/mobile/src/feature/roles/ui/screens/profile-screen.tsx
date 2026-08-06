import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Section } from '@/components/ui/section';
import { Spacing, Tokens } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { useRole } from '@/feature/roles/hooks/use-role';

export function ProfileScreen() {
  const { data: session } = authClient.useSession();
  const { role, isOwner } = useRole();

  const user = session?.user;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <ThemedText type="title" style={styles.avatarLabel}>
            {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText type="title" style={styles.name}>{user?.name ?? 'Signed in'}</ThemedText>
        <ThemedText type="small" style={styles.roleLabel}>{isOwner ? 'Owner' : 'Staff member'}</ThemedText>

        <Section title="Account">
          <InfoRow label="Name" value={user?.name ?? '—'} />
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Role" value={isOwner ? 'Owner' : 'Staff'} />
          <InfoRow label="Account type" value={role} />
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" style={styles.mutedText}>{label}</ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Tokens.steel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: Tokens.primaryForeground,
  },
  name: {
    fontSize: 22,
  },
  roleLabel: {
    color: Tokens.muted,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  mutedText: {
    color: Tokens.muted,
  },
});

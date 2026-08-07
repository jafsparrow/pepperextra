import { useRouter } from "expo-router"
import { useState } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { OfflineIndicator } from "@/components/offline-indicator"
import { MoreMenu, type MoreMenuItem } from "@/components/more-menu"
import { ScreenHeader } from "@/components/screen-header"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { Fab, FabGroup } from "@/components/ui/fab"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { ListItem } from "@/components/ui/list-item"
import { Section } from "@/components/ui/section"
import { StatusChip } from "@/components/ui/status-chip"
import { BottomTabInset, Spacing, Tokens } from "@/constants/theme"
import { useSignOut } from "@/feature/auth/hooks/use-sign-out"
import { INVOICE_STATUS_LABELS } from "@/feature/invoice/types"
import { MOCK_INVOICES } from "@/feature/invoice/constants/mock-invoices"
import { QUOTATION_STATUS_LABELS } from "@/feature/quotation/types"
import { QUOTATION_STATUS_TONES } from "@/feature/quotation/constants/status-tones"
import { MOCK_QUOTATIONS } from "@/feature/quotation/constants/mock-quotations"
import {
  MOCK_QR_SCANS,
  relativeTime,
} from "@/feature/qr-scan/constants/mock-scans"
import { findMockTag } from "@/feature/tags/constants/mock-tags"
import { usePinnedTagIds } from "@/feature/tags/store/use-pinned-tags"
import type { ProductTag } from "@/feature/tags/types"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { formatMinorUnits } from "@/lib/money"

export function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isOffline } = useNetworkStatus()
  const { signOutUser } = useSignOut()

  const pinnedTagIds = usePinnedTagIds()
  const [menuVisible, setMenuVisible] = useState(false)

  const pinnedTags = pinnedTagIds
    .map((id) => findMockTag(id))
    .filter((t): t is ProductTag => t != null)

  const menuItems: MoreMenuItem[] = [
    { label: "Settings", icon: "⚙️", onPress: () => router.push("/settings") },
    { label: "Profile", icon: "👤", onPress: () => router.push("/profile") },
    {
      label: "Fulfilment Station",
      icon: "📦",
      onPress: () => router.push("/fulfilment"),
    },
    {
      label: "Sign out",
      icon: "🚪",
      danger: true,
      onPress: () => void signOutUser(),
    },
  ]

  return (
    <ThemedView style={styles.container}>
      {isOffline ? <OfflineIndicator /> : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="BuildMate"
          trailing={
            <Pressable
              onPress={() => setMenuVisible(true)}
              style={({ pressed }) => [
                styles.moreButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="smallBold">More ⋮</ThemedText>
            </Pressable>
          }
        />

        <Section title="Pinned tags">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsRow}
          >
            {pinnedTags.length === 0 ? (
              <ThemedText type="small" style={styles.tagEmpty}>
                No pinned tags yet. Open a tag to pin it.
              </ThemedText>
            ) : (
              pinnedTags.map((tag) => (
                <Pressable
                  key={tag.id}
                  onPress={() =>
                    router.push({
                      pathname: "/tag-products",
                      params: { id: tag.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.tagChip,
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold" style={styles.tagChipLabel}>
                    {tag.name}
                  </ThemedText>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Section>

        <Section
          title="Recent quotations"
          actionLabel="View all"
          onAction={() => router.push("/quotations")}
        >
          {MOCK_QUOTATIONS.slice(0, 5).map((q) => (
            <ListItem
              key={q.id}
              title={q.number}
              subtitle={q.customerName}
              leading={<ImagePlaceholder />}
              status={
                <StatusChip
                  label={QUOTATION_STATUS_LABELS[q.status]}
                  tone={QUOTATION_STATUS_TONES[q.status]}
                />
              }
              trailing={
                <ThemedText type="smallBold" style={styles.money}>
                  {formatMinorUnits(q.totalMinor)}
                </ThemedText>
              }
              onPress={() => router.push(`/quotation/${q.id}`)}
            />
          ))}
        </Section>

        <Section title="Recent transactions">
          {MOCK_INVOICES.slice(0, 5).map((inv) => (
            <ListItem
              key={inv.id}
              title={inv.number}
              subtitle={`${inv.customerName} · ${INVOICE_STATUS_LABELS[inv.status]}`}
              trailing={
                <ThemedText type="smallBold" style={styles.money}>
                  {formatMinorUnits(inv.totalMinor)}
                </ThemedText>
              }
              onPress={() => router.push(`/invoice/${inv.id}`)}
            />
          ))}
        </Section>

        <Section title="Recent QR scans">
          {MOCK_QR_SCANS.slice(0, 5).map((scan) => (
            <ListItem
              key={scan.id}
              title={scan.customerName}
              subtitle={`${scan.tradeType ?? "Customer"} · ${relativeTime(scan.scannedAt)}`}
              trailing={
                scan.pointsAwarded ? (
                  <ThemedText type="smallBold" style={styles.points}>
                    +{scan.pointsAwarded} pts
                  </ThemedText>
                ) : (
                  <ThemedText type="small" style={styles.muted}>
                    —
                  </ThemedText>
                )
              }
              onPress={() => router.push("/qr-scan")}
            />
          ))}
        </Section>
      </ScrollView>

      <View style={[styles.fabRow, { bottom: BottomTabInset + Spacing.three }]}>
        <FabGroup>
          <Fab
            icon="📷"
            label="Scan Card"
            onPress={() => router.push("/qr-scan")}
            color={Tokens.steel}
          />
          <Fab
            icon="🛒"
            label="New Quotation"
            onPress={() => router.push("/pos")}
          />
        </FabGroup>
      </View>

      <MoreMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={menuItems}
      />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  moreButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: Tokens.card,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  pressed: {
    opacity: 0.7,
  },
  tagsRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  tagEmpty: {
    color: Tokens.muted,
  },
  tagChip: {
    backgroundColor: Tokens.steel,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  tagChipLabel: {
    color: Tokens.primaryForeground,
  },
  money: {
    fontSize: 15,
  },
  points: {
    color: Tokens.success,
  },
  muted: {
    color: Tokens.muted,
  },
  fabRow: {
    position: "absolute",
    right: Spacing.three,
    alignItems: "flex-end",
  },
})

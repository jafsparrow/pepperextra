import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ListItem } from '@/components/ui/list-item';
import { StatusChip } from '@/components/ui/status-chip';
import { BottomTabInset, Spacing, Tokens } from '@/constants/theme';
import { CUSTOMER_TYPE_LABELS, TRADE_TYPE_LABELS } from '@/feature/customer/types';
import { MOCK_CUSTOMERS, findMockCustomer } from '@/feature/customer/constants/mock-customers';
import { MOCK_QR_SCANS, relativeTime } from '@/feature/qr-scan/constants/mock-scans';
import type { ScanResult } from '@/feature/qr-scan/types';

type Tab = 'scan' | 'recent'

interface ScanOutcome {
  customerId?: string
  name: string
  result: ScanResult
}

export function QrScanScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('scan');
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const lastScanAt = useRef(0);

  const handleScan = (scan: BarcodeScanningResult) => {
    const now = Date.now();
    if (now - lastScanAt.current < 2500) return;
    lastScanAt.current = now;
    const customer = MOCK_CUSTOMERS.find((c) => c.id === scan.data.trim());
    if (customer) {
      setOutcome({ customerId: customer.id, name: customer.name, result: 'valid' });
    } else {
      setOutcome({ name: 'Unknown code', result: 'invalid' });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.tabBar, { paddingTop: insets.top + Spacing.three }]}>
        <ScreenHeader title="QR Scan" />
        <View style={styles.tabs}>
          {(['scan', 'recent'] as const).map((key) => {
            const selected = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tab, selected && styles.tabSelected]}>
                <ThemedText type="smallBold" style={selected ? styles.tabLabelSelected : styles.tabLabel}>
                  {key === 'scan' ? 'Scan' : 'Recent'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {tab === 'scan' ? (
        <View style={styles.scanArea}>
          {!permission ? (
            <View style={styles.permissionBox}>
              <ThemedText type="default" style={styles.permissionHint}>Requesting camera access…</ThemedText>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <ThemedText type="default" style={styles.permissionTitle}>Camera access needed</ThemedText>
              <ThemedText type="small" style={styles.permissionHint}>
                Allow camera access to scan customer loyalty cards.
              </ThemedText>
              <Pressable onPress={requestPermission} style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.permissionButtonLabel}>Allow camera</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                facing="back"
                enableTorch={torchOn}
                active={!outcome}
                onBarcodeScanned={handleScan}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}>
                <View style={styles.overlay}>
                  <View style={styles.viewfinder} />
                  <ThemedText type="small" style={styles.overlayHint}>Point the camera at a customer loyalty QR code</ThemedText>
                </View>
              </CameraView>
              <Pressable onPress={() => setTorchOn((on) => !on)} style={({ pressed }) => [styles.torchButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.torchLabel}>{torchOn ? 'Torch off' : 'Torch on'}</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <RecentScans />
      )}

      <Modal visible={outcome != null} transparent animationType="fade" onRequestClose={() => setOutcome(null)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            {outcome ? <ScanResultCard outcome={outcome} onClose={() => setOutcome(null)} /> : null}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function ScanResultCard({ outcome, onClose }: { outcome: ScanOutcome; onClose: () => void }) {
  const [awarded, setAwarded] = useState(false);
  const customer = outcome.customerId ? findMockCustomer(outcome.customerId) : undefined;

  if (outcome.result === 'invalid') {
    return (
      <View style={styles.resultBody}>
        <StatusChip tone="danger" label="Invalid code" />
        <ThemedText type="default" style={styles.resultTitle}>Code not recognized</ThemedText>
        <ThemedText type="small" style={styles.resultHint}>This isn&apos;t a valid BuildMate loyalty code.</ThemedText>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.resultButton, pressed && styles.pressed]}>
          <ThemedText type="default" style={styles.resultButtonLabel}>OK</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.resultBody}>
        <StatusChip tone="danger" label="Invalid code" />
        <ThemedText type="default" style={styles.resultTitle}>Customer not found</ThemedText>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.resultButton, pressed && styles.pressed]}>
          <ThemedText type="default" style={styles.resultButtonLabel}>OK</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.resultBody}>
      <StatusChip tone="success" label={awarded ? 'Points awarded' : 'Valid loyalty card'} />
      <ThemedText type="title" style={styles.resultTitle}>{customer.name}</ThemedText>
      {customer.tradeType ? (
        <ThemedText type="small" style={styles.resultHint}>
          {TRADE_TYPE_LABELS[customer.tradeType]} · {CUSTOMER_TYPE_LABELS[customer.type]}
        </ThemedText>
      ) : null}
      <View style={styles.resultStats}>
        <Stat label="Current points" value={`${customer.pointsBalance ?? 0}`} />
        {customer.tradeType ? <Stat label="Earn on this sale" value="+10 pts" /> : null}
      </View>
      <View style={styles.resultActions}>
        {!awarded && customer.tradeType ? (
          <Pressable onPress={() => setAwarded(true)} style={({ pressed }) => [styles.resultButton, pressed && styles.pressed]}>
            <ThemedText type="default" style={styles.resultButtonLabel}>Award 10 points</ThemedText>
          </Pressable>
        ) : null}
        <Pressable onPress={onClose} style={({ pressed }) => [styles.resultButtonGhost, pressed && styles.pressed]}>
          <ThemedText type="default" style={styles.resultButtonGhostLabel}>{awarded ? 'Done' : 'Cancel'}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="small" style={styles.resultHint}>{label}</ThemedText>
      <ThemedText type="default">{value}</ThemedText>
    </View>
  );
}

function RecentScans() {
  return (
    <View style={styles.recentArea}>
      <View style={styles.list}>
        {MOCK_QR_SCANS.map((entry) => (
          <ListItem
            key={entry.id}
            title={entry.customerName}
            subtitle={`${relativeTime(entry.scannedAt)}${entry.scannedBy ? ` · by ${entry.scannedBy}` : ''}`}
            leading={<ResultChip result={entry.result} />}
            trailing={
              entry.pointsAwarded ? (
                <ThemedText type="smallBold" style={styles.pointsText}>+{entry.pointsAwarded} pts</ThemedText>
              ) : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

function ResultChip({ result }: { result: ScanResult }) {
  if (result === 'valid') return <StatusChip tone="success" label="Valid" />;
  if (result === 'redeemed') return <StatusChip tone="steel" label="Redeemed" />;
  return <StatusChip tone="danger" label="Invalid" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Tokens.background,
    borderRadius: Spacing.two,
    padding: Spacing.one,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  tabSelected: {
    backgroundColor: Tokens.card,
  },
  tabLabel: {
    color: Tokens.muted,
  },
  tabLabelSelected: {
    color: Tokens.foreground,
  },
  scanArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  cameraWrap: {
    flex: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  viewfinder: {
    width: 220,
    height: 220,
    borderRadius: Spacing.three,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  overlayHint: {
    color: '#ffffff',
  },
  torchButton: {
    position: 'absolute',
    bottom: Spacing.four,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  torchLabel: {
    color: '#ffffff',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.six,
  },
  permissionTitle: {
    fontWeight: 600,
  },
  permissionHint: {
    color: Tokens.muted,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: Spacing.two,
    backgroundColor: Tokens.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  permissionButtonLabel: {
    color: Tokens.primaryForeground,
  },
  recentArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  list: {
    backgroundColor: Tokens.card,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  pointsText: {
    color: Tokens.success,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Tokens.background,
    borderRadius: Spacing.three,
    padding: Spacing.five,
  },
  resultBody: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  resultTitle: {
    textAlign: 'center',
  },
  resultHint: {
    color: Tokens.muted,
    textAlign: 'center',
  },
  resultStats: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  stat: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  resultButton: {
    flex: 1,
    backgroundColor: Tokens.primary,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  resultButtonGhost: {
    flex: 1,
    backgroundColor: Tokens.card,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  resultButtonLabel: {
    color: Tokens.primaryForeground,
  },
  resultButtonGhostLabel: {
    color: Tokens.foreground,
  },
  pressed: {
    opacity: 0.7,
  },
});

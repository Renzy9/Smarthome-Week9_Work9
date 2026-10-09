import React from 'react';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '../theme/theme';
import { useIoT } from '../context/IoTContext';
import { Device, deviceKinds } from '../models/IoTModels';
import { describeDevice, sensorReadouts } from '../models/homePresentation';
import { isDemoMode } from '../services/IoTService';

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: 0, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22 },
  section: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, marginTop: 12, marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 15, minHeight: 50, marginBottom: 16 },
});


type MainPages = { Dashboard: undefined; Devices: undefined; Sensors: undefined; Settings: undefined };
const pages: { name: keyof MainPages; label: string }[] = [
  { name: 'Dashboard', label: 'Home' }, { name: 'Devices', label: 'Devices' },
  { name: 'Sensors', label: 'Sensors' }, { name: 'Settings', label: 'Settings' },
];
function MobileNavigation() {
  const navigation = useNavigation<NavigationProp<MainPages>>();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const p = usePalette();
  if (width >= 1000) return null;
  return <View style={{ flexDirection: 'row', marginBottom: 18, borderBottomWidth: 1, borderColor: p.border }}>
    {pages.map(page => <Pressable key={page.name} accessibilityRole="button" accessibilityState={{ selected: route.name === page.name }}
      onPress={() => navigation.navigate(page.name)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: route.name === page.name ? 2 : 0, borderColor: p.text }}>
      <Text style={{ color: p.text, fontSize: 13, fontWeight: route.name === page.name ? '700' : '400' }}>{page.label}</Text>
    </Pressable>)}
  </View>;
}

export function Screen({ children, title, subtitle, action }: { children: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode }) {
  const p = usePalette(); const home = useIoT(); const insets = useSafeAreaInsets();
  return <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ padding: 18, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
    refreshControl={<RefreshControl refreshing={home.isRefreshing} onRefresh={() => void home.refresh()} tintColor={p.accent} />}>
    <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', gap: 4 }}>
      <MobileNavigation />
      <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 22, gap: 16 }]}>
        <View style={{ flexShrink: 1 }}>
          <Text style={[ui.title, { color: p.text }]}>{title}</Text><Text style={[ui.subtitle, { color: p.muted }]}>{subtitle}</Text>
        </View>{action}
      </View>
      {isDemoMode && <Text style={{ color: p.text, fontSize: 12, marginBottom: 14 }}>Demo data</Text>}
      {home.gatewayError && <Feedback message={home.gatewayError} retry={() => void home.refresh()} disabled={home.isRefreshing} />}
      {children}
    </View>
  </ScrollView>;
}

export function Button({ label, onPress, disabled, loading, secondary }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; secondary?: boolean }) {
  const p = usePalette(); const inactive = !!disabled || !!loading;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: inactive }} disabled={inactive} onPress={onPress}
    style={({ pressed }) => ({ backgroundColor: p.card, borderWidth: 1, borderColor: secondary ? p.border : p.text, borderRadius: 6, minHeight: 46, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: inactive ? 0.5 : pressed ? 0.75 : 1 })}>
    {loading && <ActivityIndicator size="small" color={p.text} />}<Text style={{ color: p.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
  </Pressable>;
}

export function Card({ children }: { children: React.ReactNode }) {
  const p = usePalette(); return <View style={[ui.card, { backgroundColor: p.card, borderColor: p.border }]}>{children}</View>;
}
export function Feedback({ message, retry, disabled }: { message: string; retry?: () => void; disabled?: boolean }) {
  const p = usePalette(); return <View accessibilityRole="alert" style={[ui.card, { borderColor: p.danger, backgroundColor: p.card, gap: 12 }]}>
    <View style={ui.row}><Ionicons name="alert-circle-outline" color={p.danger} size={22} /><Text style={{ color: p.danger, flex: 1, lineHeight: 21 }}>{message}</Text></View>
    {retry && <View style={{ alignSelf: 'flex-start' }}><Button label="Try again" onPress={retry} disabled={disabled} secondary /></View>}
  </View>;
}
export function Empty({ title, description, loading }: { title: string; description: string; loading?: boolean }) {
  const p = usePalette(); return <Card><View style={{ alignItems: 'center', padding: 18, gap: 12 }}>
    {loading ? <ActivityIndicator color={p.accent} /> : <Ionicons name="cube-outline" size={32} color={p.accent} />}
    <Text style={{ color: p.text, fontWeight: '700', fontSize: 17 }}>{title}</Text><Text style={{ color: p.muted, textAlign: 'center', lineHeight: 21 }}>{description}</Text>
  </View></Card>;
}

export function DeviceCard({ device, onDetails }: { device: Device; onDetails?: () => void }) {
  const p = usePalette(); const home = useIoT(); const busy = home.updatingDeviceIds.includes(device.id);
  return <View style={[ui.card, ui.row, { width: '100%', padding: 12, marginBottom: 0 } , { backgroundColor: p.card, borderColor: p.border }]}>
    <Ionicons name={deviceKinds[device.type].icon} size={22} color={p.text} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ color: p.text, fontSize: 15, fontWeight: '600' }}>{device.name}</Text>
      <Text style={{ color: p.text, fontSize: 12, marginTop: 4 }}>{device.room} · {deviceKinds[device.type].label}</Text>
      <Text accessibilityLiveRegion="polite" style={{ color: p.text, fontSize: 12, marginTop: 4 }}>{describeDevice(device, busy)}</Text>
    </View>
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Switch accessibilityLabel={`${device.name} ${device.type === 'lock' ? 'lock' : 'power'}`} value={device.status}
        disabled={!device.online || !home.isGatewayConnected || busy || home.isRefreshing}
        trackColor={{ false: p.border, true: p.accent }} thumbColor="#FFFFFF" onValueChange={value => void home.toggleDevice(device.id, value)} />
      {onDetails && <Pressable accessibilityRole="button" accessibilityLabel={`Manage ${device.name}`} onPress={onDetails} hitSlop={8} style={{ minHeight: 32, justifyContent: 'center' }}>
        <Text style={{ color: p.text, fontSize: 12, textDecorationLine: 'underline' }}>Manage</Text>
      </Pressable>}
    </View>
  </View>;
}

export function SensorTiles() {
  const p = usePalette(); const { sensors, preferences, isLoadingSensors } = useIoT();
  return <View style={[ui.card, { backgroundColor: p.card, borderColor: p.border, padding: 0 }]}>
    {sensorReadouts(sensors, preferences.fahrenheit).map((reading, index) => <View key={reading.label} style={[ui.row, { padding: 14, borderTopWidth: index ? 1 : 0, borderColor: p.border }]}>
      <Ionicons name={reading.icon} size={20} color={p.text} />
      <Text style={{ flex: 1, color: p.text, fontSize: 14 }}>{reading.label}</Text>
      {isLoadingSensors && !sensors ? <ActivityIndicator color={p.text} /> : <Text style={{ color: p.text, fontSize: 18, fontWeight: '600' }}>{reading.value} {reading.unit}</Text>}
    </View>)}
  </View>;
}
export function Section({ title, action }: { title: string; action?: React.ReactNode }) {
  const p = usePalette(); return <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 6 }]}><Text style={[ui.section, { color: p.text }]}>{title}</Text>{action}</View>;
}

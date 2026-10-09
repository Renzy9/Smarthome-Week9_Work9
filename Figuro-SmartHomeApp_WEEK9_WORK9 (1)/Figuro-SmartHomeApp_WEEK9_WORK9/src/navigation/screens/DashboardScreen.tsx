import React from 'react';
import { Text, View } from 'react-native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useIoT } from '../../context/IoTContext';
import { usePalette } from '../../theme/theme';
import { Button, Card, DeviceCard, Empty, Feedback, Screen, Section, SensorTiles, ui } from '../../components/UI';
import { summarizeHome } from '../../models/homePresentation';
import { HomeRoutes } from '../DrawerNavigator';

export default function DashboardScreen({ navigation }: DrawerScreenProps<HomeRoutes, 'Dashboard'>) {
  const h = useIoT(); const p = usePalette();
  const summary = summarizeHome(h.devices);
  return <Screen title="Home" subtitle={h.preferences.homeName} action={<Button label="Refresh" secondary loading={h.isRefreshing} onPress={() => void h.refresh()} />}>
    <Card>
      <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }]}>
        <View style={ui.row}>
          <Ionicons name={h.isGatewayConnected ? 'wifi-outline' : 'cloud-offline-outline'} size={22} color={p.text} />
          <View><Text style={{ color: p.text, fontWeight: '600', fontSize: 15 }}>{h.gateway?.name ?? 'Home gateway'}</Text>
            <Text style={{ color: p.text, fontSize: 13, marginTop: 5 }}>{h.isRefreshing ? 'Checking connection…' : h.isGatewayConnected ? 'Connected' : 'Unavailable'}</Text></View>
        </View>
        <Text style={{ color: p.text, fontSize: 14 }}>{summary.total} devices · {summary.active} active · {summary.rooms.size} rooms</Text>
      </View>
      <Text style={{ color: p.text, fontSize: 12, marginTop: 14 }}>{summary.online} of {summary.total} devices online</Text>
    </Card>
    <Section title="Sensors" action={<Button label="Sensors" secondary onPress={() => navigation.navigate('Sensors')} />} />
    {h.sensorError && <Feedback message={h.sensorError} retry={() => void h.refresh()} disabled={h.isRefreshing} />}
    <SensorTiles />
    <Section title="Device controls" action={<Button label="Devices" secondary onPress={() => navigation.navigate('Devices')} />} />
    {h.deviceError && <Feedback message={h.deviceError} retry={() => void h.refresh()} disabled={h.isRefreshing} />}
    {h.devices.length ? <View style={[ui.wrap, { marginBottom: 22 }]}>{h.devices.slice(0, 4).map(device => <DeviceCard key={device.id} device={device} />)}</View> : <Empty loading={h.isRefreshing} title={h.isRefreshing ? 'Loading your home' : 'No devices yet'} description="Add your first device from the Devices page." />}
    <Section title="Recent activity" />
    <Card>{h.activity.length ? h.activity.slice(0, 5).map((a, index) => <View key={a.id} style={[ui.row, { paddingVertical: 14, borderTopWidth: index ? 1 : 0, borderColor: p.border }]}>
      <View style={{ padding: 10, backgroundColor: p.tint, borderRadius: 8 }}><Ionicons name="checkmark-outline" size={19} color={p.accent} /></View>
      <View style={{ flex: 1 }}><Text style={{ color: p.text, lineHeight: 21 }}>{a.message}</Text><Text style={{ color: p.muted, fontSize: 12, marginTop: 4 }}>{new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
    </View>) : <View style={[ui.row, { paddingVertical: 6 }]}><Ionicons name="time-outline" size={24} color={p.muted} /><Text style={{ color: p.muted, lineHeight: 22, flex: 1 }}>Device changes during this session will appear here.</Text></View>}</Card>
  </Screen>;
}

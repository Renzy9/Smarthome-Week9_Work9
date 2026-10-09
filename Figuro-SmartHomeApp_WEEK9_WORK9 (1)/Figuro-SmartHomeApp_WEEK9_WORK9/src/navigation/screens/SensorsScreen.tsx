import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIoT } from '../../context/IoTContext';
import { usePalette } from '../../theme/theme';
import { Button, Card, Empty, Feedback, Screen, SensorTiles, ui } from '../../components/UI';
export default function SensorsScreen() {
  const h = useIoT(); const p = usePalette();
  return <Screen title="Sensors" subtitle="View temperature, humidity, and light readings." action={<Button label="Refresh" secondary loading={h.isRefreshing} onPress={() => void h.refresh()} />}>
    {h.sensorError && <Feedback message={h.sensorError} retry={() => void h.refresh()} disabled={h.isRefreshing} />}
    <SensorTiles />
    {!h.sensors && !h.isRefreshing && <Empty title="No readings available" description="Check the gateway connection and refresh your readings." />}
    <Card><View style={ui.row}><Ionicons name="time-outline" size={22} color={p.accent} /><View style={{ flex: 1 }}>
      <Text style={{ color: p.text, fontWeight: '700', marginBottom: 5 }}>{h.sensors ? 'Last update' : 'Waiting for readings'}</Text>
      <Text style={{ color: p.muted, lineHeight: 21 }}>{h.sensors ? new Date(h.sensors.updatedAt).toLocaleString() : 'Connect to your gateway to receive data.'}</Text>
      <Text style={{ color: p.muted, fontSize: 12, marginTop: 8 }}>{h.preferences.autoRefresh ? 'Refreshes every 30 seconds while the app is active.' : 'Automatic refresh is off. Refresh manually for new readings.'}</Text>
    </View></View></Card>
  </Screen>;
}

import React, { useEffect, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIoT } from '../../context/IoTContext';
import { usePalette } from '../../theme/theme';
import { isDemoMode } from '../../services/IoTService';
import { Button, Card, Feedback, Screen, Section, ui } from '../../components/UI';
export default function SettingsScreen() {
  const h = useIoT(); const p = usePalette(); const [name, setName] = useState(h.preferences.homeName); const [saved, setSaved] = useState(false);
  useEffect(() => { setName(h.preferences.homeName); }, [h.preferences.homeName]);
  const toggles = [
    { key: 'darkMode' as const, name: 'Dark appearance', description: 'A softer view for evenings at home.', icon: 'moon-outline' as const },
    { key: 'autoRefresh' as const, name: 'Automatic refresh', description: 'Update devices and readings every 30 seconds.', icon: 'refresh-outline' as const },
    { key: 'fahrenheit' as const, name: 'Use Fahrenheit', description: 'Display temperature in °F instead of °C.', icon: 'thermometer-outline' as const },
  ];
  return <Screen title="Settings" subtitle="Change app settings.">
    {h.preferenceError && <Feedback message={h.preferenceError} />}
    <Section title="Your home" /><Card>
      <Text style={[ui.label, { color: p.text }]}>Home name</Text><TextInput accessibilityLabel="Home name" value={name} maxLength={40} onChangeText={v => { setName(v); setSaved(false); }} style={[ui.input, { color: p.text, borderColor: p.border, backgroundColor: p.bg }]} />
      <View style={[ui.row, { flexWrap: 'wrap' }]}><Button label="Save name" disabled={!name.trim() || name.trim() === h.preferences.homeName} onPress={() => { h.updatePreferences({ homeName: name.trim() }); setSaved(true); }} />{saved && <Text accessibilityLiveRegion="polite" style={{ color: p.accent }}>Home name updated</Text>}</View>
    </Card>
    <Section title="Preferences" /><Card>{toggles.map((t, index) => <View key={t.key} style={[ui.row, { paddingVertical: 18, borderTopWidth: index ? 1 : 0, borderColor: p.border }]}>
      <Ionicons name={t.icon} size={24} color={p.accent} /><View style={{ flex: 1 }}><Text style={{ color: p.text, fontWeight: '600', fontSize: 15 }}>{t.name}</Text><Text style={{ color: p.muted, lineHeight: 19, fontSize: 12, marginTop: 5 }}>{t.description}</Text></View>
      <Switch accessibilityLabel={t.name} value={h.preferences[t.key]} onValueChange={v => h.updatePreferences({ [t.key]: v })} trackColor={{ false: p.border, true: p.accent }} thumbColor="#FFFFFF" />
    </View>)}</Card>
    <Section title="Connection" /><Card><View style={[ui.row, { marginBottom: 20 }]}><Ionicons name="wifi-outline" size={28} color={p.accent} /><View style={{ flex: 1 }}>
      <Text style={{ color: p.text, fontWeight: '700', fontSize: 16 }}>{h.gateway?.name ?? 'Home gateway'}</Text><Text style={{ color: p.muted, marginTop: 6 }}>{h.isRefreshing ? 'Checking…' : h.isGatewayConnected ? 'Connected' : 'Unavailable'}</Text></View></View>
      <Button label="Check connection" secondary loading={h.isRefreshing} onPress={() => void h.refresh()} />
    </Card>
    <Card><Text style={{ color: p.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Figuro Home</Text><Text style={{ color: p.muted, lineHeight: 22 }}>Your space. In sync.</Text><Text style={{ color: p.muted, fontSize: 12, marginTop: 14 }}>Version 1.0.0 · {isDemoMode ? 'Demo mode' : 'Connected service'}</Text></Card>
  </Screen>;
}

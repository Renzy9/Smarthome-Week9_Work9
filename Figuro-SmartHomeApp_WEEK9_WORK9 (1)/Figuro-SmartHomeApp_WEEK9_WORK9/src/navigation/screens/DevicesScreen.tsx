import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useIoT } from '../../context/IoTContext';
import { usePalette } from '../../theme/theme';
import { Device, DeviceKind, deviceKinds } from '../../models/IoTModels';
import { filterDevices, listRooms, summarizeHome } from '../../models/homePresentation';
import { Button, DeviceCard, Empty, Feedback, Screen, ui } from '../../components/UI';

export default function DevicesScreen() {
  const h = useIoT(); const p = usePalette();
  const [search, setSearch] = useState(''); const [room, setRoom] = useState('All rooms');
  const [adding, setAdding] = useState(false); const [selected, setSelected] = useState<Device | null>(null);
  const [name, setName] = useState(''); const [newRoom, setNewRoom] = useState(''); const [kind, setKind] = useState<DeviceKind>('light');
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [confirmRemove, setConfirmRemove] = useState(false);
  const rooms = listRooms(h.devices);
  const shown = filterDevices(h.devices, room, search);
  const close = () => { if (!busy) { setAdding(false); setSelected(null); setError(null); setConfirmRemove(false); } };
  const add = async () => {
    if (!name.trim() || !newRoom.trim()) { setError('Enter a device name and a room.'); return; }
    setBusy(true); setError(null);
    try { await h.addDevice({ name: name.trim(), room: newRoom.trim(), type: kind }); setAdding(false); setName(''); setNewRoom(''); setRoom('All rooms'); setSearch(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to add this device.'); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!selected) return; setBusy(true); setError(null);
    try { await h.removeDevice(selected.id); setSelected(null); setConfirmRemove(false); setRoom('All rooms'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to remove this device.'); } finally { setBusy(false); }
  };
  const inputStyle = [ui.input, { color: p.text, borderColor: p.border, backgroundColor: p.card }];
  return <Screen title="Devices" subtitle="Turn devices on or off." action={<Button label="Add device" onPress={() => { setError(null); setAdding(true); }} disabled={!h.isGatewayConnected || h.isRefreshing} />}>
    <TextInput accessibilityLabel="Search devices" placeholder="Search devices or rooms" placeholderTextColor={p.muted} value={search} onChangeText={setSearch} style={inputStyle} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8 }}>{rooms.map(r => <Pressable key={r} accessibilityRole="button" accessibilityState={{ selected: r === room }} onPress={() => setRoom(r)} style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: 6, backgroundColor: r === room ? p.tint : p.card, borderWidth: 1, borderColor: r === room ? p.text : p.border }}><Text style={{ color: p.text, fontWeight: '600' }}>{r}</Text></Pressable>)}</ScrollView>
    <Text style={{ color: p.muted, marginBottom: 18, fontSize: 12 }}>{shown.length} devices · {summarizeHome(h.devices).online} online</Text>
    {h.deviceError && <Feedback message={h.deviceError} retry={() => void h.refresh()} disabled={h.isRefreshing} />}
    {shown.length ? <View style={ui.wrap}>{shown.map(device => <DeviceCard key={device.id} device={device} onDetails={() => { setError(null); setSelected(device); }} />)}</View> : <Empty loading={h.isRefreshing} title={h.isRefreshing ? 'Loading devices' : h.devices.length ? 'No matching devices' : 'Make yourself at home'} description={h.devices.length ? 'Try another search or room.' : 'Add a device to start controlling your home.'} />}
    <Modal visible={adding || selected !== null} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#00000080', justifyContent: 'center', padding: 20 }}>
        <View accessibilityViewIsModal style={{ backgroundColor: p.bg, borderRadius: 8, padding: 24, width: '100%', maxWidth: 480, alignSelf: 'center', maxHeight: '90%' }}>
          <ScrollView keyboardShouldPersistTaps="handled"><View style={[ui.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
            <Text style={{ color: p.text, fontSize: 22, fontWeight: '700', flex: 1 }}>{adding ? 'Add a device' : selected?.name}</Text><Button label="Close" secondary disabled={busy} onPress={close} /></View>
            {error && <Feedback message={error} />}
            {adding ? <>
              <Text style={{ color: p.muted, lineHeight: 21, marginBottom: 20 }}>Give your device a name, choose its room, and select its type.</Text>
              <Text style={[ui.label, { color: p.text }]}>Device name</Text><TextInput accessibilityLabel="Device name" autoFocus maxLength={60} editable={!busy} value={name} onChangeText={setName} placeholder="e.g. Reading lamp" placeholderTextColor={p.muted} style={inputStyle} />
              <Text style={[ui.label, { color: p.text }]}>Room</Text><TextInput accessibilityLabel="Room" maxLength={40} editable={!busy} value={newRoom} onChangeText={setNewRoom} placeholder="e.g. Living room" placeholderTextColor={p.muted} style={inputStyle} />
              <Text style={[ui.label, { color: p.text }]}>Device type</Text><View style={[ui.wrap, { marginBottom: 24 }]}>{(Object.keys(deviceKinds) as DeviceKind[]).map(k => <Button key={k} label={deviceKinds[k].label} secondary={kind !== k} disabled={busy} onPress={() => setKind(k)} />)}</View>
              <Button label="Add device" loading={busy} onPress={() => void add()} disabled={!h.isGatewayConnected || h.isRefreshing} />
            </> : selected && <>
              <Text style={{ color: p.muted, marginBottom: 20, lineHeight: 22 }}>{selected.room} · {deviceKinds[selected.type].label}{'\n'}{selected.online ? 'Device online' : 'Device offline'}</Text>
              <Text style={{ color: p.muted, lineHeight: 22, marginBottom: 24 }}>Removing a device removes it from your home’s device list. To add it again, register it with your gateway.</Text>
              {confirmRemove ? <><Text style={{ color: p.danger, fontWeight: '600', marginBottom: 16 }}>Remove {selected.name} from your home?</Text><Button label="Confirm removal" loading={busy} onPress={() => void remove()} /><View style={{ height: 10 }} /><Button label="Keep device" secondary disabled={busy} onPress={() => setConfirmRemove(false)} /></> : <Button label="Remove device" secondary disabled={!h.isGatewayConnected || h.isRefreshing || h.updatingDeviceIds.includes(selected.id)} onPress={() => setConfirmRemove(true)} />}
            </>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </Screen>;
}


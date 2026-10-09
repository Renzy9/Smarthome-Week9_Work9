import { Ionicons } from '@expo/vector-icons';
export type DeviceKind = 'light' | 'fan' | 'lock' | 'outlet';
export type Device = { id: number; name: string; type: DeviceKind; room: string; status: boolean; online: boolean };
export type SensorData = { temperature: number; humidity: number; lightLevel: number; updatedAt: string };
export type Gateway = { connected: boolean; name: string };
export type NewDevice = Pick<Device, 'name' | 'type' | 'room'>;
export const deviceKinds: Record<DeviceKind, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  light: { label: 'Smart light', icon: 'bulb-outline' }, fan: { label: 'Smart fan', icon: 'sync-outline' },
  lock: { label: 'Smart lock', icon: 'lock-closed-outline' }, outlet: { label: 'Smart outlet', icon: 'power-outline' },
};
export const sampleDevices: Device[] = [
  { id: 1, name: 'Pendant light', type: 'light', room: 'Living room', status: true, online: true },
  { id: 2, name: 'Ceiling fan', type: 'fan', room: 'Bedroom', status: false, online: true },
  { id: 3, name: 'Front door', type: 'lock', room: 'Entrance', status: true, online: true },
  { id: 4, name: 'Desk lamp', type: 'light', room: 'Study', status: false, online: true },
  { id: 5, name: 'Coffee maker', type: 'outlet', room: 'Kitchen', status: false, online: true },
];

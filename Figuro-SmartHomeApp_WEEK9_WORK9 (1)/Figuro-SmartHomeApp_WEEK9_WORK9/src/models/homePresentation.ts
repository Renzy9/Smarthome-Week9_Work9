import { Device, deviceKinds, SensorData } from './IoTModels';

/** Shared calculations keep the overview, filters and controls consistent. */
export function summarizeHome(devices: Device[]) {
  return devices.reduce((summary, device) => {
    summary.total += 1;
    summary.online += Number(device.online);
    summary.active += Number(device.online && device.status);
    summary.rooms.add(device.room);
    return summary;
  }, { total: 0, online: 0, active: 0, rooms: new Set<string>() });
}

export function listRooms(devices: Device[]) {
  return ['All rooms', ...Array.from(summarizeHome(devices).rooms).sort()];
}

export function filterDevices(devices: Device[], room: string, search: string) {
  const query = search.toLowerCase();
  return devices.filter(device =>
    (room === 'All rooms' || device.room === room) &&
    `${device.name} ${device.room} ${deviceKinds[device.type].label}`.toLowerCase().includes(query));
}

export function describeDevice(device: Device, busy = false) {
  if (busy) return 'Updating…';
  if (!device.online) return 'Offline';
  if (device.type === 'lock') return device.status ? 'Locked' : 'Unlocked';
  return device.status ? 'On' : 'Off';
}

export function sensorReadouts(sensors: SensorData | null, fahrenheit: boolean) {
  return [
    { label: 'Temperature', icon: 'thermometer-outline' as const, value: sensors ? (fahrenheit ? sensors.temperature * 9 / 5 + 32 : sensors.temperature).toFixed(1) : '—', unit: fahrenheit ? '°F' : '°C', hint: 'Room temperature' },
    { label: 'Humidity', icon: 'water-outline' as const, value: sensors ? String(sensors.humidity) : '—', unit: '%', hint: 'Relative humidity' },
    { label: 'Light level', icon: 'sunny-outline' as const, value: sensors ? String(sensors.lightLevel) : '—', unit: 'lx', hint: 'Ambient brightness' },
  ];
}

export function timeGreeting(hour: number) {
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

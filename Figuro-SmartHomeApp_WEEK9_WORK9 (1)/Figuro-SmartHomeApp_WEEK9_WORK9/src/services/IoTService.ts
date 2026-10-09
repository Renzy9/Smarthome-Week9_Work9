import { Device, DeviceKind, Gateway, NewDevice, SensorData, sampleDevices } from '../models/IoTModels';
const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');
export const isDemoMode = !baseUrl;
let tokenProvider: () => Promise<string | null> = async () => null;
/** Supply the token from your backend sign-in flow; never put secrets in public env vars. */
export function setAccessTokenProvider(provider: typeof tokenProvider) { tokenProvider = provider; }
export interface IoTApi {
  getDevices(): Promise<Device[]>;
  getSensorData(): Promise<SensorData>;
  getGateway(): Promise<Gateway>;
  updateDeviceStatus(id: number, status: boolean): Promise<Device>;
  addDevice(input: NewDevice): Promise<Device>;
  removeDevice(id: number): Promise<void>;
}
async function request(path: string, method = 'GET', body?: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const token = await tokenProvider();
    const response = await fetch(`${baseUrl}${path}`, {
      method, signal: controller.signal,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Your session has expired. Please sign in again.');
      throw new Error(`The request failed (${response.status}). Please try again.`);
    }
    return response.status === 204 ? undefined : await response.json();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The gateway took too long to respond. Please try again.');
    if (error instanceof TypeError) throw new Error('Cannot reach your home. Check your connection and try again.');
    throw error;
  } finally { clearTimeout(timeout); }
}
function parseObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') throw new Error('The server returned an invalid response.');
  return value as Record<string, unknown>;
}
function parseDevice(value: unknown): Device {
  const v = parseObject(value);
  if (!Number.isSafeInteger(v.id) || typeof v.name !== 'string' || typeof v.room !== 'string' ||
      !['light', 'fan', 'lock', 'outlet'].includes(v.type as string) || typeof v.status !== 'boolean' || typeof v.online !== 'boolean') {
    throw new Error('The server returned an invalid device.');
  }
  return { id: v.id as number, name: v.name, room: v.room, type: v.type as DeviceKind, status: v.status, online: v.online };
}
function parseSensorData(value: unknown): SensorData {
  const v = parseObject(value);
  if (![v.temperature, v.humidity, v.lightLevel].every(n => typeof n === 'number' && Number.isFinite(n)) ||
      typeof v.updatedAt !== 'string' || !Number.isFinite(Date.parse(v.updatedAt))) throw new Error('The server returned invalid sensor readings.');
  return v as SensorData;
}
const httpApi: IoTApi = {
  async getDevices() {
    const values = await request('/devices');
    if (!Array.isArray(values)) throw new Error('The server returned an invalid device list.');
    const result = values.map(parseDevice);
    if (new Set(result.map(d => d.id)).size !== result.length) throw new Error('The server returned duplicate devices.');
    return result;
  },
  async getSensorData() { return parseSensorData(await request('/sensors')); },
  async getGateway() {
    const value = parseObject(await request('/gateway'));
    if (typeof value.connected !== 'boolean' || typeof value.name !== 'string') throw new Error('The server returned an invalid gateway.');
    return value as Gateway;
  },
  async updateDeviceStatus(id, status) {
    const result = parseDevice(await request(`/devices/${id}`, 'PATCH', { status }));
    if (result.id !== id) throw new Error('The server returned a different device.');
    return result;
  },
  async addDevice(input) { return parseDevice(await request('/devices', 'POST', input)); },
  async removeDevice(id) { await request(`/devices/${id}`, 'DELETE'); },
};
function createDemoApi(): IoTApi {
  let demoDevices = sampleDevices.map(d => ({ ...d }));
  let nextId = 6;
  const pause = () => new Promise(resolve => setTimeout(resolve, 350));
  return {
    async getDevices() { await pause(); return demoDevices.map(d => ({ ...d })); },
    async getSensorData() { await pause(); return { temperature: 26.4, humidity: 62, lightLevel: 680, updatedAt: new Date().toISOString() }; },
    async getGateway() { await pause(); return { connected: true, name: 'Home gateway' }; },
    async updateDeviceStatus(id, status) {
      await pause(); const found = demoDevices.find(d => d.id === id);
      if (!found) throw new Error('Device not found.');
      const result = { ...found, status };
      demoDevices = demoDevices.map(d => d.id === id ? result : d); return { ...result };
    },
    async addDevice(input) { await pause(); const result = { ...input, id: nextId++, status: false, online: true }; demoDevices.push(result); return { ...result }; },
    async removeDevice(id) { await pause(); demoDevices = demoDevices.filter(d => d.id !== id); },
  };
}
export const iotApi: IoTApi = isDemoMode ? createDemoApi() : httpApi;

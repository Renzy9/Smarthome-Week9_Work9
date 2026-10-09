const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function loadService(url = '', fetch = async () => { throw Error('Unexpected HTTP request'); }, timers = {}) {
  const exports = {};
  const transpile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const models = {};
  vm.runInNewContext(transpile('src/models/IoTModels.ts'), { exports: models });
  vm.runInNewContext(transpile('src/services/IoTService.ts'), {
    exports, require: () => models, process: { env: { EXPO_PUBLIC_API_URL: url } }, fetch,
    AbortController, setTimeout: timers.setTimeout ?? setTimeout, clearTimeout: timers.clearTimeout ?? clearTimeout,
  });
  return exports;
}
const sample = { id: 1, name: 'Lamp', room: 'Study', type: 'light', online: true, status: true };
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => value });
test('demo supports create, update, remove without network', async () => {
  const { iotApi, isDemoMode } = loadService(); assert.equal(isDemoMode, true);
  assert.equal((await iotApi.getDevices()).length, 5);
  const added = await iotApi.addDevice({ name: 'Test lamp', room: 'Test room', type: 'light' });
  assert.equal((await iotApi.updateDeviceStatus(added.id, true)).status, true);
  await iotApi.removeDevice(added.id);
  assert.equal((await iotApi.getDevices()).some(d => d.id === added.id), false);
  assert.equal((await iotApi.getGateway()).connected, true);
  assert.equal((await iotApi.getSensorData()).temperature, 26.4);
});
test('HTTP routes, methods, bodies and bearer auth', async () => {
  const calls = [];
  const service = loadService('https://example.test/v1/', async (url, init) => {
    calls.push({ url, ...init });
    if (url.endsWith('/gateway')) return response({ connected: true, name: 'Home' });
    if (url.endsWith('/sensors')) return response({ temperature: 25, humidity: 60, lightLevel: 500, updatedAt: new Date().toISOString() });
    if (init.method === 'DELETE') return response(null, 204);
    return response(init.method === 'GET' ? [sample] : sample);
  });
  service.setAccessTokenProvider(async () => 'test-token');
  await service.iotApi.getDevices(); await service.iotApi.getSensorData(); await service.iotApi.getGateway();
  await service.iotApi.updateDeviceStatus(1, true); await service.iotApi.addDevice({ name: 'Lamp', room: 'Study', type: 'light' }); await service.iotApi.removeDevice(1);
  assert.deepEqual(calls.map(c => c.method), ['GET', 'GET', 'GET', 'PATCH', 'POST', 'DELETE']);
  assert.equal(calls[0].url, 'https://example.test/v1/devices');
  assert.equal(calls[3].body, '{"status":true}');
  assert.ok(calls.every(c => c.headers.Authorization === 'Bearer test-token'));
});
test('invalid and duplicate devices are rejected', async () => {
  for (const data of [{ data: [] }, [{ ...sample, type: 'unknown' }], [sample, sample]]) {
    await assert.rejects(loadService('https://example.test', async () => response(data)).iotApi.getDevices(), /invalid|duplicate/);
  }
});
test('invalid sensors and gateway are rejected', async () => {
  await assert.rejects(loadService('https://example.test', async () => response({ temperature: '25' })).iotApi.getSensorData(), /invalid/);
  await assert.rejects(loadService('https://example.test', async () => response({ connected: 'yes' })).iotApi.getGateway(), /invalid/);
});
test('auth errors and command id mismatches are surfaced', async () => {
  await assert.rejects(loadService('https://example.test', async () => response(null, 401)).iotApi.getDevices(), /session has expired/);
  await assert.rejects(loadService('https://example.test', async () => response({ ...sample, id: 2 })).iotApi.updateDeviceStatus(1, true), /different device/);
});
test('aborted requests show a timeout', async () => {
  const service = loadService('https://example.test', async (_, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(Error('aborted')));
  }), { setTimeout: cb => setTimeout(cb, 1), clearTimeout });
  await assert.rejects(service.iotApi.getDevices(), /too long/);
});

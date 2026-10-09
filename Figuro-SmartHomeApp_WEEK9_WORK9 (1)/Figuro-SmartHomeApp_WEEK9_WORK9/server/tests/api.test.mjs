import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.mjs';
import { readConfig } from '../src/config.mjs';
import { HttpError } from '../src/errors.mjs';

async function withApi(run, overrides = {}) {
  const store = {
    getGateway: async () => ({ connected: true, name: 'Home gateway' }),
    getDevices: async () => [], getSensors: async () => ({ temperature: 26.4, humidity: 62, lightLevel: 680, updatedAt: new Date().toISOString() }),
    addDevice: async input => ({ id: 6, ...input, online: true, status: false }),
    updateDevice: async (id, status) => ({ id, name: 'Lamp', room: 'Study', type: 'light', online: true, status }),
    removeDevice: async () => {}, ...overrides,
  };
  const app = createApp(store, { origins: ['http://localhost:8081'] });
  app.listen(0, '127.0.0.1'); await once(app, 'listening');
  try { await run(`http://127.0.0.1:${app.address().port}`); }
  finally { await new Promise(resolve => app.close(resolve)); }
}
const json = body => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('configuration rejects unsafe database identifiers and invalid ports', () => {
  assert.throws(() => readConfig({ DB_DATABASE: 'test; DROP DATABASE mysql' }));
  assert.throws(() => readConfig({ PORT: 'bad' }));
  assert.equal(readConfig({}).database, 'figuro_smarthome');
});
test('existing frontend routes return direct JSON and booleans', async () => withApi(async url => {
  assert.deepEqual(await (await fetch(url + '/gateway')).json(), { connected: true, name: 'Home gateway' });
  assert.deepEqual(await (await fetch(url + '/devices')).json(), []);
  const added = await fetch(url + '/devices', { method: 'POST', ...json({ name: ' Lamp ', room: ' Study ', type: 'light' }) });
  assert.equal(added.status, 201); assert.equal((await added.json()).name, 'Lamp');
  const changed = await fetch(url + '/devices/6', { method: 'PATCH', ...json({ status: true }) });
  assert.equal((await changed.json()).status, true);
  const removed = await fetch(url + '/devices/6', { method: 'DELETE' });
  assert.equal(removed.status, 204); assert.equal(await removed.text(), '');
}));
test('invalid input is rejected before any database mutation', async () => withApi(async url => {
  const cases = [
    ['/devices', 'POST', { name: '', room: 'Study', type: 'light' }],
    ['/devices', 'POST', { name: 'Lamp', room: 'Study', type: 'unknown' }],
    ['/devices', 'POST', { name: 'Lamp', room: 'Study', type: 'light', online: true }],
    ['/devices/1', 'PATCH', { status: 'true' }],
    ['/devices/1', 'PATCH', { status: true, name: 'Unexpected' }],
    ['/devices/0', 'PATCH', { status: true }],
  ];
  for (const [path, method, body] of cases) assert.equal((await fetch(url + path, { method, ...json(body) })).status, 400);
  assert.equal((await fetch(url + '/devices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })).status, 400);
  assert.equal((await fetch(url + '/devices', { method: 'POST', body: '{}' })).status, 415);
}, { addDevice: () => { throw Error('Unexpected mutation'); }, updateDevice: () => { throw Error('Unexpected mutation'); } }));
test('oversized JSON is refused', async () => withApi(async url => {
  assert.equal((await fetch(url + '/devices', { method: 'POST', ...json({ name: 'x'.repeat(9000) }) })).status, 413);
}));
test('CORS permits configured origins and rejects other origins', async () => withApi(async url => {
  const allowed = await fetch(url + '/devices', { headers: { Origin: 'http://localhost:8081' } });
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8081');
  assert.equal((await fetch(url + '/devices', { headers: { Origin: 'https://unlisted.example' } })).status, 403);
  const preflight = await fetch(url + '/devices', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081' } });
  assert.equal(preflight.status, 204); assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /PATCH/);
}));
test('offline, missing device and database errors have useful status codes', async () => {
  await withApi(async url => {
    assert.equal((await fetch(url + '/devices/1', { method: 'PATCH', ...json({ status: true }) })).status, 409);
    assert.equal((await fetch(url + '/devices/1', { method: 'DELETE' })).status, 404);
  }, { updateDevice: () => { throw new HttpError(409, 'This device is offline.'); }, removeDevice: () => { throw new HttpError(404, 'Device not found.'); } });
  await withApi(async url => {
    const reply = await fetch(url + '/devices'); assert.equal(reply.status, 503);
    assert.equal((await reply.json()).error, 'Database is unavailable. Please try again.');
  }, { getDevices: () => { throw Error('Private database error'); } });
});

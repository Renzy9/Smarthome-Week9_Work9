const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const models = {};
vm.runInNewContext(compile('src/models/IoTModels.ts'), { exports: models });
const presentation = {};
vm.runInNewContext(compile('src/models/homePresentation.ts'), { exports: presentation, require: () => models });
const devices = [
  { id: 1, name: 'Desk lamp', room: 'Study', type: 'light', status: true, online: true },
  { id: 2, name: 'Door', room: 'Entrance', type: 'lock', status: true, online: false },
  { id: 3, name: 'Fan', room: 'Study', type: 'fan', status: false, online: true },
];

test('overview excludes offline devices from active count and counts distinct rooms', () => {
  const summary = presentation.summarizeHome(devices);
  assert.equal(summary.total, 3); assert.equal(summary.active, 1); assert.equal(summary.online, 2); assert.equal(summary.rooms.size, 2);
  assert.equal(presentation.summarizeHome([]).total, 0);
});
test('room and case-insensitive search filters combine and also match device type', () => {
  assert.deepEqual(Array.from(presentation.listRooms(devices)), ['All rooms', 'Entrance', 'Study']);
  assert.deepEqual(Array.from(presentation.filterDevices(devices, 'Study', 'SMART LIGHT'), d => d.id), [1]);
  assert.equal(presentation.filterDevices(devices, 'Entrance', 'lamp').length, 0);
  assert.equal(presentation.filterDevices(devices, 'All rooms', '').length, 3);
});
test('lock labels, offline and pending states preserve priority', () => {
  const lock = { ...devices[1], online: true };
  assert.equal(presentation.describeDevice(lock), 'Locked');
  assert.equal(presentation.describeDevice({ ...lock, status: false }), 'Unlocked');
  assert.equal(presentation.describeDevice(devices[1]), 'Offline');
  assert.equal(presentation.describeDevice(devices[1], true), 'Updating…');
  assert.equal(presentation.describeDevice(devices[2]), 'Off');
});
test('sensor display converts Fahrenheit without changing source data and handles missing readings', () => {
  const reading = { temperature: 26.4, humidity: 62, lightLevel: 680, updatedAt: '2026-10-01T10:00:00Z' };
  assert.equal(presentation.sensorReadouts(reading, false)[0].value, '26.4');
  assert.equal(presentation.sensorReadouts(reading, true)[0].value, '79.5');
  assert.equal(reading.temperature, 26.4);
  assert.ok(presentation.sensorReadouts(null, true).every(tile => tile.value === '—'));
});
test('greetings preserve noon and evening boundaries', () => {
  assert.equal(presentation.timeGreeting(11), 'Good morning');
  assert.equal(presentation.timeGreeting(12), 'Good afternoon');
  assert.equal(presentation.timeGreeting(18), 'Good evening');
});

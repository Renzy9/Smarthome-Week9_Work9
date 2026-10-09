// Uses a uniquely named, temporary database; never modifies the configured app database.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { readConfig } from '../src/config.mjs';
import { setupDatabase } from '../src/setup.mjs';
import { createPool } from '../src/database.mjs';
import { createStore } from '../src/store.mjs';
import { createApp } from '../src/app.mjs';

const database = `figuro_test_${Date.now()}_${randomBytes(4).toString('hex')}`;
const config = readConfig({ ...process.env, DB_DATABASE: database });
let pool, app;
const json = body => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
async function openApi() {
  pool = createPool(config); app = createApp(createStore(pool));
  app.listen(0, '127.0.0.1'); await once(app, 'listening');
  return `http://127.0.0.1:${app.address().port}`;
}
async function closeApi() {
  if (app) { await new Promise(resolve => app.close(resolve)); app = undefined; }
  if (pool) { await pool.end(); pool = undefined; }
}
try {
  await setupDatabase(config);
  await setupDatabase(config);
  let url = await openApi();
  assert.equal((await (await fetch(url + '/devices')).json()).length, 5);
  assert.equal((await (await fetch(url + '/gateway')).json()).connected, true);
  const sensors = await (await fetch(url + '/sensors')).json();
  assert.equal(sensors.temperature, 26.4); assert.ok(Number.isFinite(Date.parse(sensors.updatedAt)));
  const [[{ count }]] = await pool.execute('SELECT COUNT(*) AS count FROM sensor_readings'); assert.equal(count, 1);

  const name = "Professor's lamp; DROP TABLE devices;";
  let response = await fetch(url + '/devices', { method: 'POST', ...json({ name, room: 'Study', type: 'light' }) });
  assert.equal(response.status, 201); const added = await response.json(); assert.equal(added.name, name);
  response = await fetch(url + `/devices/${added.id}`, { method: 'PATCH', ...json({ status: true }) });
  assert.equal((await response.json()).status, true);

  // Recreate the API and its database connection pool to verify actual persistence.
  await closeApi(); url = await openApi();
  const persisted = (await (await fetch(url + '/devices')).json()).find(device => device.id === added.id);
  assert.equal(persisted.name, name); assert.equal(persisted.status, true);
  assert.equal((await fetch(url + '/devices/5', { method: 'DELETE' })).status, 204);
  await setupDatabase(config);
  const afterSetup = await (await fetch(url + '/devices')).json();
  assert.equal(afterSetup.some(device => device.id === 5), false);
  assert.equal(afterSetup.find(device => device.id === added.id).status, true);

  await pool.execute('UPDATE devices SET online = 0 WHERE id = ?', [added.id]);
  assert.equal((await fetch(url + `/devices/${added.id}`, { method: 'PATCH', ...json({ status: false }) })).status, 409);
  await pool.execute('UPDATE devices SET online = 1 WHERE id = ?', [added.id]);
  await pool.execute('UPDATE gateways SET connected = 0 WHERE id = 1');
  assert.equal((await (await fetch(url + '/gateway')).json()).connected, false);
  assert.equal((await fetch(url + '/devices', { method: 'POST', ...json({ name: 'Lamp', room: 'Study', type: 'light' }) })).status, 409);
  await pool.execute('UPDATE gateways SET connected = 1 WHERE id = 1');
  await pool.execute('INSERT INTO sensor_readings (gateway_id, temperature, humidity, light_level, recorded_at) VALUES (1, 27.5, 64, 700, UTC_TIMESTAMP(3) + INTERVAL 1 SECOND)');
  assert.equal((await (await fetch(url + '/sensors')).json()).temperature, 27.5);
  await assert.rejects(pool.execute('INSERT INTO sensor_readings (gateway_id, temperature, humidity, light_level) VALUES (1, 25, 101, 500)'));
  assert.equal((await fetch(url + `/devices/${added.id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await (await fetch(url + '/devices')).json()).some(device => device.id === added.id), false);

  // Parse the standalone Workbench import too, in this disposable database.
  const connection = await mysql.createConnection({ ...config.mysql, multipleStatements: true });
  try {
    const script = await readFile(new URL('../../database/figuro_smarthome.sql', import.meta.url), 'utf8');
    const tablesAndSeed = script.replace(/^CREATE DATABASE[^\n]*\nUSE[^\n]*\n/, '');
    await connection.query(tablesAndSeed);
  } finally { await connection.end(); }
  console.log('MySQL integration passed: schema/import, seed safety, CRUD, persistence, UTC readings, constraints, offline guards, and SQL placeholders.');
} finally {
  await closeApi();
  const cleanup = await mysql.createConnection({ ...config.mysql, database: undefined });
  try { await cleanup.query(`DROP DATABASE IF EXISTS \`${database}\``); }
  finally { await cleanup.end(); }
}

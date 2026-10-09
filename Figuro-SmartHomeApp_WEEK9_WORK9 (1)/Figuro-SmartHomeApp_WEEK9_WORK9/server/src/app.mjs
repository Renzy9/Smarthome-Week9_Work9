import { createServer } from 'node:http';
import { HttpError } from './errors.mjs';
const deviceTypes = new Set(['light', 'fan', 'lock', 'outlet']);

function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Send a JSON object.');
  return value;
}
function onlyFields(value, fields) {
  if (Object.keys(value).some(key => !fields.includes(key))) throw new HttpError(400, 'Unexpected field in request.');
}
function deviceId(value) {
  if (!/^[1-9][0-9]*$/.test(value) || Number(value) > 4294967295) throw new HttpError(400, 'Invalid device id.');
  return Number(value);
}
function newDevice(value) {
  const body = object(value); onlyFields(body, ['name', 'room', 'type']);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const room = typeof body.room === 'string' ? body.room.trim() : '';
  if (!name || name.length > 60 || !room || room.length > 40 || !deviceTypes.has(body.type)) {
    throw new HttpError(400, 'Enter a device name, room, and supported device type.');
  }
  return { name, room, type: body.type };
}
function readJson(request) {
  if ((request.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new HttpError(415, 'Use Content-Type: application/json.');
  }
  return new Promise((resolve, reject) => {
    let bytes = 0; const chunks = []; let settled = false;
    request.on('data', chunk => {
      if (settled) return;
      bytes += chunk.length;
      if (bytes > 8192) { settled = true; reject(new HttpError(413, 'Request is too large.')); return; }
      chunks.push(chunk);
    });
    request.on('error', error => { if (!settled) reject(error); settled = true; });
    request.on('end', () => {
      if (settled) return;
      settled = true;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new HttpError(400, 'Invalid JSON.')); }
    });
  });
}
function send(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(status === 204 ? undefined : JSON.stringify(value));
}
export function createApp(store, { origins = [], logError = () => {} } = {}) {
  const server = createServer(async (request, response) => {
    try {
      const origin = request.headers.origin;
      if (origin) {
        if (!origins.includes(origin)) throw new HttpError(403, 'This web origin is not allowed.');
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Vary', 'Origin');
      }
      if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        send(response, 204); return;
      }
      const path = new URL(request.url, 'http://localhost').pathname.replace(/\/$/, '') || '/';
      if (request.method === 'GET' && path === '/gateway') { send(response, 200, await store.getGateway()); return; }
      if (request.method === 'GET' && path === '/devices') { send(response, 200, await store.getDevices()); return; }
      if (request.method === 'GET' && path === '/sensors') { send(response, 200, await store.getSensors()); return; }
      if (request.method === 'POST' && path === '/devices') {
        send(response, 201, await store.addDevice(newDevice(await readJson(request)))); return;
      }
      const match = /^\/devices\/([^/]+)$/.exec(path);
      if (match && request.method === 'PATCH') {
        const id = deviceId(match[1]); const body = object(await readJson(request)); onlyFields(body, ['status']);
        if (typeof body.status !== 'boolean') throw new HttpError(400, 'status must be true or false.');
        send(response, 200, await store.updateDevice(id, body.status)); return;
      }
      if (match && request.method === 'DELETE') { await store.removeDevice(deviceId(match[1])); send(response, 204); return; }
      throw new HttpError(404, 'Route not found.');
    } catch (error) {
      if (error instanceof HttpError) send(response, error.status, { error: error.message });
      else { logError(error); send(response, 503, { error: 'Database is unavailable. Please try again.' }); }
    }
  });
  server.requestTimeout = 15000; server.headersTimeout = 15000;
  return server;
}

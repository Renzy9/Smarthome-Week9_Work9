import { HttpError } from './errors.mjs';
const columns = 'id, name, room, type, status, online';
const asDevice = row => ({ id: row.id, name: row.name, room: row.room, type: row.type,
  status: row.status === 1, online: row.online === 1 });

export function createStore(pool) {
  async function getGateway(connection = pool) {
    const [rows] = await connection.execute('SELECT name, connected FROM gateways WHERE id = ?', [1]);
    if (!rows.length) throw new HttpError(503, 'Home gateway is not configured.');
    return { name: rows[0].name, connected: rows[0].connected === 1 };
  }
  async function requireGateway(connection = pool) {
    if (!(await getGateway(connection)).connected) throw new HttpError(409, 'Home gateway is offline.');
  }
  return {
    getGateway,
    async getDevices() {
      const [rows] = await pool.execute(`SELECT ${columns} FROM devices WHERE gateway_id = ? ORDER BY id`, [1]);
      return rows.map(asDevice);
    },
    async getSensors() {
      const [rows] = await pool.execute('SELECT temperature, humidity, light_level, recorded_at FROM sensor_readings WHERE gateway_id = ? ORDER BY recorded_at DESC, id DESC LIMIT 1', [1]);
      if (!rows.length) throw new HttpError(404, 'No sensor readings are available.');
      const row = rows[0];
      return { temperature: row.temperature, humidity: row.humidity, lightLevel: row.light_level,
        updatedAt: row.recorded_at.toISOString() };
    },
    async addDevice(input) {
      await requireGateway();
      const [result] = await pool.execute('INSERT INTO devices (gateway_id, name, room, type, status, online) VALUES (?, ?, ?, ?, ?, ?)', [1, input.name, input.room, input.type, 0, 1]);
      return { id: result.insertId, ...input, status: false, online: true };
    },
    async updateDevice(id, status) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await requireGateway(connection);
        const [rows] = await connection.execute(`SELECT ${columns} FROM devices WHERE id = ? AND gateway_id = ? FOR UPDATE`, [id, 1]);
        if (!rows.length) throw new HttpError(404, 'Device not found.');
        if (!rows[0].online) throw new HttpError(409, 'This device is offline.');
        await connection.execute('UPDATE devices SET status = ? WHERE id = ? AND gateway_id = ?', [Number(status), id, 1]);
        await connection.commit();
        return { ...asDevice(rows[0]), status };
      } catch (error) { await connection.rollback(); throw error; }
      finally { connection.release(); }
    },
    async removeDevice(id) {
      await requireGateway();
      const [result] = await pool.execute('DELETE FROM devices WHERE id = ? AND gateway_id = ?', [id, 1]);
      if (!result.affectedRows) throw new HttpError(404, 'Device not found.');
    },
  };
}

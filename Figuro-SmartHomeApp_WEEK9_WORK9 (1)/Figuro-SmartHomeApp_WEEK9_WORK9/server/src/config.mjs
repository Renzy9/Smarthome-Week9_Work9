function integer(value, fallback, label) {
  const parsed = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) throw new Error(`${label} must be a port number.`);
  return parsed;
}
export function readConfig(env = process.env) {
  const database = env.DB_DATABASE || 'figuro_smarthome';
  if (!/^[A-Za-z0-9_]{1,64}$/.test(database)) throw new Error('DB_DATABASE must contain only letters, digits, or underscores.');
  return {
    host: env.HOST || '127.0.0.1', port: integer(env.PORT, 3001, 'PORT'),
    database,
    mysql: { host: env.DB_HOST || '127.0.0.1', port: integer(env.DB_PORT, 3306, 'DB_PORT'),
      user: env.DB_USER || 'root', password: env.DB_PASSWORD || '', database,
      timezone: 'Z', decimalNumbers: true, connectTimeout: 5000 },
    origins: (env.CORS_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081,http://127.0.0.1:8092').split(',').map(s => s.trim()).filter(Boolean),
  };
}

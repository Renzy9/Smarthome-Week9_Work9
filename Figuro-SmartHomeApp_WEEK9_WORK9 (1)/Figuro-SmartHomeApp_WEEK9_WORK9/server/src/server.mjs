import { readConfig } from './config.mjs';
import { createPool } from './database.mjs';
import { createStore } from './store.mjs';
import { createApp } from './app.mjs';

const config = readConfig();
const pool = createPool(config);
try {
  const store = createStore(pool);
  await store.getGateway();
  const server = createApp(store, { origins: config.origins, logError: error => console.error('Database request failed:', error.code || error.name) });
  server.on('error', async error => { console.error('API could not start:', error.code); await pool.end(); process.exitCode = 1; });
  server.listen(config.port, config.host, () => console.log(`Figuro API running at http://${config.host}:${config.port}`));
  const stop = () => server.close(async () => { await pool.end(); process.exit(0); });
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
} catch (error) {
  console.error('Cannot open the Figuro database. Check server/.env and run npm run db:setup.', error.code || error.message);
  await pool.end(); process.exitCode = 1;
}

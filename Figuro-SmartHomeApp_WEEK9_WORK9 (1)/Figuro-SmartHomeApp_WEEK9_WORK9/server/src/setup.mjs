import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { readConfig } from './config.mjs';

export async function setupDatabase(config) {
  const connection = await mysql.createConnection({ ...config.mysql, database: undefined, multipleStatements: true });
  try {
    // The identifier is validated in readConfig; user input is never interpolated into runtime queries.
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${config.database}\``);
    await connection.query(await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8'));
    await connection.query(await readFile(new URL('../../database/seed.sql', import.meta.url), 'utf8'));
  } finally { await connection.end(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  setupDatabase(readConfig()).then(() => console.log('Figuro MySQL database created and seeded.'))
    .catch(error => { console.error('Database setup failed:', error.message); process.exitCode = 1; });
}

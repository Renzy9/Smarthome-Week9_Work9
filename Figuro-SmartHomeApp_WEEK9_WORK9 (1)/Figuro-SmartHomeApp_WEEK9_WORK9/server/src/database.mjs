import mysql from 'mysql2/promise';
export function createPool(config) {
  return mysql.createPool({ ...config.mysql, waitForConnections: true, connectionLimit: 5,
    queueLimit: 20, enableKeepAlive: true });
}

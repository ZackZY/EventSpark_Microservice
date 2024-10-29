import { createPool } from 'mysql2/promise';

const sslConfig = JSON.parse(process.env.DB_SSL || '{"rejectUnauthorized": true}');
// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: sslConfig
};

// Create connection pool
const pool = createPool(dbConfig);

export default pool;

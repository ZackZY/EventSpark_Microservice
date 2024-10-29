import { createPool } from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

// Parse DB_SSL environment variable
const sslConfig = process.env.DB_SSL === 'true' 
  ? {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.join(__dirname, './ap-southeast-1-bundle.pem'))
    }
  : {"rejectUnauthorized": false};

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

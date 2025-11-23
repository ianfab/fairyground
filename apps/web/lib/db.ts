import { Pool } from "pg";
import SQL from "sql-template-strings";
import path from "path";

// In Next.js, we need to manually load the root .env for server-side code
// Next.js auto-loads .env files, but we want to ensure root .env is included
if (typeof window === 'undefined') {
  const dotenv = require('dotenv');
  const rootEnvPath = path.resolve(process.cwd(), '../../.env');
  dotenv.config({ path: rootEnvPath });
}

const rawConnectionString = process.env.DATABASE_URL as string;

// Remove sslmode from connection string - we'll handle SSL explicitly
const connectionString = rawConnectionString?.replace(/[?&]sslmode=\w+/g, '');

// Enable SSL if:
// 1. In production mode, OR
// 2. The original connection string contains sslmode=require, OR  
// 3. Connecting to a cloud database (digitalocean, aws, etc)
const needsSSL = 
  process.env.NODE_ENV === "production" || 
  rawConnectionString?.includes("sslmode=require") ||
  rawConnectionString?.includes("digitalocean.com") ||
  rawConnectionString?.includes("amazonaws.com");

// Configure SSL - allow self-signed certificates
const sslConfig = needsSSL ? {
  rejectUnauthorized: false
} : undefined;

export const pool = new Pool({ 
  connectionString, 
  ssl: sslConfig,
  max: 5, // Reduced bc I implemented digitalocean pooling
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

export async function query<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<{ rows: T[] }>{
  const text = SQL(strings, ...values).text;
  const params = SQL(strings, ...values).values;
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[] };
  } finally {
    client.release();
  }
}


import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
const rootEnvPath = path.resolve(process.cwd(), '../../.env');
const localEnvPath = path.resolve(process.cwd(), '.env.local');
const appEnvPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: localEnvPath });
dotenv.config({ path: appEnvPath });
dotenv.config({ path: rootEnvPath });

const rawConnectionString = process.env.DATABASE_URL as string;

// Remove sslmode from connection string - we'll handle SSL explicitly
const connectionString = rawConnectionString?.replace(/[?&]sslmode=\w+/g, '');

// Enable SSL if needed
const needsSSL = 
  process.env.NODE_ENV === "production" || 
  rawConnectionString?.includes("sslmode=require") ||
  rawConnectionString?.includes("digitalocean.com") ||
  rawConnectionString?.includes("amazonaws.com");

const sslConfig = needsSSL ? {
  rejectUnauthorized: false
} : undefined;

export const pool = new Pool({ 
  connectionString, 
  ssl: sslConfig,
  max: 5, 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 5000,
});

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>{
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[] };
  } finally {
    client.release();
  }
}


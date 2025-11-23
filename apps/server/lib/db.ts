import { Pool } from "pg";
import SQL from "sql-template-strings";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
// In development, we use the root .env file for all apps
// In production, each app can have its own .env
const rootEnvPath = path.resolve(process.cwd(), '../../.env');
const localEnvPath = path.resolve(process.cwd(), '.env.local');
const appEnvPath = path.resolve(process.cwd(), '.env');

// Priority: .env.local (app-specific) > .env (app-specific) > ../../.env (root)
dotenv.config({ path: localEnvPath });
dotenv.config({ path: appEnvPath });
dotenv.config({ path: rootEnvPath });

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
  max: 5, 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 5000,
});

export async function query<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<{ rows: T[] }>{
  const text = (SQL as any)(strings, ...values).text;
  const params = (SQL as any)(strings, ...values).values;
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[] };
  } finally {
    client.release();
  }
}

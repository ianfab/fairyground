import { query } from "../lib/db.js";

async function main() {
  try {
    await query`
      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        creator_username TEXT,
        creator_id TEXT,
        creator_email TEXT,
        play_count INTEGER DEFAULT 0,
        last_played_at TIMESTAMP,
        preview BOOLEAN DEFAULT false,
        tags TEXT[] DEFAULT '{}'::text[]
      );
    `;
    console.log("Table 'games' created or already exists.");
  } catch (err) {
    console.error("Error creating table:", err);
  }
}

main();


import { query } from "../lib/db.js";

/**
 * Migration script to add play statistics columns to the games table
 */
async function main() {
  try {
    // Add play_count column if it doesn't exist
    await query`
      ALTER TABLE games 
      ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0;
    `;
    console.log("✅ Added play_count column to games table");

    // Add last_played_at column to track when a game was last played
    await query`
      ALTER TABLE games 
      ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMP;
    `;
    console.log("✅ Added last_played_at column to games table");

    console.log("\n🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Error during migration:", err);
    process.exit(1);
  }
  
  process.exit(0);
}

main();


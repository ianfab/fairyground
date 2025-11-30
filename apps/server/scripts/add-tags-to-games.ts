import { query } from "../lib/db.js";

/**
 * Migration script to add tags column to games table
 */
async function main() {
  try {
    // Add tags column as a text array with an empty-array default
    await query`
      ALTER TABLE games 
      ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];
    `;
    console.log("✅ Added tags column to games table");

    // Add a GIN index for efficient tag-based filtering
    await query`
      CREATE INDEX IF NOT EXISTS idx_games_tags ON games USING GIN (tags);
    `;
    console.log("✅ Created idx_games_tags GIN index");

    console.log("\n🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Error during migration:", err);
    process.exit(1);
  }

  process.exit(0);
}

main();



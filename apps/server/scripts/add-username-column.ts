import { query } from "../lib/db.js";

async function main() {
  try {
    // Add username column to player_elo table
    await query`
      ALTER TABLE player_elo
      ADD COLUMN IF NOT EXISTS username TEXT
    `;
    console.log("✓ Added username column to player_elo table");

    console.log("\n✅ Migration complete!");
  } catch (err) {
    console.error("❌ Error during migration:", err);
    process.exit(1);
  }
}

main();

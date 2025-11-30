import { query } from "../lib/db.js";

/**
 * Migration script to add is_shipped column to drafts table
 */
async function main() {
  try {
    // Add is_shipped column
    await query`
      ALTER TABLE drafts 
      ADD COLUMN IF NOT EXISTS is_shipped BOOLEAN DEFAULT FALSE;
    `;
    console.log("✅ Added is_shipped column to drafts table");

    console.log("\n🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Error during migration:", err);
    process.exit(1);
  }
  
  process.exit(0);
}

main();


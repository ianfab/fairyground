import { query } from "../lib/db.js";

/**
 * Migration script to add drafts table for saving game generation prompts
 */
async function main() {
  try {
    // Create drafts table
    await query`
      CREATE TABLE IF NOT EXISTS drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        template TEXT NOT NULL,
        game_description TEXT NOT NULL,
        name TEXT,
        description TEXT,
        model TEXT DEFAULT 'gpt-5',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("✅ Created drafts table");

    // Create index on user_id for faster queries
    await query`
      CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
    `;
    console.log("✅ Created index on user_id");

    // Create index on created_at for sorting
    await query`
      CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);
    `;
    console.log("✅ Created index on created_at");

    console.log("\n🎉 Drafts table migration completed successfully!");
  } catch (err) {
    console.error("❌ Error during migration:", err);
    process.exit(1);
  }
  
  process.exit(0);
}

main();


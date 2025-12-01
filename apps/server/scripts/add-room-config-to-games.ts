import { query } from "../lib/db.js";

/**
 * Migration script to add room configuration columns to the games tables.
 *
 * Adds:
 * - min_players_per_room INTEGER NOT NULL DEFAULT 2
 * - max_players_per_room INTEGER NOT NULL DEFAULT 2
 * - has_win_condition BOOLEAN NOT NULL DEFAULT true
 * - can_join_late BOOLEAN NOT NULL DEFAULT false
 *
 * Applied to both `games` and `games_dev`.
 */
async function main() {
  try {
    console.log("Adding room config columns to games table...");

    await query`
      ALTER TABLE games
      ADD COLUMN IF NOT EXISTS min_players_per_room INTEGER NOT NULL DEFAULT 2
    `;
    await query`
      ALTER TABLE games
      ADD COLUMN IF NOT EXISTS max_players_per_room INTEGER NOT NULL DEFAULT 2
    `;
    await query`
      ALTER TABLE games
      ADD COLUMN IF NOT EXISTS has_win_condition BOOLEAN NOT NULL DEFAULT true
    `;
    await query`
      ALTER TABLE games
      ADD COLUMN IF NOT EXISTS can_join_late BOOLEAN NOT NULL DEFAULT false
    `;

    console.log("✅ Added room config columns to games table");

    console.log("Adding room config columns to games_dev table (if it exists)...");

    // games_dev is only present in development; guard with IF EXISTS
    await query`
      DO $$
      BEGIN
        IF TO_REGCLASS('public.games_dev') IS NOT NULL THEN
          ALTER TABLE games_dev
          ADD COLUMN IF NOT EXISTS min_players_per_room INTEGER NOT NULL DEFAULT 2;
          ALTER TABLE games_dev
          ADD COLUMN IF NOT EXISTS max_players_per_room INTEGER NOT NULL DEFAULT 2;
          ALTER TABLE games_dev
          ADD COLUMN IF NOT EXISTS has_win_condition BOOLEAN NOT NULL DEFAULT true;
          ALTER TABLE games_dev
          ADD COLUMN IF NOT EXISTS can_join_late BOOLEAN NOT NULL DEFAULT false;
        END IF;
      END
      $$;
    `;

    console.log("✅ Ensured room config columns exist on games_dev table");

    console.log("\n🎉 Room config migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during room config migration:", err);
    process.exit(1);
  }
}

main();



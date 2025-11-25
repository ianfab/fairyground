import { query } from "../lib/db.js";

async function main() {
  try {
    // Create player_elo table to track ELO ratings per game per player
    await query`
      CREATE TABLE IF NOT EXISTS player_elo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id TEXT NOT NULL,
        game_name TEXT NOT NULL,
        elo_rating INTEGER DEFAULT 1000,
        games_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        last_played_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(player_id, game_name)
      );
    `;
    console.log("✓ Table 'player_elo' created or already exists.");

    // Create game_results table to track individual game outcomes
    await query`
      CREATE TABLE IF NOT EXISTS game_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_name TEXT NOT NULL,
        room_id TEXT NOT NULL,
        winner_id TEXT,
        end_reason TEXT,
        players JSONB NOT NULL,
        elo_changes JSONB,
        ended_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("✓ Table 'game_results' created or already exists.");

    // Create indexes for better query performance
    await query`
      CREATE INDEX IF NOT EXISTS idx_player_elo_player_id ON player_elo(player_id);
    `;
    await query`
      CREATE INDEX IF NOT EXISTS idx_player_elo_game_name ON player_elo(game_name);
    `;
    await query`
      CREATE INDEX IF NOT EXISTS idx_game_results_game_name ON game_results(game_name);
    `;
    console.log("✓ Indexes created.");

    console.log("\n✅ ELO rating system database setup complete!");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
    process.exit(1);
  }
}

main();

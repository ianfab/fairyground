#!/usr/bin/env tsx
import { query } from '../lib/db.js';

/**
 * Initialize games_dev table with all migrations applied
 * This creates a development version of the games table with the full schema
 */
async function initGamesDev() {
  try {
    console.log('Creating games_dev table...');

    // Create the table with all columns from all migrations
    await query`
      CREATE TABLE IF NOT EXISTS games_dev (
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
        preview BOOLEAN DEFAULT false
      )
    `;

    console.log('✓ Created games_dev table');

    // Create indexes
    await query`
      CREATE INDEX IF NOT EXISTS idx_games_dev_creator_username ON games_dev(creator_username)
    `;
    console.log('✓ Created index on creator_username');

    await query`
      CREATE INDEX IF NOT EXISTS idx_games_dev_creator_id ON games_dev(creator_id)
    `;
    console.log('✓ Created index on creator_id');

    console.log('\n🎉 games_dev table initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing games_dev table:', error);
    process.exit(1);
  }
}

initGamesDev();


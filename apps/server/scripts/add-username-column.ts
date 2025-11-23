#!/usr/bin/env tsx
import { query } from '../lib/db.js';

async function addUsernameColumn() {
  try {
    console.log('Adding creator_username column to games table...');

    await query`
      ALTER TABLE games
      ADD COLUMN IF NOT EXISTS creator_username TEXT
    `;

    console.log('✓ Successfully added creator_username column');

    // Create index for faster lookups
    await query`
      CREATE INDEX IF NOT EXISTS idx_games_creator_username ON games(creator_username)
    `;

    console.log('✓ Created index on creator_username');
    console.log('Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addUsernameColumn();

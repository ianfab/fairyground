#!/usr/bin/env tsx
import { query } from '../lib/db.js';

async function addCreatorMetadata() {
  console.log('Adding creator metadata columns to games table...');

  try {
    // Add creator_id and creator_email columns
    await query`
      ALTER TABLE games
      ADD COLUMN IF NOT EXISTS creator_id TEXT,
      ADD COLUMN IF NOT EXISTS creator_email TEXT
    `;

    console.log('✓ Successfully added creator_id and creator_email columns');

    // Create index for better query performance
    await query`
      CREATE INDEX IF NOT EXISTS idx_games_creator_id ON games(creator_id)
    `;

    console.log('✓ Created index on creator_id');

    process.exit(0);
  } catch (error) {
    console.error('Error adding creator metadata:', error);
    process.exit(1);
  }
}

addCreatorMetadata();

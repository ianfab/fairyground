#!/usr/bin/env tsx
import { query, getGamesTableName } from '../lib/db.js';

async function listGames() {
  try {
    const tableName = getGamesTableName();
    const result = await query(
      `SELECT name FROM ${tableName} ORDER BY created_at DESC LIMIT 30`
    );
    console.log('Games in database:');
    result.rows.forEach((r, i) => console.log(`${i+1}. "${r.name}"`));

    // Check for the specific game
    const snakeGame = await query(
      `SELECT name FROM ${tableName} WHERE name LIKE '%snake%awesome%'`
    );
    console.log('\nGames matching "snake awesome":');
    snakeGame.rows.forEach(r => console.log(`  - "${r.name}"`));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listGames();

#!/usr/bin/env tsx
import { query, getGamesTableName } from '../lib/db.js';

async function verifySchema() {
  try {
    const tableName = getGamesTableName();
    const result = await query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      tableName
    );

    console.log(`${tableName} table schema:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    const games = await query(
      `SELECT name, creator_email FROM ${tableName} WHERE creator_email IS NOT NULL LIMIT 5`
    );
    console.log(`\nGames with creator info: ${games.rows.length}`);
    if (games.rows.length > 0) {
      games.rows.forEach(g => console.log(`  - ${g.name}: ${g.creator_email}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifySchema();

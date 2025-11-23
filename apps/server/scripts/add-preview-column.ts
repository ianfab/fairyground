import { query } from '../lib/db.js';

async function addPreviewColumn() {
  try {
    console.log('Adding preview column to games table...');
    
    // Add preview column with default false
    await query`
      ALTER TABLE games 
      ADD COLUMN IF NOT EXISTS preview BOOLEAN DEFAULT false
    `;
    
    console.log('✅ Successfully added preview column');
  } catch (error) {
    console.error('❌ Error adding preview column:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

addPreviewColumn();


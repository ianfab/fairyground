import { query } from "../lib/db.js";

async function checkGames() {
  try {
    const { rows } = await query`SELECT name, LEFT(code, 300) as code_preview FROM games`;
    
    console.log('\n=== Games in Database ===\n');
    rows.forEach((game: any) => {
      console.log(`Game: ${game.name}`);
      console.log(`Code preview:\n${game.code_preview}\n`);
      console.log('---\n');
    });
    
    // Check for serverLogic
    const { rows: fullRows } = await query`SELECT name, code FROM games`;
    fullRows.forEach((game: any) => {
      const hasInitGameClient = game.code.includes('function initGameClient');
      const hasServerLogic = game.code.includes('const serverLogic') || game.code.includes('var serverLogic');
      
      console.log(`\nGame: ${game.name}`);
      console.log(`  - Has initGameClient: ${hasInitGameClient}`);
      console.log(`  - Has serverLogic: ${hasServerLogic}`);
      
      if (!hasServerLogic) {
        console.log(`  ⚠️  WARNING: Missing serverLogic!`);
      }
    });
    
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

checkGames();


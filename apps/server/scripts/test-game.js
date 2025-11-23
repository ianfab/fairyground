import { query } from "../lib/db.js";
import vm from "vm";
async function testGame(gameName) {
    try {
        const { rows } = await query `SELECT * FROM games WHERE name = ${gameName}`;
        if (rows.length === 0) {
            console.log(`Game '${gameName}' not found`);
            return;
        }
        const game = rows[0];
        console.log(`\n=== Testing Game: ${game.name} ===\n`);
        console.log('Code length:', game.code.length);
        console.log('\n--- Full Code ---\n');
        console.log(game.code);
        console.log('\n--- Attempting to Execute ---\n');
        // Try to execute like the server does (with wrapping)
        const wrappedCode = `
      ${game.code}
      
      // Export serverLogic if it exists
      if (typeof serverLogic !== 'undefined') {
        exportedServerLogic = serverLogic;
      }
    `;
        const sandbox = {
            console: console,
            exportedServerLogic: undefined,
            document: undefined,
            window: undefined
        };
        const context = vm.createContext(sandbox);
        try {
            const script = new vm.Script(wrappedCode);
            script.runInContext(context);
            console.log('✅ Code executed successfully');
            console.log('exportedServerLogic:', sandbox.exportedServerLogic ? 'FOUND' : 'NOT FOUND');
            if (sandbox.exportedServerLogic) {
                console.log('initialState:', sandbox.exportedServerLogic.initialState ? 'FOUND' : 'NOT FOUND');
                console.log('moves:', sandbox.exportedServerLogic.moves ? 'FOUND' : 'NOT FOUND');
                if (sandbox.exportedServerLogic.moves) {
                    console.log('Available moves:', Object.keys(sandbox.exportedServerLogic.moves));
                }
            }
        }
        catch (e) {
            console.error('❌ Execution error:', e.message);
            console.error(e.stack);
        }
    }
    catch (err) {
        console.error("Error:", err);
    }
    process.exit(0);
}
const gameName = process.argv[2] || 'bing';
testGame(gameName);
//# sourceMappingURL=test-game.js.map
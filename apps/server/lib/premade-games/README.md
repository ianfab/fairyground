# Premade Games

This directory contains individual game modules that are bundled with the server.

## Structure

Each game is defined in its own TypeScript file with the following structure:

```typescript
export default {
  name: "gameName",
  description: "Game description",
  code: `
    // Full game code here (client + server logic)
  `
};
```

## Available Games

- **clicker.ts** - Simple clicker game for competing with friends
- **pong.ts** - Classic Pong with two-player support
- **tetris.ts** - Classic Tetris with standard controls
- **shooter.ts** - First-person 3D shooter using Three.js
- **chess.ts** - Full Chess game with drag-and-drop

## Adding a New Game

1. Create a new `.ts` file in this directory (e.g., `mygame.ts`)
2. Follow the structure above with `name`, `description`, and `code` properties
3. Import the game in `/lib/premade-games.ts`:
   ```typescript
   import mygame from './premade-games/mygame.js';
   ```
4. Add it to the `PREMADE_GAMES` export:
   ```typescript
   export const PREMADE_GAMES = {
     // ... existing games
     mygame
   };
   ```
5. Build the server: `npm run build`

## Game Code Requirements

Each game's `code` property must include:

1. **Client-side**: `initGameClient(container, socket, roomId, emitAction)` function
2. **Server-side**: `serverLogic` constant with `initialState` and `moves`

See [GAME_CODE_STANDARD.md](../../GAME_CODE_STANDARD.md) for full details.

## Testing

To test that games load correctly:
```bash
node -e "import('./lib/premade-games.js').then(m => console.log(Object.keys(m.PREMADE_GAMES)))"
```

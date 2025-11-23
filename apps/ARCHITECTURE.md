# Game Architecture

## Overview
Games are **created** on the Next.js app (localhost:3000) but **run** on the Node.js server (localhost:3001).

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App (localhost:3000)                               │
│  - Game creation UI                                         │
│  - Template selection                                       │
│  - AI code generation                                       │
│  - Game listing                                             │
│  - Writes to database                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Saves game code to DB
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                        │
│  - Stores game metadata                                     │
│  - Stores game code (client + server logic)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Reads game code
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Node.js Game Server (localhost:3001)                      │
│  - Serves game HTML/JS                                      │
│  - Handles Socket.io connections                            │
│  - Executes server-side game logic                          │
│  - Manages game rooms and state                             │
│  - Multiplayer synchronization                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Players connect
                            ▼
                    ┌───────────────┐
                    │   Browser     │
                    │   Game Client │
                    └───────────────┘
```

## Game Code Structure

Each game must export two parts:

### 1. Client-Side Code
```javascript
function initGameClient(container, socket, roomId, emitAction) {
  // Initialize game in the browser
  // - Render graphics
  // - Handle user input
  // - Update UI based on state
  
  return {
    onStateUpdate: (state) => {
      // Called when server sends state updates
    }
  };
}
```

### 2. Server-Side Code
```javascript
const serverLogic = {
  initialState: {
    // Initial game state
  },
  moves: {
    actionName: (state, payload, playerId) => {
      // Mutate state based on player actions
    }
  }
};
```

## URLs

- **Create Game**: `http://localhost:3000/create`
- **View Games**: `http://localhost:3000`
- **Play Game**: `http://localhost:3001/game/{gameName}`
- **Join Room**: `http://localhost:3001/game/{gameName}` → Enter room name

## Room Structure

Rooms are identified as: `{gameName}/{roomName}`

Example:
- Game: `chess-960`
- Room: `lobby-1`
- Full Room ID: `chess-960/lobby-1`

Multiple rooms can exist for the same game simultaneously.

## Development Workflow

1. **Create Game** (localhost:3000)
   - Select template
   - Describe game to AI
   - Generate code
   - Ship to database

2. **Play Game** (localhost:3001)
   - Navigate to game URL
   - Enter room name
   - Play with friends

## Benefits of This Architecture

1. **Separation of Concerns**: Creation UI separate from game runtime
2. **Performance**: Node.js server optimized for real-time games
3. **Scalability**: Game server can be deployed independently
4. **Security**: Server-side game logic prevents cheating
5. **Flexibility**: Easy to add game server features (bots, matchmaking)

## Future Enhancements

- Deploy game server to production (separate from Next.js)
- Add matchmaking service
- Implement bot opponents
- Add spectator mode
- Game analytics and leaderboards


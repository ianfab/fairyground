# Game Code Standard Structure

## Overview
All games must follow this exact structure to work with the multiplayer server.

## Required Structure

```javascript
// ============================================
// CLIENT-SIDE CODE
// ============================================
// This runs in the browser and handles rendering and user input

/**
 * Initialize the game client
 * @param {HTMLElement} container - The DOM element to render the game into
 * @param {Socket} socket - Socket.io client instance
 * @param {string} roomId - Current room ID (format: "gameName/roomName")
 * @param {Function} emitAction - Function to send actions to server
 * @returns {Object} Game instance with onStateUpdate method
 */
function initGameClient(container, socket, roomId, emitAction) {
  // 1. Create your game UI/canvas
  // 2. Set up event listeners for user input
  // 3. Return an object with onStateUpdate method
  
  return {
    // REQUIRED: This method is called whenever the server sends a state update
    onStateUpdate: (state) => {
      // Update your game's visual representation based on the new state
    },
    
    // OPTIONAL: Add any other methods you need
    cleanup: () => {
      // Clean up resources when game ends
    }
  };
}

// ============================================
// SERVER-SIDE CODE
// ============================================
// This runs on the Node.js server and manages game state

/**
 * Server-side game logic
 * MUST be assigned to a variable named 'serverLogic'
 */
const serverLogic = {
  // REQUIRED: Initial game state when a room is created
  initialState: {
    // Define your game's starting state
    // Example: { score: 0, players: {}, board: [] }
  },
  
  // REQUIRED: Object containing all possible game actions
  moves: {
    /**
     * Each move is a function that mutates the game state
     * @param {Object} state - Current game state (mutable)
     * @param {any} payload - Data sent from client
     * @param {string} playerId - Socket ID of the player who sent the action
     */
    actionName: (state, payload, playerId) => {
      // Mutate state directly
      // Example: state.score += 1;
    },
    
    // Add more actions as needed
    anotherAction: (state, payload, playerId) => {
      // ...
    }
  }
};
```

## Complete Example: Clicker Game

```javascript
// ============================================
// CLIENT-SIDE CODE
// ============================================
function initGameClient(container, socket, roomId, emitAction) {
  // Create UI
  container.innerHTML = \`
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 20px;">
      <h1 style="font-size: 48px; color: #fff;">Click Counter</h1>
      <div id="score" style="font-size: 72px; font-weight: bold; color: #0f0;">0</div>
      <button id="click-btn" style="padding: 20px 40px; font-size: 24px; cursor: pointer; border-radius: 10px; border: none; background: #fff; color: #000;">
        Click Me!
      </button>
      <div id="players" style="color: #888; margin-top: 20px;"></div>
    </div>
  \`;
  
  // Get DOM elements
  const scoreEl = document.getElementById('score');
  const clickBtn = document.getElementById('click-btn');
  const playersEl = document.getElementById('players');
  
  // Set up event listener
  clickBtn.addEventListener('click', () => {
    // Send action to server
    emitAction('click', { timestamp: Date.now() });
  });
  
  // Return game instance
  return {
    onStateUpdate: (state) => {
      // Update score display
      scoreEl.textContent = state.score || 0;
      
      // Update player list
      if (state.players) {
        const playerList = Object.entries(state.players)
          .map(([id, data]) => \`Player \${id.substring(0, 6)}: \${data.clicks || 0} clicks\`)
          .join('<br>');
        playersEl.innerHTML = playerList;
      }
    }
  };
}

// ============================================
// SERVER-SIDE CODE
// ============================================
const serverLogic = {
  initialState: {
    score: 0,
    players: {}
  },
  
  moves: {
    click: (state, payload, playerId) => {
      // Initialize player if first click
      if (!state.players[playerId]) {
        state.players[playerId] = { clicks: 0 };
      }
      
      // Increment scores
      state.score += 1;
      state.players[playerId].clicks += 1;
    }
  }
};
```

## Key Rules

### ✅ DO:
1. **Always define `initGameClient` function** - This is called to start your game
2. **Always return object with `onStateUpdate` method** - This receives state updates
3. **Always define `serverLogic` constant** - Must be named exactly this
4. **Always include `initialState`** - Defines starting game state
5. **Always include `moves` object** - Contains all possible actions
6. **Mutate state directly** - Don't return new state, modify the existing one
7. **Use `emitAction(actionName, payload)`** - To send actions to server
8. **Handle all your rendering in `onStateUpdate`** - This is called on every state change

### ❌ DON'T:
1. Don't use `export` or `import` statements
2. Don't use external libraries unless specified in template
3. Don't try to access `window`, `document`, or DOM outside `initGameClient`
4. Don't use `async/await` in move functions (keep them synchronous)
5. Don't store state in closures - use the server state
6. Don't assume player order or specific player IDs

## Communication Flow

```
User Action (click, key press, etc.)
    ↓
emitAction('actionName', { data })
    ↓
Socket.io sends to server
    ↓
Server finds room and executes serverLogic.moves.actionName()
    ↓
Server broadcasts updated state to all players in room
    ↓
Client receives state_update event
    ↓
gameInstance.onStateUpdate(newState) is called
    ↓
UI updates to reflect new state
```

## Testing Your Game

1. **Create the game** at http://localhost:3000/create
2. **Open game** at http://localhost:3001/game/your-game-name
3. **Open multiple tabs** to test multiplayer
4. **Check browser console** for errors
5. **Check server logs** for server-side errors

## Common Errors

### "Game code must define initGameClient() function"
- You forgot to define the `initGameClient` function
- Or you misspelled it

### "Game code must define serverLogic"
- You forgot to define `const serverLogic = { ... }`
- Or you misspelled it

### "serverLogic must have initialState"
- Your `serverLogic` object is missing the `initialState` property

### "serverLogic must have moves object"
- Your `serverLogic` object is missing the `moves` property
- Or `moves` is not an object

### "Unknown action: actionName"
- You're calling `emitAction('actionName', ...)` but there's no `actionName` in `serverLogic.moves`
- Check spelling and case sensitivity

## Advanced Features

### Accessing Socket Directly
```javascript
function initGameClient(container, socket, roomId, emitAction) {
  // You can listen to custom events
  socket.on('custom_event', (data) => {
    console.log('Custom event:', data);
  });
  
  // But prefer using emitAction for game actions
  return { onStateUpdate: (state) => {} };
}
```

### Cleanup
```javascript
function initGameClient(container, socket, roomId, emitAction) {
  const interval = setInterval(() => {
    // Do something periodically
  }, 1000);
  
  return {
    onStateUpdate: (state) => {},
    cleanup: () => {
      clearInterval(interval);
    }
  };
}
```

### Player-Specific State
```javascript
const serverLogic = {
  initialState: {
    players: {}
  },
  moves: {
    join: (state, payload, playerId) => {
      // Initialize player-specific state
      state.players[playerId] = {
        x: 0,
        y: 0,
        score: 0,
        color: payload.color
      };
    }
  }
};
```


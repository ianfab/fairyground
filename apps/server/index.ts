import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { query } from "./lib/db.js";
import type { Game, GameStats } from "./lib/types.js";
import { PREMADE_GAMES } from "./lib/premade-games.js";
import vm from "vm";
import path from "path";
import { fileURLToPath } from 'url';
import { Chess } from 'chess.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure allowed origins for CORS and iframe embedding
const isDevelopment = process.env.NODE_ENV === 'development';

// Allow custom origins from environment variable (comma-separated)
// Example: ALLOWED_ORIGINS=https://example.com,https://another.com
const customOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

const defaultOrigins = isDevelopment 
  ? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ]
  : [
      'https://splork.io',
      'https://www.splork.io',
      'https://play.splork.io'
    ];

const allowedOrigins = [...defaultOrigins, ...customOrigins];

console.log('🔒 Allowed origins for CORS and iframe embedding:', allowedOrigins);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Still allow for now, but log it
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Headers for iframe embedding
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set Content-Security-Policy to allow iframe embedding from allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Content-Security-Policy', `frame-ancestors ${allowedOrigins.join(' ')}`);
  } else {
    // Allow all origins for iframe embedding in development, or if origin not specified
    res.setHeader('Content-Security-Policy', `frame-ancestors ${allowedOrigins.join(' ')}`);
  }
  
  // Don't set X-Frame-Options since we're using CSP frame-ancestors
  // (X-Frame-Options would conflict with CSP)
  
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// In-memory storage for rooms
interface Room {
  id: string;
  gameId: string;
  gameName: string;
  state: any;
  players: Map<string, any>;
  logic: {
    moves: Record<string, (state: any, ...args: any[]) => void>;
    initialState: any;
  };
  tickInterval?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();

// Matchmaking queue
interface MatchmakingPlayer {
  playerId: string;
  gameName: string;
  timestamp: number;
}

interface MatchmakingResult {
  status: 'waiting' | 'matched';
  roomId?: string;
}

const matchmakingQueue: MatchmakingPlayer[] = [];
const matchmakingResults = new Map<string, MatchmakingResult>();

// Function to try to match players
function tryMatchPlayers() {
  // Group players by game
  const playersByGame = new Map<string, MatchmakingPlayer[]>();
  
  matchmakingQueue.forEach(player => {
    const players = playersByGame.get(player.gameName) || [];
    players.push(player);
    playersByGame.set(player.gameName, players);
  });
  
  // Try to match players for each game
  playersByGame.forEach((players, gameName) => {
    while (players.length >= 2) {
      // Match the two oldest players
      const player1 = players.shift();
      const player2 = players.shift();
      
      if (!player1 || !player2) break;
      
      // Generate a unique room ID for the match
      const roomId = `match-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Set match results
      matchmakingResults.set(player1.playerId, {
        status: 'matched',
        roomId
      });
      matchmakingResults.set(player2.playerId, {
        status: 'matched',
        roomId
      });
      
      // Remove players from queue
      const index1 = matchmakingQueue.findIndex(p => p.playerId === player1.playerId);
      const index2 = matchmakingQueue.findIndex(p => p.playerId === player2.playerId);
      if (index1 !== -1) matchmakingQueue.splice(index1, 1);
      if (index2 !== -1) matchmakingQueue.splice(index2, 1);
      
      console.log(`Matched players ${player1.playerId} and ${player2.playerId} for game ${gameName} in room ${roomId}`);
    }
  });
}

// Periodically clean up old matchmaking results (after 5 minutes)
setInterval(() => {
  const now = Date.now();
  matchmakingResults.forEach((result, playerId) => {
    const player = matchmakingQueue.find(p => p.playerId === playerId);
    if (!player && result.status === 'matched') {
      // Remove result after 5 minutes
      const FIVE_MINUTES = 5 * 60 * 1000;
      matchmakingResults.delete(playerId);
    }
  });
}, 60000); // Check every minute

// Game loop ticker - runs periodically for games that have a tick action
const TICK_RATE = 16; // ~60 FPS

function startGameLoop(room: Room) {
  // Only start game loop if the game has a tick action
  const tickFn = room.logic.moves.tick;
  if (!tickFn) {
    return;
  }

  // Don't start if already running
  if (room.tickInterval) {
    return;
  }

  room.tickInterval = setInterval(() => {
    try {
      // We've verified tick exists above, so we can safely call it
      tickFn(room.state);
      // Broadcast updated state to all players in the room
      io.to(room.id).emit("state_update", room.state);
    } catch (e) {
      console.error(`Error in tick for room ${room.id}:`, e);
    }
  }, TICK_RATE);

  console.log(`Game loop started for room ${room.id}`);
}

function stopGameLoop(room: Room) {
  if (room.tickInterval) {
    clearInterval(room.tickInterval);
    // Delete the property instead of setting to undefined (exactOptionalPropertyTypes)
    delete room.tickInterval;
    console.log(`Game loop stopped for room ${room.id}`);
  }
}

// Helper function to serve game client
async function serveGameClient(gameName: string, roomName: string | undefined, res: any) {
  
  try {
    let game: Game | null = null;
    
    // Check if it's a premade game
    if (PREMADE_GAMES[gameName as keyof typeof PREMADE_GAMES]) {
      const premade = PREMADE_GAMES[gameName as keyof typeof PREMADE_GAMES];
      game = {
        id: premade.name,
        name: premade.name,
        description: premade.description,
        code: premade.code,
        created_at: new Date()
      };
    } else {
      // Fetch from database
      const { rows } = await query<Game>`SELECT * FROM games WHERE name = ${gameName}`;
      if (rows.length === 0) {
        return res.status(404).send('Game not found');
      }
      // rows[0] could be undefined, convert to null if needed
      game = rows[0] ?? null;
    }
    
    // At this point, game should never be null (we return early if not found)
    // But TypeScript doesn't track the early return, so we add a safety check
    if (!game) {
      return res.status(404).send('Game not found');
    }
    
    const prefilledRoom = roomName || '';
    
    // Determine the home URL based on environment
    const homeUrl = isDevelopment ? 'http://localhost:3000' : 'https://splork.io';
    
    // Serve HTML page that loads the game
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${game.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #000;
      color: #fff;
      overflow: hidden;
    }
    #game-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    #game-canvas {
      flex: 1;
      overflow: auto;
    }
    #game-ui {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #444;
      min-width: 250px;
      max-width: 300px;
      z-index: 1000;
    }
    #room-setup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #111;
      padding: 40px;
      border-radius: 15px;
      border: 1px solid #333;
      text-align: center;
      z-index: 2000;
    }
    input {
      width: 100%;
      padding: 12px;
      margin: 10px 0;
      background: #222;
      border: 1px solid #444;
      border-radius: 5px;
      color: #fff;
      font-size: 16px;
    }
    input:focus {
      outline: none;
      border-color: #888;
    }
    button {
      width: 100%;
      padding: 12px 24px;
      background: #fff;
      color: #000;
      border: none;
      border-radius: 25px;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
      margin-top: 10px;
    }
    button:hover {
      background: #ddd;
    }
    button:disabled {
      background: #555;
      color: #888;
      cursor: not-allowed;
    }
    .hidden {
      display: none !important;
    }
    #error-msg {
      color: #f44;
      margin-top: 10px;
      font-size: 14px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      padding: 8px 0;
      border-bottom: 1px solid #333;
    }
    .info-label {
      color: #888;
      font-size: 12px;
    }
    .info-value {
      color: #fff;
      font-weight: bold;
    }
    #back-button {
      position: fixed;
      top: 20px;
      left: 20px;
      padding: 12px 20px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      z-index: 1000;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }
    #back-button:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }
    #play-again-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    #play-again-overlay.visible {
      display: flex;
    }
    #play-again-container {
      background: rgba(17, 17, 17, 0.95);
      padding: 40px 60px;
      border-radius: 20px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    #game-over-message {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    #game-over-details {
      font-size: 18px;
      color: #888;
      margin-bottom: 30px;
    }
    #play-again-btn {
      padding: 15px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 30px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      margin: 0 10px;
      width: auto;
    }
    #play-again-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    #back-to-home-btn {
      padding: 15px 40px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 30px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      margin: 0 10px;
      width: auto;
      text-decoration: none;
      display: inline-block;
    }
    #back-to-home-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div id="room-setup"${prefilledRoom ? ' class="hidden"' : ''}>
    <h1>${game.name}</h1>
    <p style="color: #888; margin: 10px 0;">${game.description || 'Multiplayer Game'}</p>
    <input type="text" id="room-name" placeholder="Enter room name" value="${prefilledRoom}" />
    <button id="join-btn">Join Game</button>
    <div id="error-msg"></div>
  </div>

  <div id="game-container" class="${prefilledRoom ? '' : 'hidden'}">
    <div id="game-canvas"></div>
    
    <!-- Back button -->
    <a id="back-button" href="${homeUrl}" target="_top">
      <span>←</span>
      <span>Back to Home</span>
    </a>
    
    <div id="game-ui">
      <h3 style="margin-bottom: 15px; color: #fff;">Game Info</h3>
      <div class="info-row">
        <span class="info-label">Room:</span>
        <span class="info-value" id="current-room">${prefilledRoom || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Players:</span>
        <span class="info-value" id="player-count">0</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value" id="connection-status">Connecting...</span>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
        <button id="share-btn" style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
          📋 Copy Share Link
        </button>
      </div>
      <div id="game-info" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
        <div style="color: #888; font-size: 11px; max-height: 200px; overflow-y: auto;">
          <pre id="state-display" style="white-space: pre-wrap; word-wrap: break-word;"></pre>
        </div>
      </div>
    </div>
  </div>

  <!-- Play Again Overlay -->
  <div id="play-again-overlay">
    <div id="play-again-container">
      <div id="game-over-message">Game Over!</div>
      <div id="game-over-details"></div>
      <div style="margin-top: 20px;">
        <button id="play-again-btn">🔄 Play Again</button>
        <a id="back-to-home-btn" href="${homeUrl}" target="_top">← Back to Home</a>
      </div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const gameName = '${gameName}';
    let socket;
    let currentRoom;
    let gameInstance;
    let isConnected = false;
    
    // Auto-join if room is in URL
    const prefilledRoom = '${prefilledRoom}';
    if (prefilledRoom) {
      setTimeout(() => {
        document.getElementById('room-name').value = prefilledRoom;
        joinRoom();
      }, 100);
    }

    // Setup join button
    document.getElementById('join-btn').addEventListener('click', joinRoom);
    document.getElementById('room-name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') joinRoom();
    });
    
    // Setup share button
    document.getElementById('share-btn').addEventListener('click', () => {
      const roomName = document.getElementById('current-room').textContent;
      const shareUrl = window.location.origin + '/game/${gameName}/' + roomName;
      navigator.clipboard.writeText(shareUrl).then(() => {
        const btn = document.getElementById('share-btn');
        btn.textContent = '✅ Link Copied!';
        setTimeout(() => {
          btn.textContent = '📋 Copy Share Link';
        }, 2000);
      });
    });

    function joinRoom() {
      console.log('Join room button clicked');
      const roomName = document.getElementById('room-name').value.trim();
      const errorMsg = document.getElementById('error-msg');
      
      if (!roomName) {
        errorMsg.textContent = 'Please enter a room name';
        return;
      }

      console.log('Joining room:', roomName);
      errorMsg.textContent = '';
      currentRoom = gameName + '/' + roomName;
      
      document.getElementById('current-room').textContent = roomName;
      document.getElementById('room-setup').classList.add('hidden');
      document.getElementById('game-container').classList.remove('hidden');

      // Connect to socket
      connectToServer();
    }

    function connectToServer() {
      const serverUrl = window.location.origin;
      socket = io(serverUrl);
      
      socket.on('connect', () => {
        console.log('Connected to server');
        isConnected = true;
        document.getElementById('connection-status').textContent = 'Connected';
        document.getElementById('connection-status').style.color = '#0f0';
        
        // Join the room
        const parts = currentRoom.split('/');
        socket.emit('join_room', { 
          gameName: parts[0], 
          roomName: parts[1] 
        });
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
        isConnected = false;
        document.getElementById('connection-status').textContent = 'Disconnected';
        document.getElementById('connection-status').style.color = '#f44';
      });

      socket.on('state_update', (state) => {
        console.log('State update received:', state);
        
        // Initialize game on first state update if not already initialized
        if (!gameInstance) {
          console.log('Initializing game from state_update...');
          try {
            initGame();
            console.log('Game initialized successfully');
            
            // Give the game a moment to initialize before calling onStateUpdate
            setTimeout(() => {
              if (gameInstance && typeof gameInstance.onStateUpdate === 'function') {
                console.log('Calling onStateUpdate after init');
                gameInstance.onStateUpdate(state);
              } else {
                console.error('gameInstance or onStateUpdate not available');
              }
            }, 100);
          } catch (e) {
            console.error('Error initializing game:', e);
          }
        } else {
          // Call game's state update handler
          if (gameInstance && typeof gameInstance.onStateUpdate === 'function') {
            gameInstance.onStateUpdate(state);
          }
        }
        
        // Update UI
        updateStateDisplay(state);
        
        // Check if game is over
        checkGameOver(state);
      });

      socket.on('player_joined', ({ count }) => {
        document.getElementById('player-count').textContent = count;
      });

      socket.on('error', (msg) => {
        console.error('Server error:', msg);
        alert('Error: ' + msg);
      });
    }

    function updateStateDisplay(state) {
      const display = document.getElementById('state-display');
      try {
        const stateStr = JSON.stringify(state, null, 2);
        display.textContent = stateStr.length > 500 
          ? stateStr.substring(0, 500) + '...' 
          : stateStr;
      } catch (e) {
        display.textContent = 'State too large to display';
      }
    }

    // Check if game is over and show play again overlay
    function checkGameOver(state) {
      const overlay = document.getElementById('play-again-overlay');
      const messageEl = document.getElementById('game-over-message');
      const detailsEl = document.getElementById('game-over-details');
      
      // Check various common game over indicators
      let isGameOver = false;
      let message = 'Game Over!';
      let details = '';
      
      // Check for gameOver flag
      if (state.gameOver === true) {
        isGameOver = true;
      }
      
      // Check for winner
      if (state.winner) {
        isGameOver = true;
        message = state.winner + ' Wins!';
        if (state.reason) {
          details = state.reason;
        }
      }
      
      // Check for ended flag
      if (state.ended === true) {
        isGameOver = true;
      }
      
      // Check for game status messages (like "checkmate", "stalemate")
      if (state.status) {
        const statusLower = String(state.status).toLowerCase();
        if (statusLower.includes('checkmate') || 
            statusLower.includes('stalemate') || 
            statusLower.includes('draw') ||
            statusLower.includes('game over')) {
          isGameOver = true;
          details = state.status;
        }
      }
      
      // Show overlay if game is over
      if (isGameOver) {
        messageEl.textContent = message;
        detailsEl.textContent = details;
        overlay.classList.add('visible');
      } else {
        overlay.classList.remove('visible');
      }
    }
    
    // Setup play again button
    document.getElementById('play-again-btn').addEventListener('click', () => {
      window.location.reload();
    });

    function emitAction(action, payload) {
      if (socket && isConnected && currentRoom) {
        console.log('Emitting action:', action, payload);
        socket.emit('game_action', {
          roomId: currentRoom,
          action,
          payload
        });
      } else {
        console.warn('Cannot emit action: not connected');
      }
    }

    // Game initialization
    function initGame() {
      console.log('initGame called');
      const container = document.getElementById('game-canvas');
      
      if (!container) {
        console.error('game-canvas container not found!');
        return;
      }
      
      try {
        console.log('Executing game code...');
        // Execute game code
        ${game.code}
        
        // Call the game's initialization function
        if (typeof initGameClient === 'function') {
          console.log('Calling initGameClient...');
          gameInstance = initGameClient(container, socket, currentRoom, emitAction);
          console.log('Game client initialized:', gameInstance);
        } else {
          throw new Error('Game code must define initGameClient() function');
        }
      } catch (e) {
        console.error('Game initialization error:', e, e.stack);
        container.innerHTML = \`
          <div style="padding: 40px; text-align: center;">
            <h2 style="color: #f44;">Game Error</h2>
            <p style="color: #888; margin-top: 10px;">\${e.message}</p>
            <pre style="color: #666; margin-top: 20px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto; font-size: 12px;">\${e.stack}</pre>
          </div>
        \`;
      }
    }
  </script>
</body>
</html>
    `);
  } catch (err) {
    console.error('Error loading game:', err);
    res.status(500).send('Error loading game');
  }
}

// Route handlers for game client
// With room name in URL
app.get('/game/:gameName/:roomName', async (req, res) => {
  const { gameName, roomName } = req.params;
  await serveGameClient(gameName, roomName, res);
});

// Without room name in URL
app.get('/game/:gameName', async (req, res) => {
  const { gameName } = req.params;
  await serveGameClient(gameName, undefined, res);
});

// Helper function to get active player count for a game
function getGameStats(gameName: string): { activePlayers: number; activeRooms: number } {
  let activePlayers = 0;
  let activeRooms = 0;
  
  rooms.forEach((room) => {
    if (room.gameName === gameName) {
      activePlayers += room.players.size;
      activeRooms += 1;
    }
  });
  
  return { activePlayers, activeRooms };
}

// Helper function to increment play count for a game
async function incrementPlayCount(gameName: string): Promise<void> {
  try {
    // Don't increment for premade games (they're not in the database)
    if (PREMADE_GAMES[gameName as keyof typeof PREMADE_GAMES]) {
      return;
    }
    
    await query`
      UPDATE games 
      SET 
        play_count = COALESCE(play_count, 0) + 1,
        last_played_at = NOW()
      WHERE name = ${gameName}
    `;
    console.log(`Incremented play count for game: ${gameName}`);
  } catch (err) {
    console.error(`Error incrementing play count for ${gameName}:`, err);
  }
}

// API endpoint to list all games
app.get('/api/games', async (req, res) => {
  try {
    const { rows } = await query<Game>`SELECT id, name, description, created_at, play_count, last_played_at FROM games ORDER BY created_at DESC`;
    res.json(rows);
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// API endpoint to get game statistics (active players, play counts)
app.get('/api/game-stats', async (req, res) => {
  try {
    const stats: Record<string, GameStats> = {};
    
    // Get stats for database games
    const { rows } = await query<Game>`SELECT name, play_count, last_played_at FROM games`;
    rows.forEach(game => {
      const liveStats = getGameStats(game.name);
      const gameStat: GameStats = {
        gameName: game.name,
        activePlayers: liveStats.activePlayers,
        activeRooms: liveStats.activeRooms,
        totalPlayCount: game.play_count || 0
      };
      // Only add lastPlayedAt if it exists (exactOptionalPropertyTypes)
      if (game.last_played_at) {
        gameStat.lastPlayedAt = game.last_played_at;
      }
      stats[game.name] = gameStat;
    });
    
    // Add stats for premade games
    Object.keys(PREMADE_GAMES).forEach(gameName => {
      const liveStats = getGameStats(gameName);
      stats[gameName] = {
        gameName,
        activePlayers: liveStats.activePlayers,
        activeRooms: liveStats.activeRooms,
        totalPlayCount: 0 // Premade games don't track play count in DB
        // lastPlayedAt not included for premade games
      };
    });
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching game stats:', err);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
});

// Matchmaking endpoints
app.post('/api/matchmaking/join', (req, res) => {
  try {
    const { gameName, playerId } = req.body;
    
    if (!gameName || !playerId) {
      return res.status(400).json({ error: 'gameName and playerId are required' });
    }
    
    // Check if player is already in queue
    const existingIndex = matchmakingQueue.findIndex(p => p.playerId === playerId);
    if (existingIndex !== -1) {
      return res.json({ message: 'Already in queue' });
    }
    
    // Add player to queue
    matchmakingQueue.push({
      playerId,
      gameName,
      timestamp: Date.now()
    });
    
    console.log(`Player ${playerId} joined matchmaking for ${gameName}. Queue size: ${matchmakingQueue.length}`);
    
    // Set initial status
    matchmakingResults.set(playerId, { status: 'waiting' });
    
    // Try to match immediately
    tryMatchPlayers();
    
    res.json({ message: 'Joined matchmaking queue' });
  } catch (err) {
    console.error('Error joining matchmaking:', err);
    res.status(500).json({ error: 'Failed to join matchmaking' });
  }
});

app.post('/api/matchmaking/leave', (req, res) => {
  try {
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'playerId is required' });
    }
    
    // Remove player from queue
    const index = matchmakingQueue.findIndex(p => p.playerId === playerId);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      console.log(`Player ${playerId} left matchmaking. Queue size: ${matchmakingQueue.length}`);
    }
    
    // Remove result
    matchmakingResults.delete(playerId);
    
    res.json({ message: 'Left matchmaking queue' });
  } catch (err) {
    console.error('Error leaving matchmaking:', err);
    res.status(500).json({ error: 'Failed to leave matchmaking' });
  }
});

app.get('/api/matchmaking/status/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    
    const result = matchmakingResults.get(playerId);
    
    if (!result) {
      return res.json({ status: 'not_in_queue' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error checking matchmaking status:', err);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Socket.io game logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", async ({ gameName, roomName }: { gameName: string, roomName: string }) => {
    const roomId = `${gameName}/${roomName}`;
    console.log(`User ${socket.id} attempting to join room: ${roomId}`);
    
    // Leave previous rooms
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
      }
    });

    // Join or Create Room
    let room = rooms.get(roomId);

    if (!room) {
      console.log(`Creating new room ${roomId} for game ${gameName}`);
      try {
        let game: Game | null = null;
        
        // Check if it's a premade game
        if (PREMADE_GAMES[gameName as keyof typeof PREMADE_GAMES]) {
          const premade = PREMADE_GAMES[gameName as keyof typeof PREMADE_GAMES];
          game = {
            id: premade.name,
            name: premade.name,
            description: premade.description,
            code: premade.code,
            created_at: new Date()
          };
        } else {
          // Fetch from database
          const { rows } = await query<Game>`SELECT * FROM games WHERE name = ${gameName}`;
          if (rows.length === 0) {
            console.error(`Game not found: ${gameName}`);
            socket.emit("error", "Game not found");
            return;
          }
          // rows[0] could be undefined, convert to null if needed
          game = rows[0] ?? null;
        }

        // At this point, game should never be null (we return early if not found)
        // But TypeScript doesn't track the early return, so we add a safety check
        if (!game) {
          console.error(`Game not found: ${gameName}`);
          socket.emit("error", "Game not found");
          return;
        }

        // Execute game logic to get server-side state machine
        // We need to wrap the code to export serverLogic to the sandbox
        const wrappedCode = `
          ${game.code}
          
          // Export serverLogic if it exists
          if (typeof serverLogic !== 'undefined') {
            exportedServerLogic = serverLogic;
          }
        `;
        
        const sandbox = { 
          console: console,
          exportedServerLogic: undefined as any,
          // Provide DOM-like stubs for code that might reference them
          document: undefined,
          window: undefined,
          // Provide chess.js for game logic
          Chess: Chess,
          require: (moduleName: string) => {
            if (moduleName === 'chess.js') {
              return { Chess };
            }
            throw new Error(`Module ${moduleName} is not available in game sandbox`);
          }
        };
        const context = vm.createContext(sandbox);
        
        try {
          const script = new vm.Script(wrappedCode);
          script.runInContext(context);
          
          const logic = sandbox.exportedServerLogic;
          
          if (!logic) {
            throw new Error("Game code must define serverLogic");
          }
          
          if (!logic.initialState) {
            throw new Error("serverLogic must have initialState");
          }
          
          if (!logic.moves || typeof logic.moves !== 'object') {
            throw new Error("serverLogic must have moves object");
          }

          console.log(`Game logic loaded for ${gameName}:`, {
            hasInitialState: !!logic.initialState,
            moveCount: Object.keys(logic.moves).length,
            moves: Object.keys(logic.moves)
          });

          room = {
            id: roomId,
            gameId: game.id,
            gameName: game.name,
            state: JSON.parse(JSON.stringify(logic.initialState)),
            players: new Map(),
            logic: logic
          };
          rooms.set(roomId, room);
          console.log(`Room ${roomId} created successfully`);

          // Increment play count for this game
          await incrementPlayCount(gameName);

          // Start game loop if the game has a tick action
          startGameLoop(room);
        } catch (e: any) {
          console.error("Error executing game code:", e);
          socket.emit("error", `Invalid game code: ${e.message}`);
          return;
        }
      } catch (err) {
        console.error("DB Error:", err);
        socket.emit("error", "Server error fetching game");
        return;
      }
    } else {
      console.log(`User ${socket.id} joining existing room: ${roomId}`);
    }

    // Join logic
    socket.join(roomId);
    room.players.set(socket.id, { id: socket.id, joinedAt: Date.now() });
    
    // Trigger playerJoined move to assign colors
    if (room.logic.moves.playerJoined) {
      try {
        room.logic.moves.playerJoined(room.state, {}, socket.id);
      } catch (e) {
        console.error('Error in playerJoined:', e);
      }
    }
    
    console.log(`User ${socket.id} joined ${roomId}. Total players: ${room.players.size}`);
    console.log('Player colors:', room.state.playerColors);
    
    // Send state to all players in room
    io.to(roomId).emit("state_update", room.state);
    io.to(roomId).emit("player_joined", { playerId: socket.id, count: room.players.size });
  });

  socket.on("game_action", ({ roomId, action, payload }: { roomId: string, action: string, payload: any }) => {
    const room = rooms.get(roomId);
    if (!room) {
      console.warn(`Action ${action} for non-existent room: ${roomId}`);
      return;
    }

    if (room.logic.moves[action]) {
      try {
        console.log(`Executing action ${action} in room ${roomId} by player ${socket.id}`);
        room.logic.moves[action](room.state, payload, socket.id);
        io.to(roomId).emit("state_update", room.state);
      } catch (e: any) {
        console.error("Game Logic Error:", e);
        socket.emit("error", `Game logic execution failed: ${e.message}`);
      }
    } else {
      console.warn(`Unknown action: ${action}. Available: ${Object.keys(room.logic.moves).join(', ')}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove player from all rooms
    rooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        io.to(roomId).emit("player_joined", { playerId: socket.id, count: room.players.size });

        // Clean up empty rooms
        if (room.players.size === 0) {
          stopGameLoop(room);
          rooms.delete(roomId);
          console.log(`Cleaned up empty room: ${roomId}`);
        }
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎮 Game Server running on http://localhost:${PORT}`);
  console.log(`📝 Create games at http://localhost:3000`);
});

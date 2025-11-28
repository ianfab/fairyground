import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { query, getGamesTableName } from "./lib/db.js";
import type { Game, GameStats } from "./lib/types.js";
import { PREMADE_GAMES } from "./lib/premade-games.js";
import vm from "vm";
import path from "path";
import { fileURLToPath } from 'url';
import { Chess } from 'chess.js';
import { DEFAULT_ELO, calculate1v1EloChange, calculateMultiplayerEloChanges } from './lib/elo.js';
import eloRouter from './routes/elo.js';

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

// Mount ELO API routes
app.use('/api/elo', eloRouter);

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
  persistentPlayerMap: Map<string, string>; // Maps persistent player ID to current socket ID
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

// Track matchmaking rooms and their expected players
interface MatchmakingRoom {
  roomId: string;
  gameName: string;
  expectedPlayers: Set<string>; // playerIds
  connectedPlayers: Set<string>; // socket IDs
  createdAt: number;
}
const matchmakingRooms = new Map<string, MatchmakingRoom>();

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

      // Register the matchmaking room
      matchmakingRooms.set(roomId, {
        roomId,
        gameName,
        expectedPlayers: new Set([player1.playerId, player2.playerId]),
        connectedPlayers: new Set(),
        createdAt: Date.now()
      });

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

// Periodically clean up stale matchmaking data
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_MINUTE = 60 * 1000;

  // Clean up old matchmaking results
  matchmakingResults.forEach((result, playerId) => {
    const player = matchmakingQueue.find(p => p.playerId === playerId);
    if (!player && result.status === 'matched') {
      matchmakingResults.delete(playerId);
    }
  });

  // Clean up stale players in queue (been there > 1 hour without connecting)
  const staleIndices: number[] = [];
  matchmakingQueue.forEach((player, index) => {
    const age = now - player.timestamp;
    if (age > ONE_HOUR) {
      console.log(`Removing stale player ${player.playerId} from queue (age: ${Math.round(age / 1000)}s)`);
      staleIndices.push(index);
      matchmakingResults.delete(player.playerId);
    }
  });
  // Remove in reverse order to maintain indices
  staleIndices.reverse().forEach(index => matchmakingQueue.splice(index, 1));

  // Clean up matchmaking rooms where players never connected (> 1 minute old)
  matchmakingRooms.forEach((room, roomId) => {
    const age = now - room.createdAt;
    const allPlayersConnected = room.connectedPlayers.size === room.expectedPlayers.size;

    if (!allPlayersConnected && age > ONE_MINUTE) {
      console.log(`Cleaning up stale matchmaking room ${roomId} (age: ${Math.round(age / 1000)}s, ${room.connectedPlayers.size}/${room.expectedPlayers.size} players connected)`);

      // Put any players who didn't connect back in the queue
      room.expectedPlayers.forEach(playerId => {
        if (!Array.from(room.connectedPlayers).some(socketId => {
          // Check if this socketId belongs to this playerId
          // This is a bit tricky since we don't have a direct mapping here
          return false; // Just remove the match result and let them re-queue
        })) {
          // Remove their match result so they can queue again
          matchmakingResults.delete(playerId);
          console.log(`Cleared match result for disconnected player ${playerId}`);
        }
      });

      matchmakingRooms.delete(roomId);
    }
  });
}, 30000); // Check every 30 seconds

// Game loop ticker - runs periodically for games that have a tick action
const TICK_RATE = 16; // ~60 FPS

// Helper function to filter out server-only state fields (prefixed with _)
function getClientState(state: any): any {
  if (Array.isArray(state)) {
    return state.map(item => getClientState(item));
  } else if (state && typeof state === 'object') {
    const filtered: any = {};
    for (const key in state) {
      if (!key.startsWith('_')) {
        filtered[key] = getClientState(state[key]);
      }
    }
    return filtered;
  }
  return state;
}

// Helper to add player metadata to state for clients
function enrichStateWithPlayerMetadata(state: any, room: Room): any {
  const clientState = getClientState(state);

  // Build player metadata map (socket ID -> persistent ID + username)
  const playerMetadata: Record<string, { persistentId: string; username: string }> = {};
  for (const [socketId, player] of room.players.entries()) {
    playerMetadata[socketId] = {
      persistentId: player.persistentId || socketId,
      username: player.username || 'Guest'
    };
  }

  // Add metadata to client state (not prefixed with _ so it's sent to clients)
  clientState.playerMetadata = playerMetadata;

  return clientState;
}

// Helper to get or create player ELO for a game
async function getPlayerElo(playerId: string, gameName: string): Promise<number> {
  try {
    const { rows } = await query<{elo_rating: number}>`
      SELECT elo_rating FROM player_elo
      WHERE player_id = ${playerId} AND game_name = ${gameName}
    `;
    return rows[0]?.elo_rating || DEFAULT_ELO;
  } catch (e) {
    console.error(`Error fetching ELO for ${playerId} in ${gameName}:`, e);
    return DEFAULT_ELO;
  }
}

// Handle game end - update ELO ratings
async function handleGameEnd(room: Room): Promise<void> {
  const state = room.state;

  // Check if game has ended
  if (!state.gameEnded) return;

  // Only process once
  if ((state as any)._eloProcessed) return;
  (state as any)._eloProcessed = true;

  try {
    // Get socket IDs and their corresponding persistent IDs
    const socketIds = Array.from(room.players.keys());
    if (socketIds.length < 2) {
      console.log(`Not enough players to calculate ELO for room ${room.id}`);
      return;
    }

    // Build mapping of socket ID -> persistent ID/username and collect persistent IDs
    const socketToPersistentId: Record<string, string> = {};
    const persistentIdToUsername: Record<string, string> = {};
    const persistentIds: string[] = [];

    for (const socketId of socketIds) {
      const player = room.players.get(socketId);
      const persistentId = player?.persistentId || socketId; // Fallback to socket ID if no persistent ID
      const username: string = player?.username || 'Guest';
      socketToPersistentId[socketId] = persistentId;
      persistentIdToUsername[persistentId] = username;
      persistentIds.push(persistentId);
    }

    // Get current ELO ratings for all players (using persistent IDs)
    const playerRatings: Record<string, number> = {};
    for (const persistentId of persistentIds) {
      playerRatings[persistentId] = await getPlayerElo(persistentId, room.gameName);
    }

    // Calculate ELO changes
    let eloChanges: Record<string, { newElo: number; change: number }>;

    // Convert gameWinner from socket ID to persistent ID
    const winnerPersistentId: string | null = state.gameWinner ? (socketToPersistentId[state.gameWinner] || null) : null;

    if (persistentIds.length === 2) {
      // 1v1 game
      const player1 = persistentIds[0];
      const player2 = persistentIds[1];

      if (!player1 || !player2) {
        console.log(`Invalid player IDs for room ${room.id}`);
        return;
      }

      const player1Elo = playerRatings[player1];
      const player2Elo = playerRatings[player2];

      if (player1Elo === undefined || player2Elo === undefined) {
        console.log(`Missing ELO ratings for players in room ${room.id}`);
        return;
      }

      let result: 'player1' | 'player2' | 'draw';

      if (winnerPersistentId === player1) {
        result = 'player1';
      } else if (winnerPersistentId === player2) {
        result = 'player2';
      } else {
        result = 'draw';
      }

      const changes = calculate1v1EloChange(
        player1Elo,
        player2Elo,
        result
      );

      eloChanges = {
        [player1]: { newElo: changes.player1NewElo, change: changes.player1Change },
        [player2]: { newElo: changes.player2NewElo, change: changes.player2Change }
      };
    } else {
      // Multiplayer game (3+ players)
      eloChanges = calculateMultiplayerEloChanges(playerRatings, winnerPersistentId);
    }

    // Update database for each player (using persistent IDs)
    for (const persistentId of persistentIds) {
      const eloChange = eloChanges[persistentId];
      if (!eloChange) {
        console.log(`No ELO change calculated for player ${persistentId}`);
        continue;
      }

      const { newElo, change } = eloChange;
      const isWinner = winnerPersistentId === persistentId;
      const isDraw = state.gameWinner === null;

      const username = persistentIdToUsername[persistentId] || 'Guest';

      await query`
        INSERT INTO player_elo (player_id, game_name, elo_rating, games_played, wins, losses, draws, username)
        VALUES (
          ${persistentId},
          ${room.gameName},
          ${newElo},
          1,
          ${isWinner ? 1 : 0},
          ${!isWinner && !isDraw ? 1 : 0},
          ${isDraw ? 1 : 0},
          ${username}
        )
        ON CONFLICT (player_id, game_name)
        DO UPDATE SET
          elo_rating = ${newElo},
          games_played = player_elo.games_played + 1,
          wins = player_elo.wins + ${isWinner ? 1 : 0},
          losses = player_elo.losses + ${!isWinner && !isDraw ? 1 : 0},
          draws = player_elo.draws + ${isDraw ? 1 : 0},
          username = ${username},
          last_played_at = NOW()
      `;
    }

    // Record game result (using persistent IDs)
    await query`
      INSERT INTO game_results (game_name, room_id, winner_id, end_reason, players, elo_changes)
      VALUES (
        ${room.gameName},
        ${room.id},
        ${winnerPersistentId},
        ${state.gameEndReason || null},
        ${JSON.stringify(persistentIds)},
        ${JSON.stringify(eloChanges)}
      )
    `;

    console.log(`✓ ELO updated for room ${room.id} (${room.gameName})`);
    console.log('  Winner (persistent ID):', winnerPersistentId);
    console.log('  Changes:', eloChanges);

  } catch (e) {
    console.error(`Error handling game end for room ${room.id}:`, e);
  }
}

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

  room.tickInterval = setInterval(async () => {
    try {
      // We've verified tick exists above, so we can safely call it
      tickFn(room.state);

      // Check if game ended and handle ELO updates
      if (room.state.gameEnded) {
        await handleGameEnd(room);
      }

      // Broadcast updated state to all players in the room (filter out _ prefixed fields)
      io.to(room.id).emit("state_update", enrichStateWithPlayerMetadata(room.state, room));
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
async function serveGameClient(gameName: string, roomName: string | undefined, res: any, hideUI: boolean = false) {
  
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
      const tableName = getGamesTableName();
      const { rows } = await query<Game>(
        `SELECT * FROM ${tableName} WHERE name = $1`,
        gameName
      );
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
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    #game-ui.collapsed {
      transform: translateX(calc(100% + 20px));
      opacity: 0;
      pointer-events: none;
    }
    #game-ui-toggle {
      position: fixed;
      bottom: 20px;
      left: 78px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #444;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999;
      color: #fff;
      font-size: 24px;
      transition: all 0.2s ease;
      opacity: 0;
      pointer-events: none;
      padding: 0;
    }
    #game-ui-toggle.visible {
      opacity: 1;
      pointer-events: auto;
    }
    #game-ui-toggle:hover {
      background: rgba(102, 126, 234, 0.9);
      border-color: #667eea;
      transform: scale(1.1);
    }
    #game-ui-header {
      padding: 12px 15px;
      border-bottom: 1px solid #444;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      margin: -20px -20px 15px -20px;
    }
    #game-ui-header:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    #game-ui-title {
      color: #fff;
      font-weight: 600;
      font-size: 16px;
    }
    #game-ui-collapse-toggle {
      color: #888;
      font-size: 12px;
    }
    @media (max-width: 768px) {
      #game-ui {
        max-width: 90vw;
      }
      #game-chat {
        bottom: 80px;
        max-width: calc(100vw - 40px);
      }
    }
    #chat-toggle-btn {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #444;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999;
      color: #fff;
      font-size: 24px;
      transition: all 0.2s ease;
      opacity: 0;
      pointer-events: none;
      padding: 0;
    }
    #chat-toggle-btn.visible {
      opacity: 1;
      pointer-events: auto;
    }
    #chat-toggle-btn:hover {
      background: rgba(102, 126, 234, 0.9);
      border-color: #667eea;
      transform: scale(1.1);
    }
    #game-chat {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #444;
      border-radius: 10px;
      width: 350px;
      max-width: calc(100vw - 40px);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    #game-chat.collapsed {
      transform: translateY(calc(100% + 20px));
      opacity: 0;
      pointer-events: none;
    }
    #chat-header {
      padding: 12px 15px;
      border-bottom: 1px solid #444;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    #chat-header:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    #chat-title {
      color: #fff;
      font-weight: 600;
      font-size: 14px;
    }
    #chat-toggle {
      color: #888;
      font-size: 12px;
    }
    #chat-messages {
      height: 200px;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chat-message {
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.4;
    }
    .chat-message-sender {
      color: #667eea;
      font-weight: 600;
      margin-right: 6px;
    }
    .chat-message-text {
      color: #ddd;
    }
    .chat-message-system {
      color: #888;
      font-style: italic;
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
    }
    #chat-input-container {
      padding: 12px;
      border-top: 1px solid #444;
    }
    #chat-input {
      width: 100%;
      padding: 12px 14px;
      background: #1a1a1a;
      border: 1px solid #555;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      outline: none;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #chat-input:focus {
      border-color: #667eea;
      background: #222;
    }
    #chat-input::placeholder {
      color: #666;
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
    #metadata-header:hover {
      color: #fff !important;
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
    #players-display {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 30px;
      align-items: center;
      background: rgba(17, 17, 17, 0.9);
      padding: 15px 30px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      z-index: 100;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .player-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .player-name {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    .player-elo {
      font-size: 12px;
      color: #999;
    }
    .vs-text {
      font-size: 12px;
      font-weight: 700;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
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
    <a id="back-button" href="${homeUrl}" target="_top" style="${hideUI ? 'display: none;' : ''}">
      <span>←</span>
      <span>Back to Home</span>
    </a>

    <!-- Players Display -->
    <div id="players-display" style="display: none;"></div>

    <!-- Toggle button for mobile -->
    <button id="game-ui-toggle" style="${hideUI ? 'display: none;' : ''}" title="Toggle Game Info">
      ℹ️
    </button>

    <div id="game-ui" style="${hideUI ? 'display: none;' : ''}">
      <div id="game-ui-header">
        <span id="game-ui-title">ℹ️ Game Info</span>
        <span id="game-ui-collapse-toggle">▼</span>
      </div>
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
        <div id="metadata-header" style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center; padding: 8px 0; color: #aaa; transition: color 0.2s;">
          <span style="font-size: 12px; font-weight: 600;">Game Metadata</span>
          <span id="metadata-toggle" style="font-size: 14px; transition: transform 0.2s;">▼</span>
        </div>
        <div id="metadata-content" style="color: #888; font-size: 11px; max-height: 200px; overflow-y: auto; display: none;">
          <pre id="state-display" style="white-space: pre-wrap; word-wrap: break-word;"></pre>
        </div>
      </div>
    </div>
  </div>

  <!-- Chat toggle button -->
  <button id="chat-toggle-btn" style="${hideUI ? 'display: none;' : ''}" title="Toggle Chat">
    💬
  </button>

  <!-- Game Chat -->
  <div id="game-chat" style="${hideUI ? 'display: none;' : ''}">
    <div id="chat-header">
      <span id="chat-title">💬 Room Chat</span>
      <span id="chat-toggle">▼</span>
    </div>
    <div id="chat-messages"></div>
    <div id="chat-input-container">
      <input type="text" id="chat-input" placeholder="Type a message and press Enter..." maxlength="200" />
    </div>
  </div>

  <!-- Play Again Overlay -->
  <div id="play-again-overlay">
    <div id="play-again-container">
      <div id="game-over-message">Game Over!</div>
      <div id="game-over-details"></div>
      <div style="margin-top: 20px;">
        <button id="play-again-btn">🎯 Enter Matchmaking Again</button>
        <a id="back-to-home-btn" href="${homeUrl}/play/${gameName}" target="_top">← Back to Game Selection</a>
      </div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const gameName = "${gameName}";
    let socket;
    let currentRoom;
    let gameInstance;
    let isConnected = false;
    
    // Get player ID and username from URL parameters (set by web app) or fallback to localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let persistentPlayerId = urlParams.get('userId');
    let playerUsername = urlParams.get('username');
    const matchmakingPlayerId = urlParams.get('matchmakingPlayerId');

    if (!persistentPlayerId) {
      // Fallback to localStorage for anonymous players
      persistentPlayerId = localStorage.getItem('vibechess_player_id');
      if (!persistentPlayerId) {
        persistentPlayerId = 'player-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        localStorage.setItem('vibechess_player_id', persistentPlayerId);
      }
      playerUsername = 'Guest';
    }

    console.log('Player ID:', persistentPlayerId, 'Username:', playerUsername, 'Matchmaking ID:', matchmakingPlayerId);
    
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

    // Setup game UI toggle
    const gameUIToggle = document.getElementById('game-ui-toggle');
    const gameUI = document.getElementById('game-ui');
    const gameUIHeader = document.getElementById('game-ui-header');
    const gameUICollapseToggle = document.getElementById('game-ui-collapse-toggle');
    let gameUICollapsed = false;

    // Function to update toggle button visibility
    function updateToggleVisibility() {
      if (gameUICollapsed) {
        gameUIToggle.classList.add('visible');
      } else {
        gameUIToggle.classList.remove('visible');
      }
    }

    // Function to toggle game UI
    function toggleGameUI() {
      gameUICollapsed = !gameUICollapsed;
      if (gameUICollapsed) {
        gameUI.classList.add('collapsed');
        gameUICollapseToggle.textContent = '▲';
      } else {
        gameUI.classList.remove('collapsed');
        gameUICollapseToggle.textContent = '▼';
      }
      updateToggleVisibility();
    }

    // Start collapsed on mobile
    if (window.innerWidth <= 768) {
      gameUICollapsed = true;
      gameUI.classList.add('collapsed');
      updateToggleVisibility();
    }

    gameUIToggle.addEventListener('click', toggleGameUI);
    gameUIHeader.addEventListener('click', toggleGameUI);

    // Setup share button
    document.getElementById('share-btn').addEventListener('click', () => {
      const roomName = document.getElementById('current-room').textContent;
      
      // Safe encode function to prevent double encoding
      const safeEncode = (str) => {
        const isEncoded = /%[0-9A-Fa-f]{2}/.test(str);
        if (isEncoded) {
          try {
            return encodeURIComponent(decodeURIComponent(str));
          } catch (e) {
            return encodeURIComponent(str);
          }
        }
        return encodeURIComponent(str);
      };
      
      const shareUrl = window.location.origin + '/game/' + safeEncode('${gameName}') + '/' + safeEncode(roomName);
      navigator.clipboard.writeText(shareUrl).then(() => {
        const btn = document.getElementById('share-btn');
        btn.textContent = '✅ Link Copied!';
        setTimeout(() => {
          btn.textContent = '📋 Copy Share Link';
        }, 2000);
      });
    });

    // Setup chat functionality
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatHeader = document.getElementById('chat-header');
    const chatToggle = document.getElementById('chat-toggle');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    let chatCollapsed = false;

    // Function to update chat toggle button visibility
    function updateChatToggleVisibility() {
      if (chatCollapsed) {
        chatToggleBtn.classList.add('visible');
      } else {
        chatToggleBtn.classList.remove('visible');
      }
    }

    // Add message to chat
    function addChatMessage(sender, message, isSystem = false) {
      const messageEl = document.createElement('div');
      messageEl.className = isSystem ? 'chat-message chat-message-system' : 'chat-message';

      if (isSystem) {
        messageEl.textContent = message;
      } else {
        const senderEl = document.createElement('span');
        senderEl.className = 'chat-message-sender';
        senderEl.textContent = sender + ':';

        const textEl = document.createElement('span');
        textEl.className = 'chat-message-text';
        textEl.textContent = message;

        messageEl.appendChild(senderEl);
        messageEl.appendChild(textEl);
      }

      chatMessages.appendChild(messageEl);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Send chat message
    function sendChatMessage() {
      const message = chatInput.value.trim();
      if (!message || !socket || !currentRoom) return;

      socket.emit('chat_message', {
        roomId: currentRoom,
        message: message,
        username: playerUsername
      });

      chatInput.value = '';
    }

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });

    // Toggle chat collapse
    function toggleChat() {
      chatCollapsed = !chatCollapsed;
      const gameChat = document.getElementById('game-chat');
      if (chatCollapsed) {
        gameChat.classList.add('collapsed');
        chatToggle.textContent = '▲';
      } else {
        gameChat.classList.remove('collapsed');
        chatToggle.textContent = '▼';
      }
      updateChatToggleVisibility();
    }

    chatHeader.addEventListener('click', toggleChat);
    chatToggleBtn.addEventListener('click', toggleChat);

    // Setup metadata toggle
    document.getElementById('metadata-header').addEventListener('click', () => {
      const content = document.getElementById('metadata-content');
      const toggle = document.getElementById('metadata-toggle');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.style.transform = 'rotate(180deg)';
      } else {
        content.style.display = 'none';
        toggle.style.transform = 'rotate(0deg)';
      }
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

        // Join the room with persistent player ID and username
        const parts = currentRoom.split('/');
        socket.emit('join_room', {
          gameName: parts[0],
          roomName: parts[1],
          persistentPlayerId: persistentPlayerId,
          matchmakingPlayerId: matchmakingPlayerId,
          username: playerUsername
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
        updatePlayersDisplay(state);

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

      // Listen for chat messages
      socket.on('chat_message', ({ sender, message, timestamp }) => {
        addChatMessage(sender, message);
      });

      // Add welcome message when joining room
      addChatMessage('System', 'Welcome to the room! You can chat with other players here.', true);
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

    // Track fetched ELO data to avoid repeated requests
    const playerEloCache = {};

    async function updatePlayersDisplay(state) {
      const playersDisplay = document.getElementById('players-display');
      if (!playersDisplay) return;

      // Get player metadata from state
      const playerMetadata = state.playerMetadata || {};

      // Try to get socket IDs from different possible state structures
      let socketIds = [];

      if (state.players && typeof state.players === 'object') {
        socketIds = Object.keys(state.players);
      } else if (state.playerColors && typeof state.playerColors === 'object') {
        socketIds = Object.keys(state.playerColors);
      }

      // Only show if we have 2 or more players
      if (socketIds.length < 2) {
        playersDisplay.style.display = 'none';
        return;
      }

      playersDisplay.style.display = 'flex';

      // Fetch ELO data for each player using their persistent ID
      const playerData = await Promise.all(
        socketIds.slice(0, 2).map(async (socketId) => {
          const metadata = playerMetadata[socketId] || {};
          const persistentId = metadata.persistentId || socketId;
          const username = metadata.username || 'Guest';

          if (playerEloCache[persistentId]) {
            return playerEloCache[persistentId];
          }

          try {
            const response = await fetch(\`/api/elo/player/\${encodeURIComponent(persistentId)}\`);
            if (response.ok) {
              const data = await response.json();
              const gameData = data.games.find(g => g.game_name === "${gameName}");
              const result = {
                id: persistentId,
                username: gameData?.username || username,
                elo: gameData?.elo_rating
              };
              playerEloCache[persistentId] = result;
              return result;
            }
          } catch (e) {
            console.error('Error fetching ELO for player:', persistentId, e);
          }

          return {
            id: persistentId,
            username: username,
            elo: null
          };
        })
      );

      // Render player display
      playersDisplay.innerHTML = playerData.map((player, index) => \`
        <div class="player-info">
          <div class="player-name">\${player.username}</div>
          <div class="player-elo">\${player.elo ? \`\${player.elo} ELO\` : 'Unranked'}</div>
        </div>
        \${index === 0 ? '<div class="vs-text">VS</div>' : ''}
      \`).join('');
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

      // NEW STANDARD: Check for gameEnded flag (preferred)
      if (state.gameEnded === true) {
        isGameOver = true;

        // Check for winner ID
        if (state.gameWinner) {
          message = 'Player ' + state.gameWinner.substring(0, 8) + '... Wins!';
        } else {
          message = 'Draw!';
        }

        // Use gameEndReason if provided
        if (state.gameEndReason) {
          details = state.gameEndReason;
        }
      }

      // Legacy support for old flags
      if (state.gameOver === true) {
        isGameOver = true;
      }

      if (state.winner) {
        isGameOver = true;
        message = state.winner + ' Wins!';
        if (state.reason) {
          details = state.reason;
        }
      }

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
          if (!details) details = state.status;
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
    
    // Setup play again button - redirect to /play page (matchmaking)
    document.getElementById('play-again-btn').addEventListener('click', () => {
      // Redirect to play page where user can enter matchmaking
      window.location.href = '${homeUrl}/play/' + gameName;
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
  const hideUI = req.query.hideUI === 'true';
  await serveGameClient(gameName, roomName, res, hideUI);
});

// Without room name in URL
app.get('/game/:gameName', async (req, res) => {
  const { gameName } = req.params;
  const hideUI = req.query.hideUI === 'true';
  await serveGameClient(gameName, undefined, res, hideUI);
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
    
    const tableName = getGamesTableName();
    await query(
      `UPDATE ${tableName} SET play_count = COALESCE(play_count, 0) + 1, last_played_at = NOW() WHERE name = $1`,
      gameName
    );
    console.log(`Incremented play count for game: ${gameName}`);
  } catch (err) {
    console.error(`Error incrementing play count for ${gameName}:`, err);
  }
}

// API endpoint to list all games
app.get('/api/games', async (req, res) => {
  try {
    const tableName = getGamesTableName();
    const { rows } = await query<Game>(
      `SELECT id, name, description, created_at, play_count, last_played_at FROM ${tableName} ORDER BY created_at DESC`
    );
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
    const tableName = getGamesTableName();
    const { rows } = await query<Game>(
      `SELECT name, play_count, last_played_at FROM ${tableName}`
    );
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

    // Check if player already has a match result (prevent joining while already matched)
    const existingResult = matchmakingResults.get(playerId);
    if (existingResult && existingResult.status === 'matched') {
      // Player is already matched, don't add them to queue again
      return res.json({ message: 'Already matched' });
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

// Get matchmaking stats for a specific game
app.get('/api/matchmaking/stats/:gameName', (req, res) => {
  try {
    const { gameName } = req.params;

    if (!gameName) {
      return res.status(400).json({ error: 'gameName is required' });
    }

    // Decode the game name (Express automatically decodes route params, but just to be sure)
    const decodedGameName = decodeURIComponent(gameName);

    // Count players in queue for this game - need to compare both encoded and decoded versions
    // because the queue might store either depending on how the client sent it
    const playersInQueue = matchmakingQueue.filter(p => {
      const queueGameName = p.gameName;
      // Try to decode the queue game name to compare
      const decodedQueueGameName = queueGameName.includes('%') ? decodeURIComponent(queueGameName) : queueGameName;
      return decodedQueueGameName === decodedGameName || queueGameName === decodedGameName;
    }).length;

    console.log(`[Matchmaking Stats] Requested game: "${gameName}" (decoded: "${decodedGameName}")`);
    console.log(`[Matchmaking Stats] Players in queue: ${playersInQueue}`);
    console.log(`[Matchmaking Stats] Full queue:`, matchmakingQueue.map(p => ({ game: p.gameName, player: p.playerId })));

    res.json({
      gameName: decodedGameName,
      playersInQueue,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Error getting matchmaking stats:', err);
    res.status(500).json({ error: 'Failed to get matchmaking stats' });
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

// Socket.io game logic with error handling
io.on("connection", (socket) => {
  try {
    console.log("User connected:", socket.id);

    // Handle socket errors to prevent crashes
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    socket.on("connect_error", (error) => {
      console.error(`Socket connect error for ${socket.id}:`, error);
    });

  socket.on("join_room", async ({ gameName, roomName, persistentPlayerId, matchmakingPlayerId, username }: { gameName: string, roomName: string, persistentPlayerId?: string, matchmakingPlayerId?: string, username?: string }) => {
    try {
      // Sanitize roomName - strip any query parameters that might have been incorrectly included
      // This handles cases where old client code sent malformed URLs
      const sanitizedRoomName = (roomName?.split('?')[0] || roomName)?.split('&')[0] || roomName;

      const roomId = `${gameName}/${sanitizedRoomName}`;
      console.log(`User ${socket.id} attempting to join room: ${roomId}`, persistentPlayerId ? `with persistent ID: ${persistentPlayerId}` : '', matchmakingPlayerId ? `with matchmaking ID: ${matchmakingPlayerId}` : '');

      // Check if this is a matchmaking room
      const matchmakingRoom = matchmakingRooms.get(sanitizedRoomName);
      if (matchmakingRoom) {
        // Verify the player is expected in this matchmaking room using matchmakingPlayerId
        if (!matchmakingPlayerId || !matchmakingRoom.expectedPlayers.has(matchmakingPlayerId)) {
          console.log(`Player ${socket.id} (matchmakingId: ${matchmakingPlayerId}) attempted to join matchmaking room ${sanitizedRoomName} but was not matched for it`);
          socket.emit("error", "You are not authorized to join this matchmaking room");
          return;
        }
        // Track that this player has connected
        matchmakingRoom.connectedPlayers.add(socket.id);
        console.log(`Matchmaking room ${sanitizedRoomName}: ${matchmakingRoom.connectedPlayers.size}/${matchmakingRoom.expectedPlayers.size} players connected`);

        // Remove player from matchmaking queue (in case they're still there)
        const queueIndex = matchmakingQueue.findIndex(p => p.playerId === matchmakingPlayerId);
        if (queueIndex !== -1) {
          matchmakingQueue.splice(queueIndex, 1);
          console.log(`Removed player ${matchmakingPlayerId} from matchmaking queue on connection`);
        }

        // Clear the matchmaking result for this player so they can join matchmaking again later
        matchmakingResults.delete(matchmakingPlayerId);
        console.log(`Cleared matchmaking result for player ${matchmakingPlayerId}`);
      }

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
          const tableName = getGamesTableName();
          const { rows } = await query<Game>(
            `SELECT * FROM ${tableName} WHERE name = $1`,
            gameName
          );
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
            persistentPlayerMap: new Map(),
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
    
    let isReconnection = false;
    let oldSocketId: string | undefined;
    
    // Handle persistent player ID for reconnections
    if (persistentPlayerId) {
      // Check if this persistent player was already in the room
      oldSocketId = room.persistentPlayerMap.get(persistentPlayerId);
      
      if (oldSocketId && oldSocketId !== socket.id) {
        console.log(`Reconnection detected: persistent player ${persistentPlayerId} had socket ${oldSocketId}, now ${socket.id}`);
        isReconnection = true;
        
        // Update the player's socket ID in state (for games that track by socket ID)
        if (room.state.playerColors && room.state.playerColors[oldSocketId]) {
          const color = room.state.playerColors[oldSocketId];
          delete room.state.playerColors[oldSocketId];
          room.state.playerColors[socket.id] = color;
          console.log(`Restored player color: ${color} for socket ${socket.id}`);
        }
        
        // Remove old player entry
        room.players.delete(oldSocketId);
      }
      
      // Update persistent player mapping
      room.persistentPlayerMap.set(persistentPlayerId, socket.id);
    }
    
    // Add player to room
    room.players.set(socket.id, {
      id: socket.id,
      persistentId: persistentPlayerId,
      username: username || 'Guest',
      joinedAt: Date.now()
    });
    
    // Only trigger playerJoined for new players, not reconnections
    if (!isReconnection && room.logic.moves.playerJoined) {
      try {
        room.logic.moves.playerJoined(room.state, {}, socket.id);
      } catch (e) {
        console.error('Error in playerJoined:', e);
      }
    }
    
    console.log(`User ${socket.id} ${isReconnection ? 'reconnected to' : 'joined'} ${roomId}. Total players: ${room.players.size}`);
    console.log('Player colors:', room.state.playerColors);

      // Send state to all players in room (filter out _ prefixed fields)
      io.to(roomId).emit("state_update", enrichStateWithPlayerMetadata(room.state, room));
      io.to(roomId).emit("player_joined", { playerId: socket.id, count: room.players.size });
    } catch (error) {
      console.error(`Error in join_room for ${socket.id}:`, error);
      socket.emit("error", "Failed to join room. Please try again.");
    }
  });

  socket.on("game_action", async ({ roomId, action, payload }: { roomId: string, action: string, payload: any }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        console.warn(`Action ${action} for non-existent room: ${roomId}`);
        return;
      }

      if (room.logic.moves[action]) {
        try {
          console.log(`Executing action ${action} in room ${roomId} by player ${socket.id}`);
          room.logic.moves[action](room.state, payload, socket.id);

          // Check if game ended and handle ELO updates
          if (room.state.gameEnded) {
            await handleGameEnd(room);
          }

          io.to(roomId).emit("state_update", enrichStateWithPlayerMetadata(room.state, room));
        } catch (e: any) {
          console.error("Game Logic Error:", e);
          socket.emit("error", `Game logic execution failed: ${e.message}`);
        }
      } else {
        console.warn(`Unknown action: ${action}. Available: ${Object.keys(room.logic.moves).join(', ')}`);
      }
    } catch (error) {
      console.error(`Error in game_action for ${socket.id}:`, error);
      socket.emit("error", "Failed to execute action. Please try again.");
    }
  });

  // Handle chat messages
  socket.on("chat_message", ({ roomId, message, username }: { roomId: string, message: string, username: string }) => {
    try {
      if (!roomId || !message || !message.trim()) {
        return;
      }

      // Sanitize message
      const sanitizedMessage = message.trim().substring(0, 200);
      const senderUsername = username || 'Guest';

      console.log(`Chat message in room ${roomId} from ${senderUsername}: ${sanitizedMessage}`);

      // Broadcast to all players in the room
      io.to(roomId).emit("chat_message", {
        sender: senderUsername,
        message: sanitizedMessage,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Error handling chat message:", err);
    }
  });

  socket.on("disconnect", () => {
    try {
      console.log("User disconnected:", socket.id);

      // Remove player from all rooms
      rooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);

          // Call game-specific playerLeft handler if it exists
          if (room.logic.moves.playerLeft) {
            try {
              room.logic.moves.playerLeft(room.state, {}, socket.id);
              io.to(roomId).emit("state_update", enrichStateWithPlayerMetadata(room.state, room));
            } catch (e) {
              console.error(`Error in playerLeft handler for room ${roomId}:`, e);
            }
          }

          io.to(roomId).emit("player_joined", { playerId: socket.id, count: room.players.size });

          // Clean up empty rooms
          if (room.players.size === 0) {
            stopGameLoop(room);
            rooms.delete(roomId);
            console.log(`Cleaned up empty room: ${roomId}`);
          }
        }
      });
    } catch (error) {
      console.error(`Error in disconnect handler for ${socket.id}:`, error);
    }
  });
  } catch (error) {
    console.error(`Error setting up socket handlers for ${socket.id}:`, error);
  }
});

httpServer.listen(PORT, () => {
  console.log(`🎮 Game Server running on http://localhost:${PORT}`);
  console.log(`📝 Create games at http://localhost:3000`);
});

// Graceful shutdown handling
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    console.log('Stopping HTTP server...');
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) {
          console.error('Error closing HTTP server:', err);
          reject(err);
        } else {
          console.log('HTTP server closed');
          resolve();
        }
      });
    });

    // Stop all game loops
    console.log('Stopping all game loops...');
    rooms.forEach((room) => {
      stopGameLoop(room);
    });
    console.log(`Stopped ${rooms.size} game loops`);

    // Disconnect all sockets gracefully
    console.log('Disconnecting all sockets...');
    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
    }
    console.log(`Disconnected ${sockets.length} sockets`);

    // Close Socket.io server
    console.log('Closing Socket.io server...');
    await new Promise<void>((resolve) => {
      io.close(() => {
        console.log('Socket.io server closed');
        resolve();
      });
    });

    console.log('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle various shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});

// Increase max listeners to avoid warnings
process.setMaxListeners(20);

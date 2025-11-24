import { Server, matchMaker } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";
import dotenv from "dotenv";

// Import rooms
import { ChessVariantRoom } from "./rooms/ChessVariantRoom.js";

// Load environment variables
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 2567;
const isDevelopment = process.env.NODE_ENV === "development";

// CORS configuration
const customOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

const defaultOrigins = isDevelopment
  ? [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ]
  : ["https://splork.io", "https://www.splork.io", "https://play.splork.io"];

const allowedOrigins = [...defaultOrigins, ...customOrigins];

console.log("🔒 Allowed origins for CORS:", allowedOrigins);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Still allow for now, but log it
    }
  },
  credentials: true,
}));

app.use(express.json());

// Create HTTP & WebSocket servers
const server = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
  devMode: isDevelopment,
});

// Register room handlers
gameServer.define("chess_variant", ChessVariantRoom);

// Register Colyseus monitor (optional, for development/debugging)
if (process.env.MONITOR_ENABLED === "true") {
  app.use("/colyseus", monitor());
  console.log("📊 Colyseus monitor enabled at /colyseus");
}

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    rooms: matchMaker.stats.roomCount,
    clients: matchMaker.stats.ccu,
  });
});

// API endpoint to list available rooms
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await matchMaker.query({});
    res.json({
      rooms: rooms.map((room) => ({
        roomId: room.roomId,
        name: room.name,
        clients: room.clients,
        maxClients: room.maxClients,
        metadata: room.metadata,
      })),
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// API endpoint for matchmaking
app.post("/api/matchmaking/join", async (req, res) => {
  try {
    const { variant, playerId } = req.body;

    if (!variant || !playerId) {
      return res.status(400).json({ error: "variant and playerId are required" });
    }

    // Find or create a room for this variant
    const room = await matchMaker.joinOrCreate("chess_variant", {
      variant,
      mode: "matchmaking",
    });

    res.json({
      roomId: room.roomId,
      sessionId: room.sessionId,
    });
  } catch (error) {
    console.error("Error in matchmaking:", error);
    res.status(500).json({ error: "Failed to join matchmaking" });
  }
});

// Start the server
gameServer.listen(port);

console.log(`
╔═══════════════════════════════════════════════════════╗
║  🎮 Vibechess Colyseus Server                        ║
║  🌐 WebSocket: ws://localhost:${port}                   ║
║  🔧 HTTP API: http://localhost:${port}                  ║
║  📊 Monitor: http://localhost:${port}/colyseus          ║
║  🏥 Health: http://localhost:${port}/health             ║
╚═══════════════════════════════════════════════════════╝
`);

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    console.log("Shutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await gameServer.gracefullyShutdown(true);
    console.log("Colyseus server shut down gracefully");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});


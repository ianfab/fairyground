# Integration Guide

How to integrate the Colyseus server with your frontend application.

## Installation

### In Your Frontend Project

```bash
npm install colyseus.js
```

## Basic Integration

### 1. Create a Colyseus Client Service

```typescript
// lib/colyseus-client.ts
import { Client, Room } from "colyseus.js";
import type { ChessVariantState } from "./types";

const COLYSEUS_URL = process.env.NEXT_PUBLIC_COLYSEUS_URL || "ws://localhost:2567";

class ColyseusService {
  private client: Client;
  private currentRoom: Room<ChessVariantState> | null = null;

  constructor() {
    this.client = new Client(COLYSEUS_URL);
  }

  async joinRoom(variant: string, playerName: string, rating: number = 1500) {
    try {
      this.currentRoom = await this.client.joinOrCreate<ChessVariantState>(
        "chess_variant",
        {
          variant,
          name: playerName,
          rating,
        }
      );

      return this.currentRoom;
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  }

  async joinById(roomId: string, playerName: string, rating: number = 1500) {
    try {
      this.currentRoom = await this.client.joinById<ChessVariantState>(
        roomId,
        {
          name: playerName,
          rating,
        }
      );

      return this.currentRoom;
    } catch (error) {
      console.error("Failed to join room by ID:", error);
      throw error;
    }
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  leaveRoom() {
    if (this.currentRoom) {
      this.currentRoom.leave();
      this.currentRoom = null;
    }
  }

  async getAvailableRooms() {
    try {
      const rooms = await this.client.getAvailableRooms("chess_variant");
      return rooms;
    } catch (error) {
      console.error("Failed to get available rooms:", error);
      return [];
    }
  }
}

export const colyseusService = new ColyseusService();
```

### 2. Create Type Definitions

```typescript
// lib/types.ts
export interface Player {
  id: string;
  name: string;
  color: string;
  rating: number;
  ready: boolean;
  timeRemaining: number;
}

export interface ChessVariantState {
  players: Map<string, Player>;
  variant: string;
  fen: string;
  currentTurn: string;
  moveHistory: string[];
  gameStatus: "waiting" | "active" | "finished";
  winner: string;
  gameMode: string;
  startTime: number;
  isPaused: boolean;
}
```

### 3. React Component Example

```typescript
// components/ChessGame.tsx
"use client";

import { useEffect, useState } from "react";
import { Room } from "colyseus.js";
import { colyseusService } from "@/lib/colyseus-client";
import type { ChessVariantState } from "@/lib/types";

export default function ChessGame({ variant }: { variant: string }) {
  const [room, setRoom] = useState<Room<ChessVariantState> | null>(null);
  const [state, setState] = useState<ChessVariantState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState("Player");

  const connect = async () => {
    try {
      const gameRoom = await colyseusService.joinRoom(variant, playerName);
      setRoom(gameRoom);
      setIsConnected(true);

      // Listen to state changes
      gameRoom.onStateChange((newState) => {
        setState(newState);
      });

      // Listen to messages
      gameRoom.onMessage("game_start", (message) => {
        console.log("Game started!", message);
      });

      gameRoom.onMessage("move_made", (message) => {
        console.log("Move made:", message);
      });

      gameRoom.onMessage("game_over", (message) => {
        console.log("Game over:", message);
      });

      gameRoom.onError((code, message) => {
        console.error(`Room error (${code}):`, message);
      });

      gameRoom.onLeave((code) => {
        console.log("Left room:", code);
        setIsConnected(false);
      });
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const disconnect = () => {
    colyseusService.leaveRoom();
    setRoom(null);
    setIsConnected(false);
  };

  const makeMove = (from: string, to: string, promotion?: string) => {
    if (room) {
      room.send("move", { from, to, promotion });
    }
  };

  const markReady = () => {
    if (room) {
      room.send("ready");
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <h2 className="text-2xl font-bold">Join Game</h2>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="px-4 py-2 border rounded"
        />
        <button
          onClick={connect}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{variant}</h2>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>

      {state && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Players:</strong> {Object.keys(state.players).length}/2
            </div>
            <div>
              <strong>Status:</strong> {state.gameStatus}
            </div>
            <div>
              <strong>Turn:</strong> {state.currentTurn}
            </div>
            <div>
              <strong>Moves:</strong> {state.moveHistory.length}
            </div>
          </div>

          {state.gameStatus === "waiting" && (
            <button
              onClick={markReady}
              className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Mark Ready
            </button>
          )}

          <div className="mt-4">
            <strong>FEN:</strong>
            <div className="font-mono text-sm mt-2 p-2 bg-gray-100 rounded">
              {state.fen}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Next.js Page Example

```typescript
// app/play/[variant]/page.tsx
import ChessGame from "@/components/ChessGame";

export default function PlayPage({ params }: { params: { variant: string } }) {
  return (
    <div className="container mx-auto">
      <ChessGame variant={params.variant} />
    </div>
  );
}
```

## Advanced Features

### Matchmaking

```typescript
async function joinMatchmaking(variant: string) {
  const response = await fetch("http://localhost:2567/api/matchmaking/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variant,
      playerId: "player-123",
    }),
  });

  const { roomId, sessionId } = await response.json();

  // Join the matched room
  const room = await colyseusService.joinById(roomId);
  return room;
}
```

### Room List

```typescript
async function getRoomList() {
  const response = await fetch("http://localhost:2567/api/rooms");
  const { rooms } = await response.json();

  return rooms.map((room) => ({
    roomId: room.roomId,
    name: room.name,
    clients: room.clients,
    maxClients: room.maxClients,
    variant: room.metadata?.variant,
  }));
}
```

### Spectator Mode

```typescript
async function spectateRoom(roomId: string) {
  const room = await client.joinById(roomId, {
    spectator: true,
  });

  room.onStateChange((state) => {
    // Update spectator view
  });

  return room;
}
```

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_COLYSEUS_URL=ws://localhost:2567
```

For production:

```env
NEXT_PUBLIC_COLYSEUS_URL=wss://your-colyseus-server.com
```

## React Hooks (Optional)

Create a custom hook for easier integration:

```typescript
// hooks/useColyseus.ts
import { useState, useEffect, useCallback } from "react";
import { Room } from "colyseus.js";
import { colyseusService } from "@/lib/colyseus-client";
import type { ChessVariantState } from "@/lib/types";

export function useColyseus(variant: string, playerName: string) {
  const [room, setRoom] = useState<Room<ChessVariantState> | null>(null);
  const [state, setState] = useState<ChessVariantState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      const gameRoom = await colyseusService.joinRoom(variant, playerName);
      setRoom(gameRoom);
      setIsConnected(true);
      setError(null);

      gameRoom.onStateChange((newState) => {
        setState(newState);
      });

      gameRoom.onError((code, message) => {
        setError(`Error ${code}: ${message}`);
      });

      gameRoom.onLeave(() => {
        setIsConnected(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  }, [variant, playerName]);

  const disconnect = useCallback(() => {
    colyseusService.leaveRoom();
    setRoom(null);
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(
    (type: string, data?: any) => {
      if (room) {
        room.send(type, data);
      }
    },
    [room]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    room,
    state,
    isConnected,
    error,
    connect,
    disconnect,
    sendMessage,
  };
}
```

Usage:

```typescript
function ChessGame({ variant }: { variant: string }) {
  const { state, isConnected, connect, sendMessage } = useColyseus(
    variant,
    "Player"
  );

  const makeMove = (from: string, to: string) => {
    sendMessage("move", { from, to });
  };

  // ... rest of component
}
```

## WebSocket vs HTTP

- **Game State & Actions**: Use WebSocket (Colyseus)
- **REST API calls**: Use HTTP endpoints

Example:

```typescript
// WebSocket for real-time game
const room = await colyseusService.joinRoom("chess", "Alice");
room.send("move", { from: "e2", to: "e4" });

// HTTP for fetching data
const rooms = await fetch("http://localhost:2567/api/rooms");
```

## Testing

Test your integration with the provided `example-client.html`:

1. Start the Colyseus server: `npm run dev`
2. Open `example-client.html` in your browser
3. Connect and test functionality
4. Verify your frontend integration matches this behavior

## Troubleshooting

### CORS Issues

Update `ALLOWED_ORIGINS` in the Colyseus server's `.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yoursite.com
```

### Connection Timeout

```typescript
const room = await colyseusService.joinRoom(variant, playerName);

// Set timeout
setTimeout(() => {
  if (!room.hasJoined) {
    console.error("Connection timeout");
  }
}, 5000);
```

### State Not Updating

Ensure you're listening to state changes:

```typescript
room.onStateChange((state) => {
  setState({ ...state }); // Create new object reference for React
});
```

## Next Steps

- Integrate with chessgroundx for board rendering
- Add move validation with ffish-es6
- Implement time controls UI
- Add chat functionality
- Create lobby/room browser
- Implement spectator mode

## References

- [Colyseus Documentation](https://docs.colyseus.io/)
- [Colyseus Client API](https://docs.colyseus.io/client/)
- [Example Client](./example-client.html)


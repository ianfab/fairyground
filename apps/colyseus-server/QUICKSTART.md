# Quick Start Guide

Get the Colyseus server running in 5 minutes!

## Prerequisites

- Node.js 18+
- npm

## 1. Setup Environment

```bash
cd apps/colyseus-server

# Copy environment file
cp env.example .env

# Edit .env if needed (defaults work for local development)
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Run the Server

### Development Mode

```bash
npm run dev
```

The server will start at `ws://localhost:2567`

### Production Mode

```bash
npm run build
npm start
```

## 4. Test the Connection

Open `example-client.html` in your browser:

1. Make sure the server URL is set to `ws://localhost:2567`
2. Enter your player name
3. Select a chess variant
4. Click "Connect to Room"
5. Open another browser window/tab with the same file
6. Both players click "Mark Ready"
7. Start playing!

## 5. API Endpoints

Once running, you can access:

- **WebSocket**: `ws://localhost:2567`
- **Health Check**: `http://localhost:2567/health`
- **Room List**: `http://localhost:2567/api/rooms`
- **Monitor** (if enabled): `http://localhost:2567/colyseus`

## Testing with curl

```bash
# Health check
curl http://localhost:2567/health

# List rooms
curl http://localhost:2567/api/rooms

# Join matchmaking
curl -X POST http://localhost:2567/api/matchmaking/join \
  -H "Content-Type: application/json" \
  -d '{"variant": "chess", "playerId": "player123"}'
```

## Connecting from JavaScript

```javascript
import { Client } from "colyseus.js";

const client = new Client("ws://localhost:2567");
const room = await client.joinOrCreate("chess_variant", {
  variant: "chess",
  name: "Player 1",
  rating: 1500
});

// Listen to state changes
room.onStateChange((state) => {
  console.log("State:", state);
});

// Send a move
room.send("move", { from: "e2", to: "e4" });
```

## Next Steps

- Read the full [README.md](./README.md) for deployment instructions
- Check out [ChessVariantRoom.ts](./src/rooms/ChessVariantRoom.ts) to understand the room logic
- Integrate with your frontend application
- Deploy to DigitalOcean (see README.md)

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 2567
lsof -i :2567
kill -9 <PID>
```

### Connection Refused

- Make sure the server is running (`npm run dev`)
- Check firewall settings
- Verify the port in `.env` matches your client configuration

### WebSocket Connection Failed

- Ensure you're using `ws://` (not `http://`) for the WebSocket URL
- Check CORS settings in `.env` if connecting from a different origin
- Look at browser console for detailed error messages

## Support

- Check the main [README.md](./README.md) for detailed documentation
- Review Colyseus documentation: https://docs.colyseus.io/
- Open an issue if you encounter problems


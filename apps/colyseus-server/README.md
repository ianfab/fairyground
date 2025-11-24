# Vibechess Colyseus Server

A multiplayer server using [Colyseus](https://colyseus.io/) for real-time chess variant games, particularly optimized for 3D game experiences.

## Features

- 🎮 Real-time multiplayer chess variants
- 🔄 Automatic reconnection handling
- 🕐 Time controls and clock management
- 🎯 Matchmaking system
- 📊 Built-in monitoring dashboard
- 🌐 CORS-enabled for web clients
- ⚡ WebSocket-based communication
- 🔒 Room-based game isolation

## Architecture

### Why Colyseus?

Colyseus provides several advantages over the existing Socket.io implementation:

1. **State Synchronization**: Automatic delta-based state synchronization reduces bandwidth
2. **Schema System**: Type-safe state management with @colyseus/schema
3. **Room Management**: Built-in room lifecycle and matchmaking
4. **Monitoring**: Web-based dashboard to monitor rooms and connections
5. **Reconnection**: Automatic client reconnection handling
6. **Scalability**: Better suited for scaling across multiple servers

### Room Architecture

- `ChessVariantRoom`: Main room handler for chess variant games
  - Supports multiple chess variants (standard, Chess960, atomic, crazyhouse, etc.)
  - Time controls with per-player clocks
  - Move validation (ready for ffish-es6 integration)
  - Chat system
  - Draw offers and resignation
  - Automatic game over detection

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL (optional, for persistent storage)

### Installation

```bash
cd apps/colyseus-server
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=2567
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,https://yoursite.com
MONITOR_ENABLED=true
MONITOR_PASSWORD=admin
```

### Development

```bash
npm run dev
```

The server will start on `ws://localhost:2567`

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### HTTP Endpoints

- `GET /health` - Health check endpoint
- `GET /api/rooms` - List all active rooms
- `POST /api/matchmaking/join` - Join matchmaking queue
- `GET /colyseus` - Monitoring dashboard (if enabled)

### WebSocket Connection

```typescript
import { Client } from "colyseus.js";

const client = new Client("ws://localhost:2567");

// Join or create a room
const room = await client.joinOrCreate("chess_variant", {
  variant: "chess",
  mode: "casual"
});

// Listen to state changes
room.onStateChange((state) => {
  console.log("State changed:", state);
});

// Send a move
room.send("move", {
  from: "e2",
  to: "e4"
});

// Listen to messages
room.onMessage("move_made", (message) => {
  console.log("Move made:", message);
});
```

## Deployment

### DigitalOcean Droplet

#### 1. Create a Droplet

- Choose Ubuntu 22.04 LTS
- Select appropriate size (start with Basic $6/month)
- Add SSH keys
- Create droplet

#### 2. Initial Server Setup

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
apt install -y nginx

# Install PostgreSQL (optional)
apt install -y postgresql postgresql-contrib
```

#### 3. Deploy Application

```bash
# Create app directory
mkdir -p /var/www/colyseus-server
cd /var/www/colyseus-server

# Clone your repository
git clone <your-repo-url> .

# Navigate to colyseus-server
cd apps/colyseus-server

# Install dependencies
npm install

# Create .env file
nano .env

# Build the application
npm run build
```

#### 4. Configure PM2

```bash
# Start the server with PM2
pm2 start dist/index.js --name colyseus-server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 5. Configure Nginx

Create Nginx configuration:

```bash
nano /etc/nginx/sites-available/colyseus-server
```

Add configuration:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

upstream colyseus {
    server 127.0.0.1:2567;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://colyseus;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/colyseus-server /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 6. Setup SSL (Optional but Recommended)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx for HTTPS
```

#### 7. Configure Firewall

```bash
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw enable
```

### Environment Variables for Production

Update your `.env` file on the server:

```env
PORT=2567
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
MONITOR_ENABLED=false
DATABASE_URL=postgresql://user:password@localhost:5432/vibechess
```

### Monitoring

```bash
# View logs
pm2 logs colyseus-server

# Monitor processes
pm2 monit

# Check status
pm2 status
```

### Updating

```bash
cd /var/www/colyseus-server/apps/colyseus-server

# Pull latest changes
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart colyseus-server
```

## Monitoring Dashboard

Access the Colyseus monitor at `http://your-domain.com/colyseus` (if enabled)

Default credentials:
- Username: `admin`
- Password: Set in `MONITOR_PASSWORD` env variable

## Scaling

### Horizontal Scaling with Redis

For production deployments with multiple servers:

```bash
npm install @colyseus/redis-presence @colyseus/redis-driver
```

Update `src/index.ts`:

```typescript
import { RedisPresence } from "@colyseus/redis-presence";
import { RedisDriver } from "@colyseus/redis-driver";

const gameServer = new Server({
  transport: new WebSocketTransport({ server }),
  presence: new RedisPresence(),
  driver: new RedisDriver(),
  devMode: isDevelopment,
});
```

## Integrating with Fairy-Stockfish

To integrate ffish-es6 for chess variant logic:

```typescript
import { ffish } from 'ffish-es6';

// In ChessVariantRoom
private validateMove(from: string, to: string): boolean {
  // Use ffish to validate moves
  const board = ffish.Board(this.state.variant, this.state.fen);
  const moves = board.legalMoves().split(' ');
  const moveStr = from + to;
  return moves.includes(moveStr);
}
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 2567
lsof -i :2567

# Kill the process
kill -9 <PID>
```

### WebSocket Connection Issues

- Ensure firewall allows WebSocket connections
- Check Nginx WebSocket proxy configuration
- Verify CORS settings in `.env`

### High Memory Usage

- Adjust room disposal settings
- Implement state cleanup in `onDispose`
- Monitor with `pm2 monit`

## Development Roadmap

- [ ] Integrate ffish-es6 for move validation
- [ ] Implement ELO rating system
- [ ] Add spectator mode
- [ ] Implement game replay/analysis
- [ ] Add tournament support
- [ ] Implement 3D board state synchronization
- [ ] Add voice chat support
- [ ] Implement anti-cheat measures

## License

ISC


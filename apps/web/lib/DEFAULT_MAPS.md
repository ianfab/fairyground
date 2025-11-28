# Default Game Maps

This file documents the default maps available for 2D and 3D shooter games. These maps can be referenced when generating games with AI.

## 2D Maps

### 1. Basic Shooter (`MAP_2D_BASIC_SHOOTER`)

**Description:** Mix of open space with rectangular obstacles for cover

**Dimensions:** 800x600 pixels

**Features:**
- Various sized cover and wall obstacles interspersed throughout
- Open spaces for movement
- Strategic cover positions
- 4 corner spawn points

**Use Cases:**
- Top-down shooters
- Multiplayer deathmatch
- Twin-stick shooters

### 2. Urban Warfare (`MAP_2D_URBAN`)

**Description:** Real-world style map with buildings, rooms, and terrain

**Dimensions:** 800x600 pixels

**Features:**
- Multiple buildings with doorways (gaps in walls)
- Interior rooms you can enter
- Mixed terrain: buildings, concrete barriers, bushes
- 4 spawn points inside buildings
- More tactical gameplay with indoor/outdoor areas

**Use Cases:**
- Tactical shooters
- Battle royale style games
- Strategic combat games

## 3D Maps

### 1. AWP 1v1 (`MAP_3D_AWP_STYLE`)

**Description:** Symmetrical sniper duel map inspired by CS:GO AWP maps

**Dimensions:** 100x200 units

**Features:**
- High ground platforms on each side
- Central divider with gap
- Long sightlines for sniper duels
- Side cover for flanking
- Symmetrical design for fair 1v1

**Use Cases:**
- 1v1 sniper duels
- Competitive PvP
- Skill-based combat

### 2. Basic Arena (`MAP_3D_BASIC`)

**Description:** Simple symmetrical arena with spawn walls

**Dimensions:** 80x80 units

**Features:**
- Spawn walls for each player
- Center obstacles and cover
- Open middle for direct engagement
- Clean, simple layout

**Use Cases:**
- Quick deathmatch
- Beginner-friendly maps
- Fast-paced action

### 3. Bhop Paradise (`MAP_3D_KRUNKER`)

**Description:** Fast-movement map optimized for bunny hopping (Krunker.io style)

**Dimensions:** 120x120 units

**Features:**
- Central elevated platform with ramps
- Corner platforms at different heights
- Multiple elevation levels
- Optimized for fast strafing and jumping
- Small jump platforms scattered around
- Low walls for momentum preservation

**Use Cases:**
- Fast-paced shooters
- Movement-focused games
- Bunny hop / strafe jumping mechanics
- Arena shooters with vertical gameplay

## Usage

### In 2D Games

```javascript
import { MAP_2D_BASIC_SHOOTER } from '@/lib/default-maps';

// Access map properties
const obstacles = MAP_2D_BASIC_SHOOTER.obstacles;
const spawnPoints = MAP_2D_BASIC_SHOOTER.spawnPoints;

// Draw obstacles
function drawObstacles(ctx) {
  obstacles.forEach(obstacle => {
    ctx.fillStyle = obstacle.color || '#555';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

// Check collision
function checkCollision(x, y, radius) {
  return obstacles.some(obstacle => {
    return x + radius > obstacle.x &&
           x - radius < obstacle.x + obstacle.width &&
           y + radius > obstacle.y &&
           y - radius < obstacle.y + obstacle.height;
  });
}
```

### In 3D Games (Three.js)

```javascript
import * as THREE from 'three';
import { MAP_3D_KRUNKER } from '@/lib/default-maps';

// Create map geometry
function createMapGeometry(scene) {
  MAP_3D_KRUNKER.objects.forEach(obj => {
    const geometry = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
    const material = new THREE.MeshBasicMaterial({ color: obj.color });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
    mesh.userData.collidable = true;
    mesh.userData.type = obj.type;
    
    scene.add(mesh);
  });
}

// Spawn player
function spawnPlayer(playerIndex, camera) {
  const spawn = MAP_3D_KRUNKER.spawnPoints[playerIndex];
  camera.position.set(...spawn.position);
  camera.rotation.y = spawn.rotation;
}
```

## Map Data Structure

### 2D Map Format

```typescript
interface Map2D {
  name: string;
  width: number;
  height: number;
  obstacles: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'wall' | 'cover' | 'building';
    color?: string;
  }>;
  spawnPoints: Array<{ x: number; y: number }>;
  description: string;
}
```

### 3D Map Format

```typescript
interface Map3D {
  name: string;
  size: { width: number; length: number };
  objects: Array<{
    position: [number, number, number];
    size: [number, number, number];
    type: 'wall' | 'platform' | 'cover' | 'ramp';
    color?: string;
  }>;
  spawnPoints: Array<{
    position: [number, number, number];
    rotation: number;
  }>;
  description: string;
}
```

## Creating Custom Maps

You can create custom maps using the same data structure:

```javascript
const myCustomMap = {
  name: "My Custom Map",
  width: 800,
  height: 600,
  obstacles: [
    { x: 100, y: 100, width: 50, height: 50, type: 'wall', color: '#555' },
    // ... more obstacles
  ],
  spawnPoints: [
    { x: 50, y: 50 },
    { x: 750, y: 550 }
  ],
  description: "A custom map for my game"
};
```

## Tips for Map Design

### 2D Maps
- Balance open space with cover
- Provide multiple paths between areas
- Consider spawn point balance
- Think about sightlines and long-range vs close combat
- Use different obstacle types for visual variety

### 3D Maps
- Use elevation to create interesting gameplay
- Add ramps for vertical movement
- Consider spawn camping prevention
- Balance symmetry with variety
- Think about movement flow and momentum

## AI Generation Instructions

When asking the AI to generate a game with these maps, you can say:

- "Create a 2D shooter using the Urban map"
- "Make a 3D FPS with the AWP style map"
- "Build a fast-paced shooter on the Bhop Paradise map"
- "Generate a tactical 2D shooter with the Basic Shooter map"

The AI will automatically import and use the appropriate map configuration.


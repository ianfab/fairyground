// Default map configurations for 2D and 3D shooter games
// These can be referenced by the AI model when generating games

export interface Map2DObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'cover' | 'building';
  color?: string;
}

export interface Map2D {
  name: string;
  width: number;
  height: number;
  obstacles: Map2DObstacle[];
  spawnPoints: Array<{ x: number; y: number }>;
  description: string;
}

export interface Map3DObject {
  position: [number, number, number]; // x, y, z
  size: [number, number, number]; // width, height, depth
  type: 'wall' | 'platform' | 'cover' | 'ramp';
  color?: string;
}

export interface Map3D {
  name: string;
  size: { width: number; length: number }; // Arena size
  objects: Map3DObject[];
  spawnPoints: Array<{ position: [number, number, number]; rotation: number }>;
  description: string;
}

// ========== 2D MAPS ==========

export const MAP_2D_BASIC_SHOOTER: Map2D = {
  name: "Basic Shooter",
  width: 800,
  height: 600,
  description: "Mix of open space with rectangular obstacles for cover",
  obstacles: [
    // Center cluster
    { x: 350, y: 250, width: 100, height: 40, type: 'wall', color: '#555' },
    { x: 370, y: 310, width: 60, height: 60, type: 'cover', color: '#666' },
    
    // Top left area
    { x: 100, y: 100, width: 80, height: 30, type: 'wall', color: '#555' },
    { x: 150, y: 150, width: 40, height: 80, type: 'wall', color: '#555' },
    
    // Top right area
    { x: 620, y: 80, width: 70, height: 50, type: 'cover', color: '#666' },
    { x: 580, y: 160, width: 50, height: 40, type: 'cover', color: '#666' },
    
    // Bottom left area
    { x: 120, y: 450, width: 60, height: 60, type: 'cover', color: '#666' },
    { x: 80, y: 380, width: 40, height: 50, type: 'wall', color: '#555' },
    
    // Bottom right area
    { x: 650, y: 470, width: 80, height: 40, type: 'wall', color: '#555' },
    { x: 590, y: 420, width: 50, height: 30, type: 'cover', color: '#666' },
    
    // Mid obstacles
    { x: 250, y: 300, width: 50, height: 50, type: 'cover', color: '#666' },
    { x: 500, y: 280, width: 45, height: 70, type: 'wall', color: '#555' },
    { x: 320, y: 150, width: 35, height: 35, type: 'cover', color: '#666' },
    { x: 450, y: 450, width: 40, height: 40, type: 'cover', color: '#666' },
  ],
  spawnPoints: [
    { x: 50, y: 50 },
    { x: 750, y: 550 },
    { x: 50, y: 550 },
    { x: 750, y: 50 },
  ]
};

export const MAP_2D_URBAN: Map2D = {
  name: "Urban Warfare",
  width: 800,
  height: 600,
  description: "Real-world style map with buildings, rooms, and terrain",
  obstacles: [
    // Large building top-left (with room gaps)
    { x: 50, y: 50, width: 200, height: 20, type: 'building', color: '#8B4513' }, // Top wall
    { x: 50, y: 50, width: 20, height: 180, type: 'building', color: '#8B4513' }, // Left wall
    { x: 50, y: 210, width: 90, height: 20, type: 'building', color: '#8B4513' }, // Bottom left part (gap for door)
    { x: 170, y: 210, width: 80, height: 20, type: 'building', color: '#8B4513' }, // Bottom right part (gap for door)
    { x: 230, y: 50, width: 20, height: 180, type: 'building', color: '#8B4513' }, // Right wall
    // Internal wall in building
    { x: 120, y: 70, width: 20, height: 80, type: 'building', color: '#654321' },
    
    // Medium building top-right
    { x: 580, y: 80, width: 170, height: 20, type: 'building', color: '#8B4513' }, // Top wall
    { x: 580, y: 80, width: 20, height: 140, type: 'building', color: '#8B4513' }, // Left wall  
    { x: 730, y: 80, width: 20, height: 140, type: 'building', color: '#8B4513' }, // Right wall
    { x: 580, y: 200, width: 70, height: 20, type: 'building', color: '#8B4513' }, // Bottom left (gap)
    { x: 680, y: 200, width: 70, height: 20, type: 'building', color: '#8B4513' }, // Bottom right (gap)
    
    // Small building bottom-left
    { x: 80, y: 430, width: 120, height: 20, type: 'building', color: '#8B4513' },
    { x: 80, y: 430, width: 20, height: 120, type: 'building', color: '#8B4513' },
    { x: 180, y: 430, width: 20, height: 120, type: 'building', color: '#8B4513' },
    { x: 80, y: 530, width: 50, height: 20, type: 'building', color: '#8B4513' }, // Gap for door
    { x: 150, y: 530, width: 50, height: 20, type: 'building', color: '#8B4513' },
    
    // Warehouse bottom-right
    { x: 500, y: 400, width: 250, height: 20, type: 'building', color: '#696969' },
    { x: 500, y: 400, width: 20, height: 150, type: 'building', color: '#696969' },
    { x: 730, y: 400, width: 20, height: 150, type: 'building', color: '#696969' },
    { x: 500, y: 530, width: 100, height: 20, type: 'building', color: '#696969' }, // Gap
    { x: 630, y: 530, width: 120, height: 20, type: 'building', color: '#696969' },
    
    // Center area - street obstacles
    { x: 350, y: 250, width: 100, height: 40, type: 'cover', color: '#777' }, // Barrier
    { x: 320, y: 320, width: 60, height: 30, type: 'cover', color: '#888' }, // Concrete block
    { x: 420, y: 310, width: 50, height: 50, type: 'cover', color: '#888' }, // Concrete block
    
    // Terrain features
    { x: 280, y: 100, width: 80, height: 60, type: 'cover', color: '#556B2F' }, // Bush/hedge
    { x: 400, y: 130, width: 70, height: 50, type: 'cover', color: '#556B2F' }, // Bush/hedge
    { x: 300, y: 480, width: 90, height: 40, type: 'cover', color: '#556B2F' }, // Bush/hedge
  ],
  spawnPoints: [
    { x: 100, y: 120 }, // Inside top-left building
    { x: 650, y: 140 }, // Inside top-right building
    { x: 130, y: 480 }, // Inside bottom-left building
    { x: 600, y: 470 }, // Inside warehouse
  ]
};

// ========== 3D MAPS ==========

export const MAP_3D_AWP_STYLE: Map3D = {
  name: "AWP 1v1",
  size: { width: 100, length: 200 },
  description: "Symmetrical sniper duel map with high ground and sightlines (CS:GO AWP style)",
  objects: [
    // Center divider with gap
    { position: [-15, 2.5, 0], size: [30, 5, 3], type: 'wall', color: '#666' },
    { position: [15, 2.5, 0], size: [30, 5, 3], type: 'wall', color: '#666' },
    
    // High ground platforms (both sides)
    // Player 1 side
    { position: [0, 5, -70], size: [20, 1, 15], type: 'platform', color: '#555' },
    { position: [-25, 2.5, -60], size: [15, 5, 10], type: 'wall', color: '#666' }, // Side cover
    { position: [25, 2.5, -60], size: [15, 5, 10], type: 'wall', color: '#666' }, // Side cover
    
    // Player 2 side (mirrored)
    { position: [0, 5, 70], size: [20, 1, 15], type: 'platform', color: '#555' },
    { position: [-25, 2.5, 60], size: [15, 5, 10], type: 'wall', color: '#666' }, // Side cover
    { position: [25, 2.5, 60], size: [15, 5, 10], type: 'wall', color: '#666' }, // Side cover
    
    // Ramps to high ground
    { position: [0, 2.5, -85], size: [8, 0.5, 10], type: 'ramp', color: '#777' },
    { position: [0, 2.5, 85], size: [8, 0.5, 10], type: 'ramp', color: '#777' },
    
    // Mid cover pieces
    { position: [-20, 1.5, -20], size: [8, 3, 8], type: 'cover', color: '#888' },
    { position: [20, 1.5, -20], size: [8, 3, 8], type: 'cover', color: '#888' },
    { position: [-20, 1.5, 20], size: [8, 3, 8], type: 'cover', color: '#888' },
    { position: [20, 1.5, 20], size: [8, 3, 8], type: 'cover', color: '#888' },
    
    // Perimeter walls
    { position: [-50, 5, 0], size: [2, 10, 200], type: 'wall', color: '#444' },
    { position: [50, 5, 0], size: [2, 10, 200], type: 'wall', color: '#444' },
    { position: [0, 5, -100], size: [100, 10, 2], type: 'wall', color: '#444' },
    { position: [0, 5, 100], size: [100, 10, 2], type: 'wall', color: '#444' },
  ],
  spawnPoints: [
    { position: [0, 1, -90], rotation: 0 },
    { position: [0, 1, 90], rotation: Math.PI },
  ]
};

export const MAP_3D_BASIC: Map3D = {
  name: "Basic Arena",
  size: { width: 80, length: 80 },
  description: "Symmetrical arena with spawn walls and open middle space",
  objects: [
    // Player 1 spawn wall
    { position: [0, 3, -35], size: [40, 6, 3], type: 'wall', color: '#555' },
    { position: [-15, 1.5, -30], size: [8, 3, 8], type: 'cover', color: '#666' },
    { position: [15, 1.5, -30], size: [8, 3, 8], type: 'cover', color: '#666' },
    
    // Player 2 spawn wall  
    { position: [0, 3, 35], size: [40, 6, 3], type: 'wall', color: '#555' },
    { position: [-15, 1.5, 30], size: [8, 3, 8], type: 'cover', color: '#666' },
    { position: [15, 1.5, 30], size: [8, 3, 8], type: 'cover', color: '#666' },
    
    // Center obstacles
    { position: [0, 2, 0], size: [10, 4, 10], type: 'cover', color: '#777' },
    { position: [-20, 1.5, 0], size: [6, 3, 6], type: 'cover', color: '#888' },
    { position: [20, 1.5, 0], size: [6, 3, 6], type: 'cover', color: '#888' },
    { position: [0, 1.5, -15], size: [6, 3, 6], type: 'cover', color: '#888' },
    { position: [0, 1.5, 15], size: [6, 3, 6], type: 'cover', color: '#888' },
    
    // Perimeter walls
    { position: [-40, 5, 0], size: [2, 10, 80], type: 'wall', color: '#444' },
    { position: [40, 5, 0], size: [2, 10, 80], type: 'wall', color: '#444' },
    { position: [0, 5, -40], size: [80, 10, 2], type: 'wall', color: '#444' },
    { position: [0, 5, 40], size: [80, 10, 2], type: 'wall', color: '#444' },
  ],
  spawnPoints: [
    { position: [0, 1, -38], rotation: 0 },
    { position: [0, 1, 38], rotation: Math.PI },
  ]
};

export const MAP_3D_KRUNKER: Map3D = {
  name: "Bhop Paradise",
  size: { width: 120, length: 120 },
  description: "Krunker.io style map optimized for bunny hopping with varied elevation",
  objects: [
    // Central elevated platform
    { position: [0, 8, 0], size: [25, 2, 25], type: 'platform', color: '#666' },
    { position: [0, 4, 0], size: [5, 8, 5], type: 'wall', color: '#555' }, // Center pillar
    
    // Ramps to center (4 directions)
    { position: [0, 4, -20], size: [12, 1, 10], type: 'ramp', color: '#777' },
    { position: [0, 4, 20], size: [12, 1, 10], type: 'ramp', color: '#777' },
    { position: [-20, 4, 0], size: [10, 1, 12], type: 'ramp', color: '#777' },
    { position: [20, 4, 0], size: [10, 1, 12], type: 'ramp', color: '#777' },
    
    // Corner platforms (elevated)
    { position: [-40, 5, -40], size: [15, 1, 15], type: 'platform', color: '#666' },
    { position: [40, 5, -40], size: [15, 1, 15], type: 'platform', color: '#666' },
    { position: [-40, 5, 40], size: [15, 1, 15], type: 'platform', color: '#666' },
    { position: [40, 5, 40], size: [15, 1, 15], type: 'platform', color: '#666' },
    
    // Small ramps to corner platforms
    { position: [-35, 2.5, -30], size: [8, 0.5, 8], type: 'ramp', color: '#777' },
    { position: [35, 2.5, -30], size: [8, 0.5, 8], type: 'ramp', color: '#777' },
    { position: [-35, 2.5, 30], size: [8, 0.5, 8], type: 'ramp', color: '#777' },
    { position: [35, 2.5, 30], size: [8, 0.5, 8], type: 'ramp', color: '#777' },
    
    // Mid-level obstacles for movement flow
    { position: [-20, 2, -20], size: [8, 4, 8], type: 'cover', color: '#888' },
    { position: [20, 2, -20], size: [8, 4, 8], type: 'cover', color: '#888' },
    { position: [-20, 2, 20], size: [8, 4, 8], type: 'cover', color: '#888' },
    { position: [20, 2, 20], size: [8, 4, 8], type: 'cover', color: '#888' },
    
    // Low walls for strafing (good for bhop)
    { position: [0, 1, -45], size: [20, 2, 3], type: 'wall', color: '#666' },
    { position: [0, 1, 45], size: [20, 2, 3], type: 'wall', color: '#666' },
    { position: [-45, 1, 0], size: [3, 2, 20], type: 'wall', color: '#666' },
    { position: [45, 1, 0], size: [3, 2, 20], type: 'wall', color: '#666' },
    
    // Small jump platforms scattered around
    { position: [-10, 3, -10], size: [5, 0.5, 5], type: 'platform', color: '#777' },
    { position: [10, 3, -10], size: [5, 0.5, 5], type: 'platform', color: '#777' },
    { position: [-10, 3, 10], size: [5, 0.5, 5], type: 'platform', color: '#777' },
    { position: [10, 3, 10], size: [5, 0.5, 5], type: 'platform', color: '#777' },
    
    // Perimeter walls
    { position: [-60, 7, 0], size: [2, 14, 120], type: 'wall', color: '#444' },
    { position: [60, 7, 0], size: [2, 14, 120], type: 'wall', color: '#444' },
    { position: [0, 7, -60], size: [120, 14, 2], type: 'wall', color: '#444' },
    { position: [0, 7, 60], size: [120, 14, 2], type: 'wall', color: '#444' },
  ],
  spawnPoints: [
    { position: [-50, 1, -50], rotation: Math.PI / 4 },
    { position: [50, 1, 50], rotation: -3 * Math.PI / 4 },
    { position: [-50, 1, 50], rotation: 3 * Math.PI / 4 },
    { position: [50, 1, -50], rotation: -Math.PI / 4 },
  ]
};

// Export all maps in organized collections
export const DEFAULT_2D_MAPS = {
  basicShooter: MAP_2D_BASIC_SHOOTER,
  urban: MAP_2D_URBAN,
};

export const DEFAULT_3D_MAPS = {
  awpStyle: MAP_3D_AWP_STYLE,
  basic: MAP_3D_BASIC,
  krunker: MAP_3D_KRUNKER,
};

// Helper function to generate code snippet for using a 2D map
export function generate2DMapCode(map: Map2D): string {
  return `// Using the "${map.name}" map
const MAP_WIDTH = ${map.width};
const MAP_HEIGHT = ${map.height};

// Obstacles for collision and rendering
const obstacles = ${JSON.stringify(map.obstacles, null, 2)};

// Spawn points for players
const spawnPoints = ${JSON.stringify(map.spawnPoints, null, 2)};

// Draw obstacles
function drawObstacles(ctx) {
  obstacles.forEach(obstacle => {
    ctx.fillStyle = obstacle.color || '#555';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    // Add border for better visibility
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

// Check collision with obstacles
function checkCollision(x, y, radius) {
  return obstacles.some(obstacle => {
    return x + radius > obstacle.x &&
           x - radius < obstacle.x + obstacle.width &&
           y + radius > obstacle.y &&
           y - radius < obstacle.y + obstacle.height;
  });
}

// Get spawn point for player
function getSpawnPoint(playerIndex) {
  return spawnPoints[playerIndex % spawnPoints.length];
}`;
}

// Helper function to generate code snippet for using a 3D map
export function generate3DMapCode(map: Map3D): string {
  return `// Using the "${map.name}" map
const MAP_SIZE = ${JSON.stringify(map.size)};

// 3D objects for the map
const mapObjects = ${JSON.stringify(map.objects, null, 2)};

// Spawn points for players
const spawnPoints = ${JSON.stringify(map.spawnPoints, null, 2)};

// Create 3D objects (using Three.js)
function createMapGeometry(scene) {
  const objectMeshes = [];
  
  mapObjects.forEach(obj => {
    let geometry;
    
    if (obj.type === 'ramp') {
      // Create a ramp using a box that's rotated
      geometry = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
    } else {
      geometry = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
    }
    
    const material = new THREE.MeshBasicMaterial({ 
      color: obj.color || '#555',
      wireframe: false 
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
    
    // Add collision data
    mesh.userData.collidable = true;
    mesh.userData.type = obj.type;
    
    scene.add(mesh);
    objectMeshes.push(mesh);
  });
  
  return objectMeshes;
}

// Get spawn point for player
function getSpawnPoint(playerIndex) {
  const spawn = spawnPoints[playerIndex % spawnPoints.length];
  return {
    position: spawn.position,
    rotation: spawn.rotation
  };
}

// Simple 3D collision check (AABB)
function checkCollision3D(position, size, mapObjects) {
  return mapObjects.some(obj => {
    if (obj.userData.type === 'platform' && position[1] < obj.position.y + obj.size[1]/2) {
      return false; // Can walk under platforms
    }
    
    return Math.abs(position[0] - obj.position[0]) < (size[0] + obj.size[0]) / 2 &&
           Math.abs(position[1] - obj.position[1]) < (size[1] + obj.size[1]) / 2 &&
           Math.abs(position[2] - obj.position[2]) < (size[2] + obj.size[2]) / 2;
  });
}`;
}


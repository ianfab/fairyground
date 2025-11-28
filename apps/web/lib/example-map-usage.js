// EXAMPLE: 2D Shooter using MAP_2D_BASIC_SHOOTER
// This demonstrates how to use the default maps in a game

// NOTE: This is just an example for reference. 
// The AI will generate code like this when you request a game with a specific map.

/*
import { MAP_2D_BASIC_SHOOTER } from '@/lib/default-maps';

// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  const canvas = document.createElement('canvas');
  canvas.width = MAP_2D_BASIC_SHOOTER.width;
  canvas.height = MAP_2D_BASIC_SHOOTER.height;
  canvas.style.cssText = 'display: block; margin: 40px auto; background: #1a1a2e; border: 2px solid #16213e;';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const obstacles = MAP_2D_BASIC_SHOOTER.obstacles;
  
  // Player controls
  const keys = {};
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  
  // Send input state continuously
  setInterval(() => {
    const input = {
      up: keys['KeyW'] || keys['ArrowUp'] || false,
      down: keys['KeyS'] || keys['ArrowDown'] || false,
      left: keys['KeyA'] || keys['ArrowLeft'] || false,
      right: keys['KeyD'] || keys['ArrowRight'] || false
    };
    
    if (input.up || input.down || input.left || input.right) {
      emitAction('input', input);
    }
  }, 16); // ~60fps
  
  // Shooting
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    emitAction('shoot', { targetX: x, targetY: y });
  });
  
  // Check collision with obstacles
  function checkObstacleCollision(x, y, radius) {
    return obstacles.some(obstacle => {
      return x + radius > obstacle.x &&
             x - radius < obstacle.x + obstacle.width &&
             y + radius > obstacle.y &&
             y - radius < obstacle.y + obstacle.height;
    });
  }
  
  // Render function
  function render(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.color || '#555';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Add border for better visibility
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw players
    if (state.players) {
      Object.entries(state.players).forEach(([id, player]) => {
        ctx.fillStyle = player.color || '#00ff00';
        ctx.beginPath();
        ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(player.x - 20, player.y - 30, 40, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(player.x - 20, player.y - 30, 40 * (player.health / 100), 5);
      });
    }
    
    // Draw bullets
    if (state.bullets) {
      ctx.fillStyle = '#ffff00';
      state.bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }
  
  return {
    onStateUpdate: (state) => {
      render(state);
    }
  };
}

// SERVER-SIDE CODE
const serverLogic = {
  initialState: {
    players: {},
    bullets: [],
    score: 0
  },
  moves: {
    playerJoined: (state, payload, playerId) => {
      // Spawn at one of the predefined spawn points
      const spawnPoints = MAP_2D_BASIC_SHOOTER.spawnPoints;
      const playerCount = Object.keys(state.players).length;
      const spawnPoint = spawnPoints[playerCount % spawnPoints.length];
      
      state.players[playerId] = {
        x: spawnPoint.x,
        y: spawnPoint.y,
        vx: 0,
        vy: 0,
        health: 100,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        input: { up: false, down: false, left: false, right: false }
      };
    },
    
    input: (state, payload, playerId) => {
      const player = state.players[playerId];
      if (!player) return;
      
      // Store input state for processing in tick
      player.input = payload;
    },
    
    shoot: (state, payload, playerId) => {
      const player = state.players[playerId];
      if (!player) return;
      
      const angle = Math.atan2(payload.targetY - player.y, payload.targetX - player.x);
      state.bullets.push({
        id: Date.now() + Math.random(),
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        playerId: playerId
      });
    },
    
    tick: (state) => {
      const obstacles = MAP_2D_BASIC_SHOOTER.obstacles;
      
      // Helper function to check collision
      function checkObstacleCollision(x, y, radius) {
        return obstacles.some(obstacle => {
          return x + radius > obstacle.x &&
                 x - radius < obstacle.x + obstacle.width &&
                 y + radius > obstacle.y &&
                 y - radius < obstacle.y + obstacle.height;
        });
      }
      
      // Update player physics with acceleration
      Object.values(state.players).forEach(player => {
        const acceleration = 0.5;
        const maxSpeed = 6;
        const friction = 0.85;
        const playerRadius = 15;
        
        // Apply acceleration based on input
        if (player.input.up) player.vy -= acceleration;
        if (player.input.down) player.vy += acceleration;
        if (player.input.left) player.vx -= acceleration;
        if (player.input.right) player.vx += acceleration;
        
        // Apply friction
        player.vx *= friction;
        player.vy *= friction;
        
        // Clamp velocity to max speed
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (speed > maxSpeed) {
          player.vx = (player.vx / speed) * maxSpeed;
          player.vy = (player.vy / speed) * maxSpeed;
        }
        
        // Try to update position, but check for collisions
        const newX = player.x + player.vx;
        const newY = player.y + player.vy;
        
        // Check X collision
        if (!checkObstacleCollision(newX, player.y, playerRadius)) {
          player.x = newX;
        } else {
          player.vx *= -0.5; // Bounce off
        }
        
        // Check Y collision
        if (!checkObstacleCollision(player.x, newY, playerRadius)) {
          player.y = newY;
        } else {
          player.vy *= -0.5; // Bounce off
        }
        
        // Clamp to bounds with bounce
        if (player.x < playerRadius) {
          player.x = playerRadius;
          player.vx *= -0.5;
        }
        if (player.x > MAP_2D_BASIC_SHOOTER.width - playerRadius) {
          player.x = MAP_2D_BASIC_SHOOTER.width - playerRadius;
          player.vx *= -0.5;
        }
        if (player.y < playerRadius) {
          player.y = playerRadius;
          player.vy *= -0.5;
        }
        if (player.y > MAP_2D_BASIC_SHOOTER.height - playerRadius) {
          player.y = MAP_2D_BASIC_SHOOTER.height - playerRadius;
          player.vy *= -0.5;
        }
      });
      
      // Update bullets continuously
      state.bullets = state.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remove bullets that hit obstacles
        if (checkObstacleCollision(bullet.x, bullet.y, 3)) {
          return false;
        }
        
        // Remove bullets that are out of bounds
        return bullet.x > 0 && 
               bullet.x < MAP_2D_BASIC_SHOOTER.width && 
               bullet.y > 0 && 
               bullet.y < MAP_2D_BASIC_SHOOTER.height;
      });
    }
  }
};
*/

// ============================================================
// EXAMPLE: 3D Shooter using MAP_3D_BASIC
// ============================================================

/*
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { MAP_3D_BASIC } from '@/lib/default-maps';

// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  scene.fog = new THREE.Fog(0x111111, 0, 100);
  
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // Create map geometry
  const mapMeshes = [];
  MAP_3D_BASIC.objects.forEach(obj => {
    const geometry = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
    const material = new THREE.MeshBasicMaterial({ 
      color: obj.color || '#555',
      wireframe: false 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
    mesh.userData.collidable = true;
    mesh.userData.type = obj.type;
    
    scene.add(mesh);
    mapMeshes.push(mesh);
  });
  
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(MAP_3D_BASIC.size.width, MAP_3D_BASIC.size.length);
  groundGeometry.rotateX(-Math.PI / 2);
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  scene.add(ground);
  
  // Spawn player at first spawn point
  const spawn = MAP_3D_BASIC.spawnPoints[0];
  camera.position.set(spawn.position[0], spawn.position[1], spawn.position[2]);
  camera.rotation.y = spawn.rotation;
  
  // Controls
  const controls = new PointerLockControls(camera, renderer.domElement);
  
  container.addEventListener('click', () => {
    controls.lock();
  });
  
  // Player movement
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const moveState = { forward: false, backward: false, left: false, right: false };
  
  document.addEventListener('keydown', (e) => {
    switch(e.code) {
      case 'KeyW': moveState.forward = true; break;
      case 'KeyS': moveState.backward = true; break;
      case 'KeyA': moveState.left = true; break;
      case 'KeyD': moveState.right = true; break;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    switch(e.code) {
      case 'KeyW': moveState.forward = false; break;
      case 'KeyS': moveState.backward = false; break;
      case 'KeyA': moveState.left = false; break;
      case 'KeyD': moveState.right = false; break;
    }
  });
  
  // Game loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Update player movement
    direction.z = Number(moveState.forward) - Number(moveState.backward);
    direction.x = Number(moveState.right) - Number(moveState.left);
    direction.normalize();
    
    if (moveState.forward || moveState.backward) velocity.z -= direction.z * 0.4;
    if (moveState.left || moveState.right) velocity.x -= direction.x * 0.4;
    
    controls.moveRight(-velocity.x);
    controls.moveForward(-velocity.z);
    
    velocity.x *= 0.9;
    velocity.z *= 0.9;
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  return {
    onStateUpdate: (state) => {
      // Update other players, bullets, etc.
    }
  };
}

// SERVER-SIDE CODE
const serverLogic = {
  initialState: {
    players: {},
    bullets: []
  },
  moves: {
    playerJoined: (state, payload, playerId) => {
      // Spawn at one of the predefined spawn points
      const spawnPoints = MAP_3D_BASIC.spawnPoints;
      const playerCount = Object.keys(state.players).length;
      const spawn = spawnPoints[playerCount % spawnPoints.length];
      
      state.players[playerId] = {
        position: [...spawn.position],
        rotation: spawn.rotation,
        health: 100
      };
    }
  }
};
*/


export type GameTemplate = "chess-variant" | "2d-shooter" | "3d-shooter" | "open-ended";

export interface GameTemplateConfig {
  id: GameTemplate;
  name: string;
  description: string;
  libraries: string[];
  baseCode: string;
  prompt: string;
}

export const GAME_TEMPLATES: Record<GameTemplate, GameTemplateConfig> = {
  "chess-variant": {
    id: "chess-variant",
    name: "Chess Variant",
    description: "Create custom chess variants with modified rules, pieces, or board layouts",
    libraries: ["chess.js", "chessboard.js"],
    baseCode: `// Chess Variant Template
// This code runs on both client and server

// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  // Create chess board container
  const boardContainer = document.createElement('div');
  boardContainer.id = 'chess-board';
  boardContainer.style.cssText = 'width: 400px; margin: 40px auto;';
  container.appendChild(boardContainer);
  
  // Simple board state
  let selectedSquare = null;
  let currentPosition = null;
  
  // Initialize board with chessboard.js-like rendering
  function createBoard() {
    const board = document.createElement('div');
    board.style.cssText = 'display: grid; grid-template-columns: repeat(8, 50px); gap: 0; border: 2px solid #333;';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        const squareName = String.fromCharCode(97 + col) + (8 - row);
        const isLight = (row + col) % 2 === 0;
        
        square.id = 'square-' + squareName;
        square.dataset.square = squareName;
        square.style.cssText = 
          'width: 50px; height: 50px; ' +
          'background: ' + (isLight ? '#f0d9b5' : '#b58863') + '; ' +
          'display: flex; align-items: center; justify-content: center; ' +
          'font-size: 32px; cursor: pointer; user-select: none;';
        
        square.addEventListener('click', () => handleSquareClick(squareName));
        board.appendChild(square);
      }
    }
    
    return board;
  }
  
  const board = createBoard();
  boardContainer.appendChild(board);
  
  // Piece unicode characters
  const pieceSymbols = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
  };
  
  // Convert FEN to position object
  function fenToPosition(fen) {
    const position = {};
    const rows = fen.split(' ')[0].split('/');
    
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      let colIdx = 0;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char >= '1' && char <= '8') {
          colIdx += parseInt(char);
        } else {
          const square = String.fromCharCode(97 + colIdx) + (8 - rowIdx);
          const color = char === char.toUpperCase() ? 'w' : 'b';
          const piece = char.toUpperCase();
          position[square] = color + piece;
          colIdx++;
        }
      }
    }
    
    return position;
  }
  
  // Render position on board
  function renderPosition(position) {
    // Clear all squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const squareName = String.fromCharCode(97 + col) + (8 - row);
        const square = document.getElementById('square-' + squareName);
        if (square) {
          square.textContent = '';
          const isLight = (row + col) % 2 === 0;
          square.style.background = isLight ? '#f0d9b5' : '#b58863';
        }
      }
    }
    
    // Place pieces
    Object.keys(position).forEach(square => {
      const piece = position[square];
      const squareEl = document.getElementById('square-' + square);
      if (squareEl && pieceSymbols[piece]) {
        squareEl.textContent = pieceSymbols[piece];
      }
    });
  }
  
  // Handle square clicks
  function handleSquareClick(square) {
    if (!selectedSquare) {
      // Select piece
      const piece = currentPosition[square];
      if (piece) {
        selectedSquare = square;
        const squareEl = document.getElementById('square-' + square);
        if (squareEl) {
          squareEl.style.background = '#baca44';
        }
      }
    } else {
      // Move piece
      if (selectedSquare !== square) {
        emitAction('move', { from: selectedSquare, to: square });
      }
      
      // Deselect
      const oldSquareEl = document.getElementById('square-' + selectedSquare);
      if (oldSquareEl) {
        const row = 8 - parseInt(selectedSquare[1]);
        const col = selectedSquare.charCodeAt(0) - 97;
        const isLight = (row + col) % 2 === 0;
        oldSquareEl.style.background = isLight ? '#f0d9b5' : '#b58863';
      }
      selectedSquare = null;
    }
  }
  
  return {
    onStateUpdate: (state) => {
      if (state.board) {
        currentPosition = fenToPosition(state.board);
        renderPosition(currentPosition);
      }
    }
  };
}

// SERVER-SIDE CODE
const serverLogic = {
  initialState: {
    board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    players: {},
    currentTurn: 'white',
    moves: []
  },
  moves: {
    move: (state, payload, playerId) => {
      // Simple move tracking (no validation for now)
      state.moves.push({
        from: payload.from,
        to: payload.to,
        player: playerId,
        timestamp: Date.now()
      });
      
      // Basic piece movement in FEN (simplified)
      // In a real implementation, use chess.js or similar
      const position = {};
      const rows = state.board.split(' ')[0].split('/');
      
      // Parse FEN to position
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        let colIdx = 0;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char >= '1' && char <= '8') {
            colIdx += parseInt(char);
          } else {
            const square = String.fromCharCode(97 + colIdx) + (8 - rowIdx);
            position[square] = char;
            colIdx++;
          }
        }
      }
      
      // Move piece
      if (position[payload.from]) {
        position[payload.to] = position[payload.from];
        delete position[payload.from];
      }
      
      // Convert back to FEN
      let newFen = '';
      for (let row = 0; row < 8; row++) {
        let emptyCount = 0;
        for (let col = 0; col < 8; col++) {
          const square = String.fromCharCode(97 + col) + (8 - row);
          if (position[square]) {
            if (emptyCount > 0) {
              newFen += emptyCount;
              emptyCount = 0;
            }
            newFen += position[square];
          } else {
            emptyCount++;
          }
        }
        if (emptyCount > 0) {
          newFen += emptyCount;
        }
        if (row < 7) {
          newFen += '/';
        }
      }
      
      state.board = newFen + ' w KQkq - 0 1';
      state.currentTurn = state.currentTurn === 'white' ? 'black' : 'white';
    }
  }
};`,
    prompt: `You are creating a chess variant. Generate game code following this EXACT structure:

REQUIRED STRUCTURE:
1. Define initGameClient(container, socket, roomId, emitAction) function
2. Return object with onStateUpdate(state) method
3. Define const serverLogic with initialState and moves

The code must follow this template:

\`\`\`javascript
// CLIENT-SIDE
function initGameClient(container, socket, roomId, emitAction) {
  // Create chess board UI
  // Set up click handlers
  // Return { onStateUpdate: (state) => { /* update UI */ } }
}

// SERVER-SIDE
const serverLogic = {
  initialState: {
    board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    players: {},
    currentTurn: 'white'
  },
  moves: {
    move: (state, payload, playerId) => {
      // Validate and execute move
      // Mutate state directly
    }
  }
};
\`\`\`

Key requirements:
- Use FEN notation for board state
- Implement move validation
- Handle turn switching
- Support custom rules as described

User's chess variant description:`
  },
  
  "2d-shooter": {
    id: "2d-shooter",
    name: "2D Shooter",
    description: "Build top-down or side-scrolling shooters with physics and multiplayer",
    libraries: ["phaser"],
    baseCode: `// 2D Shooter Template
// Uses basic canvas for rendering

// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.cssText = 'display: block; margin: 40px auto; background: #1a1a2e; border: 2px solid #16213e;';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  // Player controls
  const keys = {};
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    handleInput();
  });
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  
  function handleInput() {
    const movement = { x: 0, y: 0 };
    if (keys['KeyW'] || keys['ArrowUp']) movement.y = -5;
    if (keys['KeyS'] || keys['ArrowDown']) movement.y = 5;
    if (keys['KeyA'] || keys['ArrowLeft']) movement.x = -5;
    if (keys['KeyD'] || keys['ArrowRight']) movement.x = 5;
    
    if (movement.x !== 0 || movement.y !== 0) {
      emitAction('move', movement);
    }
  }
  
  // Shooting
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    emitAction('shoot', { targetX: x, targetY: y });
  });
  
  // Render function
  function render(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    move: (state, payload, playerId) => {
      if (!state.players[playerId]) {
        state.players[playerId] = {
          x: 400,
          y: 300,
          health: 100,
          color: '#' + Math.floor(Math.random()*16777215).toString(16)
        };
      }
      
      const player = state.players[playerId];
      player.x = Math.max(15, Math.min(785, player.x + payload.x));
      player.y = Math.max(15, Math.min(585, player.y + payload.y));
    },
    
    shoot: (state, payload, playerId) => {
      const player = state.players[playerId];
      if (!player) return;
      
      const angle = Math.atan2(payload.targetY - player.y, payload.targetX - player.x);
      state.bullets.push({
        id: Date.now() + Math.random(),
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        playerId: playerId
      });
      
      // Update bullets (simple physics)
      state.bullets = state.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        return bullet.x > 0 && bullet.x < 800 && bullet.y > 0 && bullet.y < 600;
      });
    }
  }
};`,
    prompt: `You are creating a 2D shooter game. The base template includes Phaser 3 for game engine, physics, and rendering.

Key considerations:
- Define game mechanics (top-down, side-scroller, bullet hell, etc.)
- Implement shooting mechanics and projectile behavior
- Add enemy AI and spawn patterns
- Handle collision detection between bullets, players, and enemies
- Implement scoring and health systems
- Consider power-ups and special abilities

Available Phaser features:
- Physics: arcade physics with velocity, acceleration, collision
- Input: keyboard, mouse, touch support
- Sprites: animated sprites, sprite sheets
- Groups: object pooling for bullets/enemies
- Timers: for spawn rates, cooldowns

Describe your 2D shooter and I'll implement it.`
  },
  
  "3d-shooter": {
    id: "3d-shooter",
    name: "3D Shooter",
    description: "Create first-person or third-person 3D shooters with Three.js",
    libraries: ["three.js"],
    baseCode: `// 3D Shooter Template
// Uses Three.js for 3D rendering with optimizations

import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

export function initGame(container) {
  // Scene setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 0, 750);
  
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 10;
  
  const renderer = new THREE.WebGLRenderer({ antialias: false }); // Disable for performance
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
  container.appendChild(renderer.domElement);
  
  // Controls
  const controls = new PointerLockControls(camera, renderer.domElement);
  
  container.addEventListener('click', () => {
    controls.lock();
  });
  
  // Basic ground
  const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
  groundGeometry.rotateX(-Math.PI / 2);
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  scene.add(ground);
  
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
  
  // Shooting
  const raycaster = new THREE.Raycaster();
  const bullets = [];
  
  document.addEventListener('click', () => {
    if (controls.isLocked) {
      shoot();
    }
  });
  
  function shoot() {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    bullet.position.copy(camera.position);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.velocity = direction.multiplyScalar(2);
    
    scene.add(bullet);
    bullets.push(bullet);
    
    // Emit to server
    socket.emit('game_action', {
      roomId: currentRoom,
      action: 'shoot',
      payload: { 
        position: camera.position.toArray(),
        direction: direction.toArray()
      }
    });
  }
  
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
    
    // Update bullets
    bullets.forEach((bullet, i) => {
      bullet.position.add(bullet.velocity);
      if (bullet.position.length() > 500) {
        scene.remove(bullet);
        bullets.splice(i, 1);
      }
    });
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  return { scene, camera, renderer, controls };
}

// Server-side game state
export const serverLogic = {
  initialState: {
    players: {},
    bullets: [],
    enemies: []
  },
  moves: {
    move: (state, payload, playerId) => {
      if (!state.players[playerId]) {
        state.players[playerId] = { 
          position: [0, 10, 0],
          rotation: [0, 0, 0],
          health: 100 
        };
      }
      state.players[playerId].position = payload.position;
      state.players[playerId].rotation = payload.rotation;
    },
    shoot: (state, payload, playerId) => {
      state.bullets.push({
        id: Date.now(),
        playerId,
        position: payload.position,
        direction: payload.direction,
        timestamp: Date.now()
      });
    }
  }
};`,
    prompt: `You are creating a 3D shooter game. The base template includes Three.js with optimizations for performance.

Key considerations:
- Define perspective (first-person or third-person)
- Implement 3D movement and camera controls
- Add 3D models or use primitive geometries
- Implement raycasting for shooting and hit detection
- Optimize rendering (use instancing for many objects, frustum culling)
- Add lighting and shadows carefully (performance impact)
- Consider level design and collision detection

Performance optimizations included:
- Pixel ratio capped at 2
- Antialiasing disabled by default
- Fog for draw distance
- Use MeshBasicMaterial for better performance

Available Three.js features:
- Geometries: BoxGeometry, SphereGeometry, etc.
- Materials: MeshBasicMaterial (fast), MeshLambertMaterial, MeshPhongMaterial
- Lights: AmbientLight, DirectionalLight, PointLight
- Raycaster: for shooting and collision detection
- PointerLockControls: for FPS controls

Describe your 3D shooter and I'll implement it.`
  },
  
  "open-ended": {
    id: "open-ended",
    name: "Open Ended",
    description: "Create any type of game with full flexibility (may require more iteration)",
    libraries: [],
    baseCode: `// Open-Ended Game Template
// Minimal template - you have full control

// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.cssText = 'display: block; margin: 20px auto; background: #222; border: 1px solid #444;';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  // Game state
  const localState = {
    // Your local game state
  };
  
  // Input handling
  const keys = {};
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Handle input
  });
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  
  // Render function
  function render(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw your game here
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Your Game Here', canvas.width / 2, canvas.height / 2);
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
    // Define your initial game state
    players: {},
    gameData: {}
  },
  moves: {
    // Define your game actions
    action: (state, payload, playerId) => {
      // Implement game logic
      // Mutate state directly
    }
  }
};`,
    prompt: `You are creating a custom game with full flexibility. This is an open-ended template with minimal structure.

Key considerations:
- Define your game genre and mechanics clearly
- Choose appropriate libraries (you can import any npm package)
- Implement both client-side rendering and server-side game logic
- Handle multiplayer synchronization carefully
- Consider performance and network efficiency

Common libraries you might want to use:
- Canvas API: for 2D rendering
- Phaser: for 2D games
- Three.js: for 3D games
- Matter.js or Box2D: for physics
- Howler.js: for audio

Note: Open-ended games may require more iteration and debugging than template-based games.

Describe your game concept in detail and I'll implement it.`
  }
};


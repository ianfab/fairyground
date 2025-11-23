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
// Uses chessboard.js for drag-and-drop UI and chess.js for move validation

// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  // Load required libraries
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
  
  const loadCSS = (href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };
  
  // Load chessboard.js CSS
  loadCSS('https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css');
  
  const boardContainer = document.createElement('div');
  boardContainer.id = 'chess-board';
  boardContainer.style.cssText = 'width: 400px; margin: 40px auto;';
  container.appendChild(boardContainer);
  
  const statusDiv = document.createElement('div');
  statusDiv.id = 'chess-status';
  statusDiv.style.cssText = 'text-align: center; margin-top: 20px; font-size: 18px; color: #fff;';
  container.appendChild(statusDiv);
  
  const waitingDiv = document.createElement('div');
  waitingDiv.id = 'waiting-message';
  waitingDiv.style.cssText = 'text-align: center; margin-top: 20px; font-size: 16px; color: #888;';
  waitingDiv.textContent = 'Loading chess libraries...';
  container.appendChild(waitingDiv);
  
  let board = null;
  let game = null;
  let myColor = null;
  let librariesLoaded = false;
  
  // Function to load libraries with retry
  function loadLibraries() {
    waitingDiv.innerHTML = 'Loading chess libraries...';
    
    return Promise.all([
      loadScript('https://code.jquery.com/jquery-3.7.1.min.js'),
      loadScript('https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js')
    ]).then(() => {
      librariesLoaded = true;
      waitingDiv.textContent = 'Waiting for opponent...';
      
      // Initialize chess.js
      game = new Chess();
    
    function onDragStart(source, piece, position, orientation) {
      // Do not pick up pieces if the game is over
      if (game.game_over()) return false;
      
      // Only allow moves if player has a color assigned
      if (!myColor || myColor === 'spectator') return false;
      
      // Only pick up pieces for the side to move
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
      
      // Only allow player to move their own pieces
      if ((myColor === 'white' && piece.search(/^b/) !== -1) ||
          (myColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;
      }
    }
    
    function onDrop(source, target) {
      // See if the move is legal
      const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      // Illegal move
      if (move === null) return 'snapback';
      
      // Send move to server
      emitAction('move', { from: source, to: target, promotion: 'q' });
    }
    
    function onSnapEnd() {
      // Update board position after piece snap
      // This handles castling, en passant, pawn promotion
      board.position(game.fen());
    }
    
    function updateStatus(playerColors) {
      let status = '';
      const moveColor = game.turn() === 'w' ? 'White' : 'Black';
      const myPlayerColor = playerColors ? playerColors[socket.id] : null;
      
      // Checkmate?
      if (game.in_checkmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        status = 'Game over, ' + winner + ' wins by checkmate!';
      }
      // Draw?
      else if (game.in_draw()) {
        status = 'Game over, drawn position';
      }
      // Stalemate?
      else if (game.in_stalemate()) {
        status = 'Game over, stalemate';
      }
      // Threefold repetition?
      else if (game.in_threefold_repetition()) {
        status = 'Game over, draw by threefold repetition';
      }
      // Insufficient material?
      else if (game.insufficient_material()) {
        status = 'Game over, draw by insufficient material';
      }
      // Game still on
      else {
        status = moveColor + ' to move';
        
        if (myPlayerColor === 'spectator') {
          status += ' (You are spectating)';
        } else if (myPlayerColor) {
          status += ' (You are ' + myPlayerColor + ')';
        }
        
        // Check?
        if (game.in_check()) {
          status += ' - ' + moveColor + ' is in check!';
        }
      }
      
      statusDiv.textContent = status;
    }
    
    const config = {
      draggable: true,
      position: 'start',
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    
    board = Chessboard('chess-board', config);
    updateStatus({});
    
    // Handle state updates - now that libraries are loaded
    return (state) => {
      console.log('Chess onStateUpdate called with:', state);
      
      if (!state || !state.board) {
        console.error('Invalid state received:', state);
        return;
      }
      
      try {
        // Load position into chess.js
        game.load(state.board);
        
        // Update board display
        board.position(state.board);
        
        const playerCount = state.playerColors ? Object.keys(state.playerColors).length : 0;
        
        if (playerCount < 2) {
          waitingDiv.style.display = 'block';
          waitingDiv.textContent = 'Waiting for opponent...';
        } else {
          waitingDiv.style.display = 'none';
        }
        
        if (state.playerColors && state.playerColors[socket.id]) {
          const newColor = state.playerColors[socket.id];
          
          if (newColor === 'spectator') {
            myColor = 'spectator';
          } else if (!myColor || myColor !== newColor) {
            myColor = newColor;
            
            // Flip board for black player
            const orientation = myColor === 'black' ? 'black' : 'white';
            board.orientation(orientation);
          }
        }
        
        updateStatus(state.playerColors);
      } catch (e) {
        console.error('Error updating state:', e, e.stack);
      }
    };
    }).catch(err => {
      console.error('Failed to load chess libraries:', err);
      waitingDiv.innerHTML = \`
        <div style="color: #f44;">Error loading chess libraries.</div>
        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Refresh Page
        </button>
      \`;
      return null;
    });
  }
  
  // Create game instance with async initialization
  const gameInstance = {
    _ready: false,
    _pendingStates: [],
    onStateUpdate: function(state) {
      if (!this._ready) {
        console.log('Game not ready yet, queuing state');
        this._pendingStates.push(state);
      }
      // Once ready, this function will be replaced
    }
  };
  
  // Load libraries and initialize
  loadLibraries().then(stateUpdateFn => {
    if (stateUpdateFn) {
      gameInstance._ready = true;
      gameInstance.onStateUpdate = stateUpdateFn;
      
      // Apply any pending states that came in while loading
      if (gameInstance._pendingStates && gameInstance._pendingStates.length > 0) {
        console.log('Applying', gameInstance._pendingStates.length, 'pending states');
        const lastState = gameInstance._pendingStates[gameInstance._pendingStates.length - 1];
        gameInstance.onStateUpdate(lastState);
        gameInstance._pendingStates = [];
      }
    }
  });
  
  console.log('Chess game instance created');
  return gameInstance;
}

// SERVER-SIDE CODE
// Note: Chess class is provided by the server sandbox context
const serverLogic = {
  initialState: {
    board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    players: {},
    playerColors: {},
    moveHistory: []
  },
  moves: {
    playerJoined: (state, payload, playerId) => {
      // Don't reassign colors if player already has one (reconnection)
      if (state.playerColors[playerId]) {
        console.log('Player', playerId, 'rejoining with existing color:', state.playerColors[playerId]);
        return;
      }
      
      const existingPlayerCount = Object.keys(state.playerColors).length;
      
      if (existingPlayerCount === 0) {
        state.playerColors[playerId] = Math.random() < 0.5 ? 'white' : 'black';
      } else if (existingPlayerCount === 1) {
        const firstPlayerColor = Object.values(state.playerColors)[0];
        state.playerColors[playerId] = firstPlayerColor === 'white' ? 'black' : 'white';
      } else {
        state.playerColors[playerId] = 'spectator';
      }
      
      console.log('Player', playerId, 'assigned color:', state.playerColors[playerId]);
    },
    
    move: (state, payload, playerId) => {
      const playerColor = state.playerColors[playerId];
      
      if (playerColor === 'spectator') {
        console.log('Spectator attempted to move');
        return;
      }
      
      // Initialize chess.js with current board state
      const game = new Chess(state.board);
      
      // Check if it's the player's turn
      const currentTurn = game.turn(); // 'w' or 'b'
      const turnColor = currentTurn === 'w' ? 'white' : 'black';
      
      if (playerColor !== turnColor) {
        console.log('Not player turn:', playerColor, 'vs', turnColor);
        return;
      }
      
      // Attempt the move
      try {
        const move = game.move({
          from: payload.from,
          to: payload.to,
          promotion: payload.promotion || 'q'
        });
        
        if (move === null) {
          console.log('Illegal move attempted:', payload);
          return;
        }
        
        console.log('Legal move executed:', move);
        
        // Update state with new FEN
        state.board = game.fen();
        
        // Add to move history
        state.moveHistory.push({
          from: payload.from,
          to: payload.to,
          promotion: payload.promotion,
          san: move.san,
          player: playerId,
          timestamp: Date.now()
        });
        
        console.log('New board state:', state.board);
        console.log('Game over:', game.game_over());
        console.log('In check:', game.in_check());
        console.log('In checkmate:', game.in_checkmate());
        console.log('In draw:', game.in_draw());
        
      } catch (e) {
        console.error('Error executing move:', e);
      }
    }
  }
};`,
    prompt: `You are creating a chess variant using chessboard.js and chess.js.

LIBRARIES AVAILABLE:
- chessboard.js: Drag-and-drop chess board UI (https://chessboardjs.com/)
- chess.js: Full chess move validation and game logic (https://github.com/jhlywa/chess.js)

STRUCTURE:
The template already includes:
✅ Drag-and-drop board with piece images
✅ Complete legal move validation
✅ Turn management and color assignment
✅ Game end detection (checkmate, stalemate, draw)
✅ Spectator support
✅ Board orientation (flipped for black player)

TO CUSTOMIZE YOUR VARIANT:
1. Modify the initial FEN string in initialState.board
2. Customize move validation in the server's move handler
3. Add special rules or win conditions
4. Modify the onDragStart function for custom piece movement rules
5. add any other ui or customizations you want

EXAMPLE CUSTOMIZATIONS:
- Chess960: Randomize starting position FEN
- Three-check: Track checks in state, win after 3 checks
- Atomic: Add explosion logic when pieces are captured
- Fog of War: Filter visible pieces in onStateUpdate based on player position

The Chess class (from chess.js) provides methods like:
- game.move({ from, to, promotion }) - Make a move
- game.in_check() - Check if current player is in check
- game.in_checkmate() - Check if current player is checkmated
- game.game_over() - Check if game is over
- game.fen() - Get current position as FEN string
- game.load(fen) - Load a position from FEN
- game.turn() - Get current turn ('w' or 'b')

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


// Premade Games for Easy Testing
// These games are hardcoded in the server and always available

export const PREMADE_GAMES = {
  "clicker": {
    name: "clicker",
    description: "Simple clicker game - click to increase score",
    code: `
// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  container.innerHTML = \`
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <h1 style="font-size: 48px; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎮 Click Battle</h1>
      <div id="score" style="font-size: 96px; font-weight: bold; color: #fff; text-shadow: 3px 3px 6px rgba(0,0,0,0.4);">0</div>
      <button id="click-btn" style="padding: 30px 60px; font-size: 28px; cursor: pointer; border-radius: 50px; border: none; background: #fff; color: #667eea; font-weight: bold; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: transform 0.1s;">
        CLICK ME!
      </button>
      <div id="players" style="color: rgba(255,255,255,0.8); margin-top: 20px; font-size: 16px; text-align: center; min-height: 60px;"></div>
    </div>
  \`;
  
  const scoreEl = document.getElementById('score');
  const clickBtn = document.getElementById('click-btn');
  const playersEl = document.getElementById('players');
  
  clickBtn.addEventListener('click', () => {
    emitAction('click', { timestamp: Date.now() });
    scoreEl.style.transform = 'scale(1.2)';
    setTimeout(() => { scoreEl.style.transform = 'scale(1)'; }, 100);
  });
  
  return {
    onStateUpdate: (state) => {
      scoreEl.textContent = state.score || 0;
      scoreEl.style.transition = 'transform 0.1s';
      
      if (state.players && Object.keys(state.players).length > 0) {
        const sortedPlayers = Object.entries(state.players)
          .sort((a, b) => (b[1].clicks || 0) - (a[1].clicks || 0));
        
        const playerList = sortedPlayers
          .map(([id, data], index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
            return medal + ' Player ' + id.substring(0, 6) + ': ' + (data.clicks || 0) + ' clicks';
          })
          .join('<br>');
        playersEl.innerHTML = playerList;
      }
    }
  };
}

const serverLogic = {
  initialState: {
    score: 0,
    players: {}
  },
  moves: {
    click: (state, payload, playerId) => {
      if (!state.players[playerId]) {
        state.players[playerId] = { clicks: 0 };
      }
      state.score += 1;
      state.players[playerId].clicks += 1;
    }
  }
};
`
  },
  
  "pong": {
    name: "pong",
    description: "Classic Pong game - use W/S keys",
    code: `
function initGameClient(container, socket, roomId, emitAction) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.cssText = 'display: block; margin: 20px auto; background: #000; border: 2px solid #fff;';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'text-align: center; margin-top: 20px; font-size: 18px; color: #fff;';
  container.appendChild(statusDiv);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') emitAction('move', { direction: 'up' });
    if (e.code === 'KeyS') emitAction('move', { direction: 'down' });
  });

  function render(state) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#444';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(20, state.paddle1Y || 250, 10, 100);
    ctx.fillRect(770, state.paddle2Y || 250, 10, 100);

    // Draw ball
    ctx.fillRect(state.ballX || 400, state.ballY || 300, 10, 10);

    // Draw scores
    ctx.font = '48px Arial';
    ctx.fillText((state.score1 || 0) + ' - ' + (state.score2 || 0), 350, 50);

    // Update status
    const playerCount = state.playerAssignments ? Object.keys(state.playerAssignments).length : 0;
    const myPaddle = state.playerAssignments ? state.playerAssignments[socket.id] : null;

    if (playerCount < 2) {
      statusDiv.textContent = 'Waiting for opponent... (' + playerCount + '/2 players)';
    } else if (myPaddle) {
      statusDiv.textContent = 'You are Player ' + myPaddle + ' (left side: ' + (myPaddle === 1 ? 'YOU' : 'opponent') + ', right side: ' + (myPaddle === 2 ? 'YOU' : 'opponent') + ')';
    } else {
      statusDiv.textContent = 'You are spectating';
    }
  }

  return {
    onStateUpdate: (state) => render(state)
  };
}

const serverLogic = {
  initialState: {
    paddle1Y: 250,
    paddle2Y: 250,
    ballX: 400,
    ballY: 300,
    ballVX: 5,
    ballVY: 5,
    score1: 0,
    score2: 0,
    playerAssignments: {},
    lastUpdateTime: Date.now()
  },
  moves: {
    playerJoined: (state, payload, playerId) => {
      // Assign players to paddles
      if (!state.playerAssignments[playerId]) {
        const assignedPlayers = Object.keys(state.playerAssignments).length;
        if (assignedPlayers === 0) {
          state.playerAssignments[playerId] = 1; // First player gets left paddle
        } else if (assignedPlayers === 1) {
          state.playerAssignments[playerId] = 2; // Second player gets right paddle
        }
        // Additional players become spectators (no assignment)
      }
    },

    move: (state, payload, playerId) => {
      const playerPaddle = state.playerAssignments[playerId];
      if (!playerPaddle) return; // Spectator or unassigned

      const paddle = playerPaddle === 1 ? 'paddle1Y' : 'paddle2Y';

      if (payload.direction === 'up') {
        state[paddle] = Math.max(0, state[paddle] - 25);
      } else if (payload.direction === 'down') {
        state[paddle] = Math.min(500, state[paddle] + 25);
      }
    },

    tick: (state) => {
      // Game loop - called periodically to update ball physics
      const now = Date.now();
      const deltaTime = (now - state.lastUpdateTime) / 16.67; // Normalize to 60fps
      state.lastUpdateTime = now;

      // Update ball position
      state.ballX += state.ballVX * deltaTime;
      state.ballY += state.ballVY * deltaTime;

      // Ball collision with top/bottom walls
      if (state.ballY <= 0 || state.ballY >= 590) {
        state.ballVY *= -1;
        state.ballY = Math.max(0, Math.min(590, state.ballY));
      }

      // Ball collision with left paddle
      if (state.ballX <= 30 && state.ballX >= 20) {
        if (state.ballY >= state.paddle1Y && state.ballY <= state.paddle1Y + 100) {
          state.ballVX = Math.abs(state.ballVX); // Bounce right
          // Add spin based on where ball hits paddle
          const hitPos = (state.ballY - state.paddle1Y) / 100; // 0 to 1
          state.ballVY = (hitPos - 0.5) * 10;
        }
      }

      // Ball collision with right paddle
      if (state.ballX >= 760 && state.ballX <= 770) {
        if (state.ballY >= state.paddle2Y && state.ballY <= state.paddle2Y + 100) {
          state.ballVX = -Math.abs(state.ballVX); // Bounce left
          // Add spin based on where ball hits paddle
          const hitPos = (state.ballY - state.paddle2Y) / 100; // 0 to 1
          state.ballVY = (hitPos - 0.5) * 10;
        }
      }

      // Ball goes out of bounds - scoring
      if (state.ballX < 0) {
        // Player 2 scores
        state.score2 += 1;
        state.ballX = 400;
        state.ballY = 300;
        state.ballVX = -5; // Serve towards player 1
        state.ballVY = (Math.random() - 0.5) * 6;
      } else if (state.ballX > 800) {
        // Player 1 scores
        state.score1 += 1;
        state.ballX = 400;
        state.ballY = 300;
        state.ballVX = 5; // Serve towards player 2
        state.ballVY = (Math.random() - 0.5) * 6;
      }

      // Cap ball velocity to prevent it from going too fast
      const maxSpeed = 12;
      if (Math.abs(state.ballVX) > maxSpeed) {
        state.ballVX = Math.sign(state.ballVX) * maxSpeed;
      }
      if (Math.abs(state.ballVY) > maxSpeed) {
        state.ballVY = Math.sign(state.ballVY) * maxSpeed;
      }
    }
  }
};
`
  },

  "tetris": {
    name: "tetris",
    description: "Classic Tetris - use arrow keys to play",
    code: `
function initGameClient(container, socket, roomId, emitAction) {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 600;
  canvas.style.cssText = 'display: block; margin: 20px auto; background: #000; border: 2px solid #fff;';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const BLOCK_SIZE = 30;

  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'text-align: center; margin-top: 20px; font-size: 18px; color: #fff;';
  container.appendChild(statusDiv);

  const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
  };

  let keysPressed = {};

  document.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (!keysPressed[e.code]) {
      keysPressed[e.code] = true;

      if (e.code === 'ArrowLeft') emitAction('move', { direction: 'left' });
      if (e.code === 'ArrowRight') emitAction('move', { direction: 'right' });
      if (e.code === 'ArrowDown') emitAction('move', { direction: 'down' });
      if (e.code === 'ArrowUp') emitAction('rotate', {});
      if (e.code === 'Space') emitAction('hardDrop', {});
    }
  });

  document.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
  });

  function render(state) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#222';
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 20; y++) {
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }

    // Draw placed blocks
    if (state.grid) {
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          if (state.grid[y][x]) {
            ctx.fillStyle = COLORS[state.grid[y][x]] || '#888';
            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          }
        }
      }
    }

    // Draw current piece
    if (state.currentPiece && state.currentPiece.shape) {
      ctx.fillStyle = COLORS[state.currentPiece.type] || '#fff';
      const piece = state.currentPiece;
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            ctx.fillRect(
              (piece.x + x) * BLOCK_SIZE,
              (piece.y + y) * BLOCK_SIZE,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
            ctx.strokeStyle = '#000';
            ctx.strokeRect(
              (piece.x + x) * BLOCK_SIZE,
              (piece.y + y) * BLOCK_SIZE,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
          }
        }
      }
    }

    // Update status
    const isPlayer = state.playerId === socket.id;
    if (state.gameOver) {
      statusDiv.innerHTML = '<span style="color: #f00;">GAME OVER</span><br>Score: ' + (state.score || 0) + '<br>Lines: ' + (state.lines || 0);
    } else if (isPlayer) {
      statusDiv.innerHTML = 'Score: ' + (state.score || 0) + '<br>Lines: ' + (state.lines || 0) + '<br><span style="color: #0f0;">You are playing</span>';
    } else {
      statusDiv.innerHTML = 'Score: ' + (state.score || 0) + '<br>Lines: ' + (state.lines || 0) + '<br><span style="color: #888;">Spectating</span>';
    }
  }

  return {
    onStateUpdate: (state) => render(state)
  };
}

const serverLogic = {
  initialState: {
    grid: Array(20).fill(null).map(() => Array(10).fill(null)),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    playerId: null,
    dropCounter: 0,
    dropInterval: 1000,
    lastDropTime: Date.now()
  },
  moves: {
    playerJoined: (state, payload, playerId) => {
      // First player becomes the active player
      if (!state.playerId) {
        state.playerId = playerId;

        // Spawn first piece
        if (!state.currentPiece) {
          state.currentPiece = spawnPiece(state);
          state.nextPiece = getRandomPiece();
        }
      }
    },

    move: (state, payload, playerId) => {
      if (state.gameOver || state.playerId !== playerId) return;

      const piece = state.currentPiece;
      if (!piece) return;

      if (payload.direction === 'left') {
        piece.x--;
        if (checkCollision(state, piece)) piece.x++;
      } else if (payload.direction === 'right') {
        piece.x++;
        if (checkCollision(state, piece)) piece.x--;
      } else if (payload.direction === 'down') {
        piece.y++;
        if (checkCollision(state, piece)) {
          piece.y--;
          lockPiece(state);
        }
      }
    },

    rotate: (state, payload, playerId) => {
      if (state.gameOver || state.playerId !== playerId) return;

      const piece = state.currentPiece;
      if (!piece) return;

      // Store original
      const originalShape = piece.shape;

      // Rotate 90 degrees clockwise
      piece.shape = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
      );

      // Check if rotation is valid
      if (checkCollision(state, piece)) {
        // Try wall kicks
        const kicks = [
          { x: -1, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: -1 }
        ];

        let kicked = false;
        for (const kick of kicks) {
          piece.x += kick.x;
          piece.y += kick.y;
          if (!checkCollision(state, piece)) {
            kicked = true;
            break;
          }
          piece.x -= kick.x;
          piece.y -= kick.y;
        }

        if (!kicked) {
          piece.shape = originalShape;
        }
      }
    },

    hardDrop: (state, payload, playerId) => {
      if (state.gameOver || state.playerId !== playerId) return;

      const piece = state.currentPiece;
      if (!piece) return;

      while (!checkCollision(state, piece)) {
        piece.y++;
      }
      piece.y--;
      lockPiece(state);
    },

    tick: (state) => {
      if (state.gameOver || !state.playerId || !state.currentPiece) return;

      const now = Date.now();
      const deltaTime = now - state.lastDropTime;

      if (deltaTime > state.dropInterval) {
        state.lastDropTime = now;

        const piece = state.currentPiece;
        piece.y++;

        if (checkCollision(state, piece)) {
          piece.y--;
          lockPiece(state);
        }
      }
    }
  }
};

// Tetris pieces
const PIECES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

function getRandomPiece() {
  const types = Object.keys(PIECES);
  const type = types[Math.floor(Math.random() * types.length)];
  return { type, shape: PIECES[type] };
}

function spawnPiece(state) {
  const piece = state.nextPiece || getRandomPiece();
  state.nextPiece = getRandomPiece();

  return {
    ...piece,
    x: Math.floor(10 / 2) - Math.floor(piece.shape[0].length / 2),
    y: 0
  };
}

function checkCollision(state, piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x;
        const newY = piece.y + y;

        // Check bounds
        if (newX < 0 || newX >= 10 || newY >= 20) {
          return true;
        }

        // Check collision with placed blocks
        if (newY >= 0 && state.grid[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

function lockPiece(state) {
  const piece = state.currentPiece;

  // Place piece on grid
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const gridY = piece.y + y;
        const gridX = piece.x + x;
        if (gridY >= 0 && gridY < 20 && gridX >= 0 && gridX < 10) {
          state.grid[gridY][gridX] = piece.type;
        }
      }
    }
  }

  // Check for completed lines
  let linesCleared = 0;
  for (let y = 19; y >= 0; y--) {
    if (state.grid[y].every(cell => cell !== null)) {
      state.grid.splice(y, 1);
      state.grid.unshift(Array(10).fill(null));
      linesCleared++;
      y++; // Check same row again
    }
  }

  if (linesCleared > 0) {
    state.lines += linesCleared;
    state.score += [0, 100, 300, 500, 800][linesCleared] * state.level;
    state.level = Math.floor(state.lines / 10) + 1;
    state.dropInterval = Math.max(100, 1000 - (state.level - 1) * 100);
  }

  // Spawn next piece
  state.currentPiece = spawnPiece(state);

  // Check game over
  if (checkCollision(state, state.currentPiece)) {
    state.gameOver = true;
  }
}
`
  },

  "chess": {
    name: "chess",
    description: "Classic Chess - drag pieces to move",
    code: `
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
  
  // Initialize libraries and board once loaded
  Promise.all([
    loadScript('https://code.jquery.com/jquery-3.7.1.min.js'),
    loadScript('https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js')
  ]).then(() => {
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
    
    // Handle state updates
    gameInstance.onStateUpdate = (state) => {
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
    waitingDiv.textContent = 'Error loading game. Please refresh.';
  });
  
  // Create game instance (will be populated once libraries load)
  const gameInstance = {
    onStateUpdate: (state) => {
      // This will be replaced once libraries are loaded
      console.log('Waiting for libraries to load...');
    }
  };
  
  console.log('Chess game instance created');
  return gameInstance;
}

// Server-side logic using chess.js for validation
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
}
`
  }
};


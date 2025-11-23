export default {
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
};

export default {
    name: "tetris-battle",
    description: "Competitive Tetris - clear lines to attack your opponent!",
    code: `
function initGameClient(container, socket, roomId, emitAction) {
  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;
  const BLOCK_SIZE = 25;

  // Tetromino shapes
  const SHAPES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]]
  };

  const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
  };

  container.innerHTML = \`
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); gap: 40px; padding: 20px;">
      <div style="text-align: center;">
        <h2 style="color: #fff; margin-bottom: 10px;">Player 1</h2>
        <canvas id="canvas1" width="\${BOARD_WIDTH * BLOCK_SIZE}" height="\${BOARD_HEIGHT * BLOCK_SIZE}" style="border: 3px solid #fff; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></canvas>
        <div id="score1" style="color: #fff; font-size: 24px; margin-top: 10px; font-weight: bold;">Score: 0</div>
      </div>
      <div style="color: #fff; font-size: 18px; max-width: 200px; text-align: center;">
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px;">
          <div style="margin-bottom: 10px;">⬅️➡️ Move</div>
          <div style="margin-bottom: 10px;">⬆️ Rotate</div>
          <div style="margin-bottom: 10px;">⬇️ Soft Drop</div>
          <div style="margin-bottom: 10px;">Space: Hard Drop</div>
          <div style="margin-top: 20px; font-size: 14px; opacity: 0.8;">Clear lines to send garbage to opponent!</div>
        </div>
      </div>
      <div style="text-align: center;">
        <h2 style="color: #fff; margin-bottom: 10px;">Player 2</h2>
        <canvas id="canvas2" width="\${BOARD_WIDTH * BLOCK_SIZE}" height="\${BOARD_HEIGHT * BLOCK_SIZE}" style="border: 3px solid #fff; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></canvas>
        <div id="score2" style="color: #fff; font-size: 24px; margin-top: 10px; font-weight: bold;">Score: 0</div>
      </div>
    </div>
  \`;

  const canvas1 = document.getElementById('canvas1');
  const ctx1 = canvas1.getContext('2d');
  const canvas2 = document.getElementById('canvas2');
  const ctx2 = canvas2.getContext('2d');
  const score1El = document.getElementById('score1');
  const score2El = document.getElementById('score2');

  let myPlayerId = socket.id;

  // Input handling
  const pressedKeys = new Set();

  document.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (pressedKeys.has(e.code)) return;
    pressedKeys.add(e.code);

    if (e.code === 'ArrowLeft') emitAction('move', { direction: 'left' });
    if (e.code === 'ArrowRight') emitAction('move', { direction: 'right' });
    if (e.code === 'ArrowDown') emitAction('move', { direction: 'down' });
    if (e.code === 'ArrowUp') emitAction('rotate', {});
    if (e.code === 'Space') emitAction('hardDrop', {});
  });

  document.addEventListener('keyup', (e) => {
    pressedKeys.delete(e.code);
  });

  function drawBoard(ctx, board, currentPiece, playerNum) {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, BOARD_WIDTH * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);

    // Draw grid
    ctx.strokeStyle = '#222';
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }

    // Draw placed blocks
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[y] && board[y][x]) {
          ctx.fillStyle = board[y][x];
          ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        }
      }
    }

    // Draw current piece
    if (currentPiece && currentPiece.shapeData) {
      const shape = currentPiece.shapeData;
      const color = COLORS[currentPiece.shape];
      ctx.fillStyle = color;

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const drawX = (currentPiece.x + x) * BLOCK_SIZE;
            const drawY = (currentPiece.y + y) * BLOCK_SIZE;
            ctx.fillRect(drawX + 1, drawY + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        }
      }
    }
  }

  return {
    onStateUpdate: (state) => {
      if (!state.players) return;

      const playerIds = Object.keys(state.players);
      const player1Id = playerIds[0];
      const player2Id = playerIds[1];

      if (player1Id) {
        const p1 = state.players[player1Id];
        drawBoard(ctx1, p1.board, p1.currentPiece, 1);
        score1El.textContent = 'Score: ' + (p1.score || 0);
      }

      if (player2Id) {
        const p2 = state.players[player2Id];
        drawBoard(ctx2, p2.board, p2.currentPiece, 2);
        score2El.textContent = 'Score: ' + (p2.score || 0);
      }

      // Show game over
      if (state.gameOver) {
        const winner = state.winner;
        const winnerNum = playerIds.indexOf(winner) + 1;
        [ctx1, ctx2].forEach(ctx => {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(0, 0, BOARD_WIDTH * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Game Over!', BOARD_WIDTH * BLOCK_SIZE / 2, BOARD_HEIGHT * BLOCK_SIZE / 2 - 20);
          ctx.fillText('Player ' + winnerNum + ' Wins!', BOARD_WIDTH * BLOCK_SIZE / 2, BOARD_HEIGHT * BLOCK_SIZE / 2 + 10);
        });
      }
    }
  };
}

const serverLogic = {
  initialState: {
    players: {},
    gameStarted: false,
    gameOver: false,
    winner: null,
    lastTickTime: Date.now()
  },
  moves: {
    playerJoined: (state, payload, playerId) => {
      const shapes = {
        I: [[1,1,1,1]],
        O: [[1,1],[1,1]],
        T: [[0,1,0],[1,1,1]],
        S: [[0,1,1],[1,1,0]],
        Z: [[1,1,0],[0,1,1]],
        J: [[1,0,0],[1,1,1]],
        L: [[0,0,1],[1,1,1]]
      };
      const shapeKeys = Object.keys(shapes);
      const randomShape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];

      state.players[playerId] = {
        board: Array(20).fill(null).map(() => Array(10).fill(null)),
        currentPiece: {
          shape: randomShape,
          shapeData: shapes[randomShape],  // Store actual shape data
          x: 3,
          y: 0,
          rotation: 0
        },
        score: 0,
        gameOver: false
      };

      // Start game when 2 players join
      if (Object.keys(state.players).length === 2) {
        state.gameStarted = true;
      }
    },

    move: (state, payload, playerId) => {
      const player = state.players[playerId];
      if (!player || player.gameOver || state.gameOver) return;

      const piece = player.currentPiece;
      const shape = piece.shapeData;

      const canMove = (dx, dy) => {
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
              const newX = piece.x + x + dx;
              const newY = piece.y + y + dy;
              if (newX < 0 || newX >= 10 || newY >= 20) return false;
              if (newY >= 0 && player.board[newY][newX]) return false;
            }
          }
        }
        return true;
      };

      if (payload.direction === 'left' && canMove(-1, 0)) {
        piece.x -= 1;
      } else if (payload.direction === 'right' && canMove(1, 0)) {
        piece.x += 1;
      } else if (payload.direction === 'down' && canMove(0, 1)) {
        piece.y += 1;
      }
    },

    rotate: (state, payload, playerId) => {
      const player = state.players[playerId];
      if (!player || player.gameOver || state.gameOver) return;

      const piece = player.currentPiece;
      if (piece.shape === 'O') return; // O piece doesn't rotate

      // Rotate the shape data (transpose and reverse rows)
      const rotated = piece.shapeData[0].map((_, i) =>
        piece.shapeData.map(row => row[i]).reverse()
      );

      // Check if rotation is valid
      const canRotate = () => {
        for (let y = 0; y < rotated.length; y++) {
          for (let x = 0; x < rotated[y].length; x++) {
            if (rotated[y][x]) {
              const newX = piece.x + x;
              const newY = piece.y + y;
              if (newX < 0 || newX >= 10 || newY >= 20) return false;
              if (newY >= 0 && player.board[newY][newX]) return false;
            }
          }
        }
        return true;
      };

      if (canRotate()) {
        piece.shapeData = rotated;  // Update the shape data
      }
    },

    hardDrop: (state, payload, playerId) => {
      const player = state.players[playerId];
      if (!player || player.gameOver || state.gameOver) return;

      const piece = player.currentPiece;
      const shape = piece.shapeData;
      const baseShapes = {
        I: [[1,1,1,1]],
        O: [[1,1],[1,1]],
        T: [[0,1,0],[1,1,1]],
        S: [[0,1,1],[1,1,0]],
        Z: [[1,1,0],[0,1,1]],
        J: [[1,0,0],[1,1,1]],
        L: [[0,0,1],[1,1,1]]
      };
      const colors = {
        I: '#00f0f0',
        O: '#f0f000',
        T: '#a000f0',
        S: '#00f000',
        Z: '#f00000',
        J: '#0000f0',
        L: '#f0a000'
      };

      // Drop until collision
      while (true) {
        let canMove = true;
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
              const newY = piece.y + y + 1;
              const newX = piece.x + x;
              if (newY >= 20 || (newY >= 0 && player.board[newY][newX])) {
                canMove = false;
                break;
              }
            }
          }
          if (!canMove) break;
        }
        if (!canMove) break;
        piece.y += 1;
      }

      // Lock piece
      const color = colors[piece.shape];
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const boardY = piece.y + y;
            const boardX = piece.x + x;
            if (boardY >= 0) {
              player.board[boardY][boardX] = color;
            }
          }
        }
      }

      // Check for completed lines
      let linesCleared = 0;
      for (let y = 19; y >= 0; y--) {
        if (player.board[y].every(cell => cell !== null)) {
          player.board.splice(y, 1);
          player.board.unshift(Array(10).fill(null));
          linesCleared++;
          y++; // Check same row again
        }
      }

      if (linesCleared > 0) {
        player.score += linesCleared * 100;

        // Send garbage to opponent
        const opponentId = Object.keys(state.players).find(id => id !== playerId);
        if (opponentId) {
          const opponent = state.players[opponentId];
          // Add garbage lines (incomplete lines with random holes)
          for (let i = 0; i < linesCleared; i++) {
            opponent.board.shift(); // Remove top line
            const garbageLine = Array(10).fill('#666');
            const holePos = Math.floor(Math.random() * 10);
            garbageLine[holePos] = null; // Create hole
            opponent.board.push(garbageLine);
          }
        }
      }

      // Spawn new piece
      const shapeKeys = Object.keys(baseShapes);
      const randomShape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
      piece.shape = randomShape;
      piece.shapeData = baseShapes[randomShape];  // Reset to base shape
      piece.x = 3;
      piece.y = 0;

      // Check game over
      const newShape = piece.shapeData;
      for (let y = 0; y < newShape.length; y++) {
        for (let x = 0; x < newShape[y].length; x++) {
          if (newShape[y][x] && player.board[y][piece.x + x]) {
            player.gameOver = true;
            state.gameOver = true;
            state.winner = opponentId;
          }
        }
      }
    },

    tick: (state) => {
      if (!state.gameStarted || state.gameOver) return;

      const now = Date.now();
      if (now - state.lastTickTime < 1000) return; // Tick every 1 second
      state.lastTickTime = now;

      const baseShapes = {
        I: [[1,1,1,1]],
        O: [[1,1],[1,1]],
        T: [[0,1,0],[1,1,1]],
        S: [[0,1,1],[1,1,0]],
        Z: [[1,1,0],[0,1,1]],
        J: [[1,0,0],[1,1,1]],
        L: [[0,0,1],[1,1,1]]
      };
      const colors = {
        I: '#00f0f0',
        O: '#f0f000',
        T: '#a000f0',
        S: '#00f000',
        Z: '#f00000',
        J: '#0000f0',
        L: '#f0a000'
      };

      // Auto drop pieces
      Object.entries(state.players).forEach(([playerId, player]) => {
        if (player.gameOver) return;

        const piece = player.currentPiece;
        const shape = piece.shapeData;

        // Check if can move down
        let canMoveDown = true;
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
              const newY = piece.y + y + 1;
              const newX = piece.x + x;
              if (newY >= 20 || (newY >= 0 && player.board[newY][newX])) {
                canMoveDown = false;
                break;
              }
            }
          }
          if (!canMoveDown) break;
        }

        if (canMoveDown) {
          piece.y += 1;
        } else {
          // Lock piece
          const color = colors[piece.shape];
          for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
              if (shape[y][x]) {
                const boardY = piece.y + y;
                const boardX = piece.x + x;
                if (boardY >= 0) {
                  player.board[boardY][boardX] = color;
                }
              }
            }
          }

          // Check for completed lines
          let linesCleared = 0;
          for (let y = 19; y >= 0; y--) {
            if (player.board[y].every(cell => cell !== null)) {
              player.board.splice(y, 1);
              player.board.unshift(Array(10).fill(null));
              linesCleared++;
              y++;
            }
          }

          if (linesCleared > 0) {
            player.score += linesCleared * 100;

            // Send garbage
            const opponentId = Object.keys(state.players).find(id => id !== playerId);
            if (opponentId) {
              const opponent = state.players[opponentId];
              for (let i = 0; i < linesCleared; i++) {
                opponent.board.shift();
                const garbageLine = Array(10).fill('#666');
                const holePos = Math.floor(Math.random() * 10);
                garbageLine[holePos] = null;
                opponent.board.push(garbageLine);
              }
            }
          }

          // Spawn new piece
          const shapeKeys = Object.keys(baseShapes);
          const randomShape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
          piece.shape = randomShape;
          piece.shapeData = baseShapes[randomShape];  // Reset to base shape
          piece.x = 3;
          piece.y = 0;

          // Check game over
          const newShape = piece.shapeData;
          for (let y = 0; y < newShape.length; y++) {
            for (let x = 0; x < newShape[y].length; x++) {
              if (newShape[y][x] && player.board[y] && player.board[y][piece.x + x]) {
                player.gameOver = true;
                state.gameOver = true;
                const opponentId = Object.keys(state.players).find(id => id !== playerId);
                state.winner = opponentId;
              }
            }
          }
        }
      });
    }
  }
};
`
};
//# sourceMappingURL=tetris-battle.js.map
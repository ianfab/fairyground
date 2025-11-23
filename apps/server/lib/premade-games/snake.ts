export default {
  name: "snake",
  description: "Classic Snake game - use arrow keys to control the snake",
  code: `
// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  container.innerHTML = \`
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #1a1a2e; gap: 20px;">
      <h1 style="font-size: 32px; color: #eee; margin: 0;">🐍 Snake</h1>
      <div style="color: #888; font-size: 14px;">Use Arrow Keys to Control</div>
      <canvas id="game-canvas" width="400" height="400" style="border: 2px solid #0f3460; background: #16213e;"></canvas>
      <div id="score" style="font-size: 24px; color: #eee;">Score: 0</div>
      <div id="high-score" style="font-size: 16px; color: #888;">High Score: 0</div>
    </div>
  \`;
  
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');
  
  const GRID_SIZE = 20;
  const CELL_SIZE = canvas.width / GRID_SIZE;
  let highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
  highScoreEl.textContent = 'High Score: ' + highScore;
  
  // Handle keyboard input
  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      emitAction('changeDirection', { direction: e.key.replace('Arrow', '').toLowerCase() });
    }
  });
  
  function drawGame(state) {
    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw food
    if (state.food) {
      ctx.fillStyle = '#e94560';
      ctx.fillRect(
        state.food.x * CELL_SIZE + 2,
        state.food.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    }
    
    // Draw snake
    if (state.snake && state.snake.length > 0) {
      state.snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#0bdf51' : '#16c951';
        ctx.fillRect(
          segment.x * CELL_SIZE + 2,
          segment.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4
        );
      });
    }
    
    // Update score
    scoreEl.textContent = 'Score: ' + (state.score || 0);
    
    // Update high score
    if (state.score > highScore) {
      highScore = state.score;
      localStorage.setItem('snakeHighScore', highScore.toString());
      highScoreEl.textContent = 'High Score: ' + highScore;
    }
    
    // Game over
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Score: ' + state.score, canvas.width / 2, canvas.height / 2 + 20);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText('Press any arrow key to restart', canvas.width / 2, canvas.height / 2 + 50);
    }
  }
  
  return {
    onStateUpdate: (state) => {
      drawGame(state);
    }
  };
}

// SERVER-SIDE LOGIC
const serverLogic = {
  initialState: {
    snake: [{ x: 10, y: 10 }],
    direction: 'right',
    food: { x: 15, y: 10 },
    score: 0,
    gameOver: false,
    lastUpdate: Date.now()
  },
  
  moves: {
    changeDirection: (state, payload) => {
      if (state.gameOver) {
        // Reset game
        state.snake = [{ x: 10, y: 10 }];
        state.direction = 'right';
        state.food = {
          x: Math.floor(Math.random() * 20),
          y: Math.floor(Math.random() * 20)
        };
        state.score = 0;
        state.gameOver = false;
        state.lastUpdate = Date.now();
        return;
      }
      
      const newDirection = payload.direction;
      
      // Prevent reversing direction
      if (
        (state.direction === 'up' && newDirection === 'down') ||
        (state.direction === 'down' && newDirection === 'up') ||
        (state.direction === 'left' && newDirection === 'right') ||
        (state.direction === 'right' && newDirection === 'left')
      ) {
        return;
      }
      
      state.direction = newDirection;
    },
    
    tick: (state) => {
      if (state.gameOver) return;
      
      const now = Date.now();
      if (now - state.lastUpdate < 150) return; // Update every 150ms
      state.lastUpdate = now;
      
      // Calculate new head position
      const head = { ...state.snake[0] };
      
      switch (state.direction) {
        case 'up':
          head.y--;
          break;
        case 'down':
          head.y++;
          break;
        case 'left':
          head.x--;
          break;
        case 'right':
          head.x++;
          break;
      }
      
      // Check wall collision
      if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
        state.gameOver = true;
        return;
      }
      
      // Check self collision
      if (state.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        state.gameOver = true;
        return;
      }
      
      // Add new head
      state.snake.unshift(head);
      
      // Check food collision
      if (head.x === state.food.x && head.y === state.food.y) {
        state.score++;
        // Generate new food
        state.food = {
          x: Math.floor(Math.random() * 20),
          y: Math.floor(Math.random() * 20)
        };
      } else {
        // Remove tail if no food eaten
        state.snake.pop();
      }
    }
  }
};
`
};


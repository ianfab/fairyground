export default {
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
};

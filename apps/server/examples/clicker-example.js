// 2D Clicker Game Example
// Simple example showing client-server structure

// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 20px;">
      <h1 style="font-size: 48px; color: #fff;">Click Counter</h1>
      <div id="score" style="font-size: 72px; font-weight: bold; color: #0f0;">0</div>
      <button id="click-btn" style="padding: 20px 40px; font-size: 24px; cursor: pointer; border-radius: 10px;">
        Click Me!
      </button>
      <div id="players" style="color: #888; margin-top: 20px;"></div>
    </div>
  `;
  
  const scoreEl = document.getElementById('score');
  const clickBtn = document.getElementById('click-btn');
  const playersEl = document.getElementById('players');
  
  clickBtn.onclick = () => {
    emitAction('click', { timestamp: Date.now() });
  };
  
  return {
    onStateUpdate: (state) => {
      scoreEl.textContent = state.score || 0;
      
      // Show player contributions
      if (state.players) {
        const playerList = Object.entries(state.players)
          .map(([id, data]) => `Player ${id.substring(0, 6)}: ${data.clicks || 0} clicks`)
          .join('<br>');
        playersEl.innerHTML = playerList;
      }
    }
  };
}

// SERVER-SIDE CODE
const serverLogic = {
  initialState: {
    score: 0,
    players: {}
  },
  moves: {
    click: (state, payload, playerId) => {
      // Initialize player if needed
      if (!state.players[playerId]) {
        state.players[playerId] = { clicks: 0 };
      }
      
      // Increment scores
      state.score += 1;
      state.players[playerId].clicks += 1;
    }
  }
};


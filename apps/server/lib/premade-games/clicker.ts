export default {
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
};

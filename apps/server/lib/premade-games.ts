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
  
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') emitAction('move', { direction: 'up' });
    if (e.code === 'KeyS') emitAction('move', { direction: 'down' });
  });
  
  function render(state) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(20, state.paddle1Y || 250, 10, 100);
    ctx.fillRect(770, state.paddle2Y || 250, 10, 100);
    ctx.fillRect(state.ballX || 400, state.ballY || 300, 10, 10);
    
    ctx.font = '48px Arial';
    ctx.fillText((state.score1 || 0) + ' - ' + (state.score2 || 0), 350, 50);
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
    players: {}
  },
  moves: {
    move: (state, payload, playerId) => {
      const isPlayer1 = Object.keys(state.players).indexOf(playerId) === 0;
      const paddle = isPlayer1 ? 'paddle1Y' : 'paddle2Y';
      
      if (payload.direction === 'up') {
        state[paddle] = Math.max(0, state[paddle] - 20);
      } else if (payload.direction === 'down') {
        state[paddle] = Math.min(500, state[paddle] + 20);
      }
    }
  }
};
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


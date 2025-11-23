export default {
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
};

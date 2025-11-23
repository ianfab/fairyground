// Chess Variant Template
// This code runs on both client and server

// CLIENT-SIDE CODE
// This function initializes the game in the browser
function initGameClient(container, socket, roomId, emitAction) {
  // Create a simple chess board display
  const board = document.createElement('div');
  board.style.cssText = 'display: grid; grid-template-columns: repeat(8, 60px); gap: 0; margin: 40px auto; width: fit-content;';
  
  let currentState = null;
  
  // Render the board
  function renderBoard(fen) {
    board.innerHTML = '';
    const rows = fen.split(' ')[0].split('/');
    
    rows.forEach((row, rowIdx) => {
      let colIdx = 0;
      for (let char of row) {
        if (isNaN(char)) {
          // It's a piece
          const square = document.createElement('div');
          square.style.cssText = `
            width: 60px; 
            height: 60px; 
            background: ${(rowIdx + colIdx) % 2 === 0 ? '#f0d9b5' : '#b58863'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            cursor: pointer;
          `;
          
          const pieceMap = {
            'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
            'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
          };
          
          square.textContent = pieceMap[char] || char;
          square.dataset.pos = `${String.fromCharCode(97 + colIdx)}${8 - rowIdx}`;
          
          square.onclick = () => {
            emitAction('move', { from: square.dataset.pos, to: square.dataset.pos });
          };
          
          board.appendChild(square);
          colIdx++;
        } else {
          // It's empty squares
          const emptyCount = parseInt(char);
          for (let i = 0; i < emptyCount; i++) {
            const square = document.createElement('div');
            square.style.cssText = `
              width: 60px; 
              height: 60px; 
              background: ${(rowIdx + colIdx) % 2 === 0 ? '#f0d9b5' : '#b58863'};
            `;
            board.appendChild(square);
            colIdx++;
          }
        }
      }
    });
  }
  
  container.appendChild(board);
  
  return {
    onStateUpdate: (state) => {
      currentState = state;
      if (state.board) {
        renderBoard(state.board);
      }
    }
  };
}

// SERVER-SIDE CODE
// This defines the game state and logic
const serverLogic = {
  initialState: {
    board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    players: {},
    currentTurn: 'white',
    moves: []
  },
  moves: {
    move: (state, payload, playerId) => {
      // Simple move tracking (real chess logic would go here)
      state.moves.push({
        from: payload.from,
        to: payload.to,
        player: playerId,
        timestamp: Date.now()
      });
      
      // Toggle turn
      state.currentTurn = state.currentTurn === 'white' ? 'black' : 'white';
    }
  }
};


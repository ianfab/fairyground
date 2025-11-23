// Test the chess rendering logic
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function fenToPosition(fen) {
  const position = {};
  const rows = fen.split(' ')[0].split('/');
  
  rows.forEach((row, rowIdx) => {
    let colIdx = 0;
    for (let char of row) {
      if (isNaN(char)) {
        const square = String.fromCharCode(97 + colIdx) + (8 - rowIdx);
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const piece = char.toUpperCase();
        position[square] = color + piece;
        colIdx++;
      } else {
        colIdx += parseInt(char);
      }
    }
  });
  
  return position;
}

const position = fenToPosition(fen);
console.log('Position object:', JSON.stringify(position, null, 2));
console.log('Number of pieces:', Object.keys(position).length);


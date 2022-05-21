// ffish.js test using chessgroundx

const Chessground = require("chessgroundx").Chessground;

const variantsIni = document.getElementById("variants-ini");
const dropdownVariant = document.getElementById("dropdown-variant");

const buttonFlip = document.getElementById("button-flip");
const buttonUndo = document.getElementById("undo");
const rangeVolume = document.getElementById("range-volume");

const checkboxDests = document.getElementById("check-dests");

const textFen = document.getElementById("fen");
const textMoves = document.getElementById("move");
const buttonSetFen = document.getElementById("set");
const labelPgn = document.getElementById("label-pgn");
const labelStm = document.getElementById("label-stm");

const chessgroundContainerEl = document.getElementById(
  "chessground-container-div"
);
const chessgroundEl = document.getElementById("chessground-board");

const soundMove = new Audio("assets/sound/thearst3rd/move.wav");
const soundCapture = new Audio("assets/sound/thearst3rd/capture.wav");
const soundCheck = new Audio("assets/sound/thearst3rd/check.wav");
const soundTerminal = new Audio("assets/sound/thearst3rd/terminal.wav");

let ffish = null;
let board = null;
let chessground = null;

function initBoard(variant) {
  if (board !== null) board.delete();

  board = new ffish.Board(variant);
  console.log("Variant:", board.variant());
}

import Module from "ffish-es6";
new Module().then((loadedModule) => {
  ffish = loadedModule;
  console.log("ffish.js initialized!");

  initBoard(dropdownVariant.value);

  const config = {
    geometry: 4,
    movable: {
      free: false,
      showDests: checkboxDests.checked,
      events: {
        after: afterChessgroundMove,
      },
    },
    draggable: {
      showGhost: true,
    },
    selectable: {
      enabled: false,
    },
  };
  chessground = Chessground(chessgroundEl, config);

  soundMove.volume = rangeVolume.value;
  soundCapture.volume = rangeVolume.value;
  soundCheck.volume = rangeVolume.value;
  soundTerminal.volume = rangeVolume.value;

  variantsIni.onchange = function (e) {
    const selected = e.currentTarget.files[0];
    if (selected) {
      selected.text().then(function (ini) {
        console.log(ini);
        ffish.loadVariantConfig(ini);
      });
    }
  };

  dropdownVariant.onchange = function () {
    initBoard(dropdownVariant.value);
    updateChessground();
    chessground.cancelPremove();
  };

  buttonFlip.onclick = function () {
    chessground.toggleOrientation();
  };
  buttonUndo.onclick = function () {
    if (board.moveStack().length === 0) return;
    board.pop();
    updateChessground();
    chessground.cancelPremove();
  };
  rangeVolume.oninput = function () {
    soundMove.volume = rangeVolume.value;
    soundCapture.volume = rangeVolume.value;
    soundCheck.volume = rangeVolume.value;
    soundTerminal.volume = rangeVolume.value;
  };

  checkboxDests.oninput = function () {
    chessground.set({
      movable: {
        showDests: checkboxDests.checked,
      },
    });
  };

  buttonSetFen.onclick = function () {
    const fen = textFen.value;
    if (!fen || ffish.validateFen(fen, board.variant())) {
      if (fen) board.setFen(fen);
      else board.reset();

      const moves = textMoves.value.split(" ").reverse();
      while (moves.length > 0) {
        board.push(moves.pop());
      }
      updateChessground();
    } else {
      alert("Invalid FEN");
    }
  };

  updateChessground();
});

// Chessground helper functions

function getDests(board) {
  const dests = {};
  const moves = board
    .legalMoves()
    .split(" ")
    .filter((m) => m !== "");
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const match = move.match(/(\D\d+)(\D\d+)/);
    if (!match) continue;
    const from = match[1].replace("10", ":");
    const to = match[2].replace("10", ":");
    if (dests[from] === undefined) dests[from] = [];
    dests[from].push(to);
  }
  return dests;
}

function getColorOrUndefined(board) {
  if (board.isGameOver(true)) return undefined;
  return getColor(board);
}

function getColor(board) {
  return board.turn() ? "white" : "black";
}

function getPiecesAsArray(board) {
  // Is board.toString really the best way to get the pieces?
  const pieces = [];
  const piecesLines = board.toString().split(/\r?\n/);
  for (let i = 0; i < piecesLines.length; i++) {
    pieces[piecesLines.length - i - 1] = piecesLines[i].split(" ");
  }
  return pieces;
}

function squareGetCoords(square) {
  if (square.length < 2) return [-1, -1];

  const coords = [-1, -1];
  coords[0] = parseInt(square.substring(1)) - 1;
  if (coords[0] === NaN || coords[0] < 0 || coords[0] >= 1000) return [-1, -1];
  coords[1] = square.charCodeAt(0) - "a".charCodeAt(0);
  if (coords[1] === NaN || coords[1] < 0 || coords[1] >= 26) return [-1, -1];
  return coords;
}

function isCapture(board, move) {
  const pieces = getPiecesAsArray(board);

  const moveFromStr = move.charAt(0) + parseInt(move.substring(1));
  const moveToStr =
    move.charAt(moveFromStr.length) +
    parseInt(move.substring(moveFromStr.length + 1));
  const moveFrom = squareGetCoords(moveFromStr);
  const moveTo = squareGetCoords(moveToStr);

  if (pieces[moveTo[0]][moveTo[1]] !== ".") return true;

  // En passant
  if (pieces[moveFrom[0]][moveFrom[1]].toLowerCase() === "p")
    return moveFrom[1] !== moveTo[1];

  return false;
}

function afterChessgroundMove(orig, dest, metadata) {
  // Auto promote to queen for now
  let promotion = "q";
  if (metadata.ctrlKey) {
    promotion = "n";
  }
  // TODO, make this way better
  const move = orig.replace(":", "10") + dest.replace(":", "10");
  const capture = isCapture(board, move);
  if (
    (metadata.ctrlKey || !board.push(move)) &&
    !board.push(move + promotion)
  ) {
    const foundmove = board.legalMoves().match(new RegExp(`${move}[^ ]+`));
    if (foundmove) board.push(foundmove[0]);
  }
  afterMove(capture);
}

function afterMove(capture) {
  updateChessground();
  textMoves.value = board.moveStack();
  buttonSetFen.click();

  if (capture) {
    soundCapture.currentTime = 0.0;
    soundCapture.play();
  } else {
    soundMove.currentTime = 0.0;
    soundMove.play();
  }

  if (board.isGameOver(true)) {
    soundTerminal.currentTime = 0.0;
    soundTerminal.play();
  } else if (board.isCheck()) {
    soundCheck.currentTime = 0.0;
    soundCheck.play();
  }
}

function getPgn(board) {
  let pgn = "";
  const reversedMoves = [];
  let moveStack = board.moveStack();
  while (moveStack.length > 0) {
    // TODO: improve this :/
    reversedMoves.push(moveStack.split(" ").pop());
    board.pop();
    moveStack = board.moveStack();
  }
  if (!board.turn() && reversedMoves.length > 0) {
    pgn += board.fullmoveNumber() + "... ";
  }
  while (reversedMoves.length > 0) {
    const move = reversedMoves.pop();
    if (board.turn()) {
      pgn += board.fullmoveNumber() + ". ";
    }
    pgn += board.sanMove(move) + " ";
    board.push(move);
  }

  const result = board.result(true);
  if (result !== "*") pgn += result;

  return pgn.trim();
}

function updateChessground() {
  labelPgn.innerText = getPgn(board);
  labelStm.innerText = getColorOrUndefined(board);

  chessground.set({
    fen: board.fen(),
    check: board.isCheck(),
    turnColor: getColor(board),
    movable: {
      color: getColorOrUndefined(board),
      dests: getDests(board),
    },
  });

  const moveStack = board.moveStack();
  if (moveStack.length === 0) {
    chessground.set({ lastMove: undefined });
    buttonUndo.disabled = true;
  } else {
    const lastMove = moveStack.split(" ").pop();
    const lastMoveFrom = lastMove.substring(0, 2);
    const lastMoveTo = lastMove.substring(2, 4);
    chessground.set({ lastMove: [lastMoveFrom, lastMoveTo] });
    buttonUndo.disabled = false;
  }
}

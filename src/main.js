// ffish.js test using chessgroundx

const Chessground = require("chessgroundx").Chessground;
import * as util from "chessgroundx/util";

const variantsIni = document.getElementById("variants-ini");
const dropdownVariant = document.getElementById("dropdown-variant");

const buttonFlip = document.getElementById("button-flip");
const buttonUndo = document.getElementById("undo");
const rangeVolume = document.getElementById("range-volume");

const checkboxDests = document.getElementById("check-dests");
const checkboxAdjudicate = document.getElementById("check-adjudicate");

const textFen = document.getElementById("fen");
const textMoves = document.getElementById("move");
const buttonSetFen = document.getElementById("set");
const labelPgn = document.getElementById("label-pgn");
const labelStm = document.getElementById("label-stm");

const chessgroundContainerEl = document.getElementById(
  "chessground-container-div"
);
const chessgroundEl = document.getElementById("chessground-board");
const pocketTopEl = document.getElementById("pocket-top");
const pocketBottomEl = document.getElementById("pocket-bottom");

const soundMove = new Audio("assets/sound/thearst3rd/move.wav");
const soundCapture = new Audio("assets/sound/thearst3rd/capture.wav");
const soundCheck = new Audio("assets/sound/thearst3rd/check.wav");
const soundTerminal = new Audio("assets/sound/thearst3rd/terminal.wav");

let ffish = null;
let board = null;
let chessground = null;

const WHITE = true;
const BLACK = false;

function getPieceRoles(pieceLetters) {
  const uniqueLetters = new Set(pieceLetters.toLowerCase().split(""));
  return [...uniqueLetters].map((char) => char + "-piece");
}

function initBoard(variant) {
  if (board !== null) board.delete();

  board = new ffish.Board(variant);
  console.log("Variant:", board.variant());

  // Figuring out pocket roles from initial FEN
  const fenBoard = board.fen().split(" ")[0];
  var pocketRoles = undefined;
  if (fenBoard.includes("[")) {
    const wpocket = board.pocket(WHITE);
    const bpocket = board.pocket(BLACK);
    // Variants with empty hands at start (zh, shogi, etc.)
    if (ffish.capturesToHand(variant)) {
      const pieceLetters = fenBoard.replace(/[0-9kK\/\[\]]/g, "");
      const pieceRoles = getPieceRoles(pieceLetters);
      pocketRoles = {
        white: pieceRoles,
        black: pieceRoles,
      };
      // Variants having pieces in hand at start (placement, sittuyin, etc.)
    } else {
      pocketRoles = {
        white: getPieceRoles(wpocket),
        black: getPieceRoles(bpocket),
      };
    }
  }

  const config = {
    dimensions: getDimensions(),
    fen: fenBoard,
    movable: {
      free: true,
      showDests: checkboxDests.checked,
      events: {
        after: afterChessgroundMove,
        afterNewPiece: afterChessgroundDrop,
      },
    },
    draggable: {
      showGhost: true,
    },
    selectable: {
      enabled: false,
    },
    pocketRoles: pocketRoles,
  };

  chessground = Chessground(chessgroundEl, config, pocketTopEl, pocketBottomEl);

  if (pocketRoles === undefined) {
    pocketTopEl.style.display = "none";
    pocketBottomEl.style.display = "none";
  }
}

function getDimensions() {
  const fenBoard = board.fen().split(" ")[0];
  const ranks = fenBoard.split("/").length;
  const lastRank = fenBoard.split("/")[0].replace(/[^0-9a-z]/gi, "");
  let files = lastRank.length;
  for (const match of lastRank.matchAll(/\d+/g)) {
    files += parseInt(match[0]) - match[0].length;
  }
  console.log("Board: %dx%d", files, ranks);
  return { width: files, height: ranks };
}

import Module from "ffish-es6";
new Module().then((loadedModule) => {
  ffish = loadedModule;
  console.log("ffish.js initialized!");

  initBoard(dropdownVariant.value);

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
    if (!ffish.variants().includes(dropdownVariant.value)) return;
    const oldDimensions = getDimensions();
    initBoard(dropdownVariant.value);
    const newDimensions = getDimensions();

    chessgroundContainerEl.classList.toggle(
      `board${oldDimensions["width"]}x${oldDimensions["height"]}`
    );
    chessgroundContainerEl.classList.toggle(
      `board${newDimensions["width"]}x${newDimensions["height"]}`
    );
    if (ffish.capturesToHand(dropdownVariant.value))
    {
      console.log('pockets');
      chessgroundContainerEl.classList.add(`pockets`);
    }
    else
      chessgroundContainerEl.classList.remove(`pockets`);
    updateChessground();
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
  const dests = new Map();
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
    if (dests.get(from) === undefined) dests.set(from, []);
    dests.get(from).push(to);
  }
  return dests;
}

function getColorOrUndefined(board) {
  if (board.isGameOver(checkboxAdjudicate.checked)) return undefined;
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

function afterChessgroundDrop(piece, dest, metadata) {
  const role = piece.role;
  const move = util.dropOrigOf(role) + dest.replace(":", "10");
  board.push(move);
  afterMove(false);
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

  if (board.isGameOver(checkboxAdjudicate.checked)) {
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

  const result = board.result(checkboxAdjudicate.checked);
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

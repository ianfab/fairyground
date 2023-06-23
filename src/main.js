// ffish.js test using chessgroundx
const Chessground = require("chessgroundx").Chessground;

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
const chessgroundContainerEl = document.getElementById("chessground-container-div");
const chessgroundEl = document.getElementById("chessground-board");
const pocketTopEl = document.getElementById("pocket-top");
const pocketBottomEl = document.getElementById("pocket-bottom");
const displayMoves = document.getElementById("displaymoves");
const displayReady = document.getElementById("displayready");
const isReviewMode = document.getElementById("isreviewmode");
const buttonNextPosition = document.getElementById("nextposition");
const buttonPreviousPosition = document.getElementById("previousposition");
const buttonInitialPosition = document.getElementById("initialposition");
const buttonCurrentPosition = document.getElementById("currentposition");
const buttonSpecifiedPosition = document.getElementById("specifiedposition");
const currentBoardFen = document.getElementById("currentboardfen");
const gameResult = document.getElementById("gameresult");
const quickPromotionPiece = document.getElementById("dropdown-quickpromotion");
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
  return [...uniqueLetters].map(char => char + "-piece");
}

function initBoard(variant) {
  if (board !== null) board.delete();
  board = new ffish.Board(variant);
  console.log("Variant:", board.variant()); // Figuring out pocket roles from initial FEN

  const fenBoard = board.fen().split(" ")[0];
  var pocketRoles = undefined;

  if (fenBoard.includes("[")) {
    const wpocket = board.pocket(WHITE);
    const bpocket = board.pocket(BLACK); // Variants with empty hands at start (zh, shogi, etc.)

    if (ffish.capturesToHand(variant)) {
      const pieceLetters = fenBoard.replace(/[0-9kK\/\[\]]/g, "");
      const pieceRoles = getPieceRoles(pieceLetters);
      pocketRoles = {
        white: pieceRoles,
        black: pieceRoles
      }; // Variants having pieces in hand at start (placement, sittuyin, etc.)
    } else {
      pocketRoles = {
        white: getPieceRoles(wpocket),
        black: getPieceRoles(bpocket)
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
        afterNewPiece: afterChessgroundDrop
      }
    },
    draggable: {
      showGhost: true
    },
    selectable: {
      enabled: false
    },
    pocketRoles: pocketRoles
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
  const lastRank = fenBoard.split("/")[0].replace(/[^0-9a-z*]/gi, "");
  let files = lastRank.length;

  for (const match of lastRank.matchAll(/\d+/g)) {
    files += parseInt(match[0]) - match[0].length;
  }

  console.log("Board: %dx%d", files, ranks);
  return {
    width: files,
    height: ranks
  };
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
    if (isReviewMode.value.length > 0 && isReviewMode.value == 1) {
      return;
    }
    if (!ffish.variants().includes(dropdownVariant.value)) return;
    const oldDimensions = getDimensions();
    initBoard(dropdownVariant.value);
    const newDimensions = getDimensions();
    chessgroundContainerEl.classList.toggle(`board${oldDimensions["width"]}x${oldDimensions["height"]}`);
    chessgroundContainerEl.classList.toggle(`board${newDimensions["width"]}x${newDimensions["height"]}`);

    if (ffish.capturesToHand(dropdownVariant.value)) {
      console.log("pockets");
      chessgroundContainerEl.classList.add(`pockets`);
    } else chessgroundContainerEl.classList.remove(`pockets`);

    updateChessground();
  };

  buttonFlip.onclick = function () {
    chessground.toggleOrientation();
  };

  buttonUndo.onclick = function () {
    if (isReviewMode.value.length > 0 && isReviewMode.value == 1) {
      return;
    }
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
        showDests: checkboxDests.checked
      }
    });
  };

  buttonSetFen.onclick = function () {
    if (isReviewMode.value.length > 0 && isReviewMode.value == 1) {
      return;
    }
    const fen = textFen.value;

    if (!fen || ffish.validateFen(fen, board.variant())) {
      if (fen) board.setFen(fen);else board.reset();
      const moves = textMoves.value.split(" ").reverse();

      while (moves.length > 0) {
        board.push(moves.pop());
      }

      updateChessground();
    } else {
      alert("Invalid FEN");
    }
  };

  buttonNextPosition.onclick = function () {
    updateChessBoardToPosition(textFen.value,displayMoves.value,false);
  };

  buttonPreviousPosition.onclick = function () {
    updateChessBoardToPosition(textFen.value,displayMoves.value,false);
  };

  buttonInitialPosition.onclick = function () {
    updateChessBoardToPosition(textFen.value,displayMoves.value,false);
  };

  buttonCurrentPosition.onclick = function () {
    updateChessBoardToPosition(textFen.value,displayMoves.value,true);
  };

  buttonSpecifiedPosition.onclick = function () {
    updateChessBoardToPosition(textFen.value,displayMoves.value,false);
  };

  updateChessground();
}); // Chessground helper functions

function updateChessBoardToPosition(fen,movelist,enablemove) {
  let i = 0;
  while (displayReady.value.length < 1 || displayReady.value != 1)
  {
    i = 0;
  }

  if (!fen || ffish.validateFen(fen, board.variant())) {
    if (fen) board.setFen(fen);else board.reset();
    const moves = movelist.split(" ").reverse();

    while (moves.length > 0) {
      board.push(moves.pop());
    }

    updateChessground();
  } else {
    alert("Invalid FEN");
  }
  if (enablemove) {
    enableBoardMove();
  } else {
    disableBoardMove();
  }
  displayReady.value = 0;
};

function getDests(board) {
  const dests = new Map();
  const moves = board.legalMoves().split(" ").filter(m => m !== "");

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
  const moveToStr = move.charAt(moveFromStr.length) + parseInt(move.substring(moveFromStr.length + 1));
  const moveFrom = squareGetCoords(moveFromStr);
  const moveTo = squareGetCoords(moveToStr);
  if (pieces[moveTo[0]][moveTo[1]] !== ".") return true; // En passant

  if (pieces[moveFrom[0]][moveFrom[1]].toLowerCase() === "p") return moveFrom[1] !== moveTo[1];
  return false;
}

function afterChessgroundMove(orig, dest, metadata) {
  // Auto promote to queen for now
  let promotion = quickPromotionPiece.value;
  let i = 0;

  const move = orig.replace(":", "10") + dest.replace(":", "10");
  console.log(`${move}`);
  const capture = isCapture(board, move);

//UCI notation syntax: <begin_file><begin_rank><end_file><end_rank>[[+ | -] | piece_id ]
//"[+ | -]" is the promotion/demotion mark for this move. If missing, it means that the piece keeps its current status. This type is used for piece advance (shogi type promotion, can be demoted)
//"[piece_id]" is the character to refer to the piece type, e.g. q=queen, r=rook. This type is used for pawn promotion (chess type promotion, cannot be demoted)

  const legalmoves = board.legalMoves().trim().split(' ');  //This will set all possible moves (with promotion marks) at current in uci format into array
  let possiblepromotions = [];
  console.log(`${legalmoves}`);
  for (i = 0; i < legalmoves.length; i++) {  //Now look at each possible moves
    if (legalmoves[i].length == 0) {
      continue;
    }
    //if it is a legal promotion/demotion move that matches the move player has made (see the syntax of uci notation, which is given above)
    if ((move.trim() == legalmoves[i].trim().substring(0,move.trim().length)) && (legalmoves[i].trim().length == move.trim().length + 1)) {
      if ( /^[a-z+-]+$/.test(legalmoves[i].trim().charAt(move.trim().length)) ) {
        possiblepromotions.push(legalmoves[i].trim().charAt(move.trim().length));
      }
    //if it is legal to not promote/demote
    } else if (move.trim() == legalmoves[i].trim()) {
      possiblepromotions.push('=');  //we use = to represent that not promoting/demoting is legal
    }
  }
  console.log(`possible choice: ${possiblepromotions}`);
  let choice = null;
  if (quickPromotionPiece.value != "" && !metadata.ctrlKey && possiblepromotions.includes(promotion)) {
    choice = promotion;
    console.log(`Using quick promotion: ${promotion}`);
  } else if (possiblepromotions.length > 1) { //if there are more than one option
    while (true) {
      choice = prompt(`There are multiple chioces that you can keep/promote/demote your moved piece. They are\n${possiblepromotions}\n, where + means promote, - means demote, = means keep, letters mean target pawn promotion piece (e.g. q means pawn can promote to q piece which means queen in most times). Now please enter your choice: `,"");
      if (choice == null) {
        alert(`Bad input: <null>. You should enter exactly one character among ${possiblepromotions}.`);
        continue;
      }
      if (choice.length == 0 || choice.length >1) {
        alert(`Bad input: ${choice} . You should enter exactly one character among ${possiblepromotions}.`);
        continue;
      }
      if (possiblepromotions.includes(choice)) {
        break;
      } else {
        alert(`Bad input: ${choice} . You should enter exactly one character among ${possiblepromotions}.`);
        continue;
      }
    }
  } else if (possiblepromotions.length == 1) { //if there is only one option
    choice = possiblepromotions[0];
  } else {
    console.log("Did you make an illegal move? Why is there no legal action?");
  }
  console.log(`final choice: ${choice}`);

  if (choice == null) {
    promotion = "";
  } else if (choice == "=") {
    promotion = "";
  } else {
    promotion = choice;
  }

  if (!board.push(move + promotion)) {
    const foundmove = board.legalMoves().match(new RegExp(`${move}[^ ]+`));
    if (foundmove) board.push(foundmove[0]);
  }

  afterMove(capture);
}

function afterChessgroundDrop(piece, dest, metadata) {
  let promotion = quickPromotionPiece.value;
  let i = 0;

//When dropPromoted = true in variant.ini, FairyStockfish allows an unpromoted piece to be dropped in promoted form (not compulsory)
//Therefore, you need to consider about adding drop promoted piece function support.

//Moreover, if capturesToHand = true && dropLoop = true && pieceDemotion = true, then promoted piece will become advanced, not promoted form*.
//Lets give an example, suppose a rook can be promoted to chancellor (RN), when promoted it will be +R, which can be demoted.
//However, once captured, the opponent will get a true chancellor(C) piece, not the promoted rook(+R). The new piece(C) cannot be demoted.
//So, dropping piece does not have demotion features. pieceDemotion option does not affect drop promotion function.
//Pawns cannot be dropped in promoted status which they get it by reaching the promotion zone

//Piece drop notation are the same for uci and san. they are all [+]<piece id>@<file><rank>, e.g. Q@d2, +R@c4
//This means that the format is different from moving, as the promotion mark is at the beginning. Just making some small changes will solve this.
//The program logic is the same as moving.

  const role = piece.role;
  const move = util.dropOrigOf(role) + dest.replace(":", "10");
  console.log(`${move}`);

  const legalmoves = board.legalMoves().trim().split(' ');
  let possiblepromotions = [];
  console.log(`${legalmoves}`);
  for (i = 0; i < legalmoves.length; i++) {
    if (legalmoves[i].length == 0) {
      continue;
    }
    //if it is a legal promotion drop that matches the drop player has made
    if ((move.trim() == legalmoves[i].trim().substring(1,move.trim().length + 1)) && (legalmoves[i].trim().length == move.trim().length + 1)) {
      if ( /^[+-]+$/.test(legalmoves[i].trim().charAt(0)) ) {
        possiblepromotions.push(legalmoves[i].trim().charAt(0));
      }
    //if it is legal to not promote/demote
    } else if (move.trim() == legalmoves[i].trim()) {
      possiblepromotions.push('=');  //we use = to represent that not promoting is legal
    }
  }
  console.log(`possible choice: ${possiblepromotions}`);
  let choice = null;
  if (quickPromotionPiece.value != "" && !metadata.ctrlKey && possiblepromotions.includes(promotion)) {
    choice = promotion;
    console.log(`Using quick promotion: ${promotion}`);
  } else if (possiblepromotions.length > 1) { //if there are more than one option
    while (true) {
      choice = prompt(`There are multiple chioces that you can keep/promote your dropped piece. They are\n${possiblepromotions}\n, where + means promote, = means keep. Now please enter your choice: `,"");
      if (choice == null) {
        alert(`Bad input: <null>. You should enter exactly one character among ${possiblepromotions}.`);
        continue;
      }
      if (choice.length == 0 || choice.length >1) {
        alert(`Bad input: ${choice} . You should enter exactly one character among ${possiblepromotions}.`);
        continue;
      }
      if (possiblepromotions.includes(choice)) {
        break;
      } else {
        alert(`Bad input: ${choice} . You should enter exactly one character among ${possiblepromotions}.`);
        continue;
      }
    }
  } else if (possiblepromotions.length == 1) { //if there is only one option
    choice = possiblepromotions[0];
  } else {
    console.log("Did you make an illegal drop? Why is there no legal action?");
  }
  console.log(`final choice: ${choice}`);

  if (choice == null) {
    promotion = "";
  } else if (choice == "=") {
    promotion = "";
  } else {
    promotion = choice;
  }

  board.push(promotion + move);
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

function disableBoardMove() {
  chessground.set({
    movable: {
      color: undefined
    }
  });
}

function enableBoardMove() {
  chessground.set({
    movable: {
      color: getColorOrUndefined(board),
      dests: getDests(board)
    }
  });
}

function updateChessground() {
  const boardfenval = board.fen();
  currentboardfen.innerHTML = `Current Board FEN:  ${boardfenval}`;

  if (labelPgn) labelPgn.innerText = getPgn(board);
  if (labelStm) labelStm.innerText = getColorOrUndefined(board);
  chessground.set({
    fen: board.fen(),
    check: board.isCheck(),
    turnColor: getColor(board),
    movable: {
      color: getColorOrUndefined(board),
      dests: getDests(board)
    }
  });
  const moveStack = board.moveStack();

  if (moveStack.length === 0) {
    chessground.set({
      lastMove: undefined
    });
    buttonUndo.disabled = true;
  } else {
    const lastMove = moveStack.split(" ").pop();
    const lastMoveFrom = lastMove.substring(0, 2);
    const lastMoveTo = lastMove.substring(2, 4);
    chessground.set({
      lastMove: [lastMoveFrom, lastMoveTo]
    });
    buttonUndo.disabled = false;
  }
  if (board.isGameOver() || board.isGameOver(true) || board.isGameOver(false))
  {
    if (board.result() != "*") {
      gameResult.value = board.result();
    } else if (board.result(true) != "*") {
      gameResult.value = board.result(true);
    } else if (board.result(false) != "*") {
      gameResult.value = board.result(false);
    } else {
      gameResult.value = "Unterminated";
    }
    gameResult.click();
  }
}

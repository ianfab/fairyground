import { BoardComponent } from "./board_component.js";
import Module from "ffish-es6";

const boardEl = document.getElementById("board");
const pocketTopEl = document.getElementById("pocket-top");
const pocketBottomEl = document.getElementById("pocket-bottom");
const flipBtn = document.getElementById("flip-btn");
const variantsUpload = document.getElementById("variants-upload");

let boardComponent;
let ffish;
let board;

async function initGame() {
  try {
    const loadedModule = await new Module();
    ffish = loadedModule;
    window.ffish = ffish;
    console.log("ffish initialized");

    // Setup variants file upload
    const variantsUpload = document.getElementById("variants-upload");
    variantsUpload.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const iniText = e.target.result;
          ffish.loadVariantConfig(iniText);
          console.log("Loaded variant config");

          // Re-initialize board with the first variant from the file
          const variants = ffish.variants();
          if (variants.length > 0) {
            // Assume the last variant is the one we just loaded
            const newVariant = variants[variants.length - 1];
            console.log("Switching to variant:", newVariant);

            // We need to update the board container dimensions classes
            const oldDimensions = boardComponent.getDimensions();
            const container = document.getElementById("game-container");
            container.classList.remove(
              `board${oldDimensions.width}x${oldDimensions.height}`,
            );

            const result = boardComponent.initialize(
              newVariant,
              ffish,
              settings,
            );
            board = result.board;

            const newDimensions = boardComponent.getDimensions();
            container.classList.add(
              `board${newDimensions.width}x${newDimensions.height}`,
            );

            // Update pockets visibility
            const pocketTop = document.getElementById("pocket-top");
            const pocketBottom = document.getElementById("pocket-bottom");

            if (ffish.capturesToHand(newVariant)) {
              pocketTop.classList.add("pockets");
              pocketBottom.classList.add("pockets");
            } else {
              pocketTop.classList.remove("pockets");
              pocketBottom.classList.remove("pockets");
            }

            boardComponent.instance.set({
              movable: {
                dests: getDests(board),
              },
            });
          }
        };
        reader.readAsText(file);
      }
    });

    const variant = "chess";

    boardComponent = new BoardComponent({
      el: boardEl,
      container: document.getElementById("game-container"),
      pocketTop: pocketTopEl,
      pocketBottom: pocketBottomEl,
    });

    const settings = {
      isFischerRandom: false,
      showDests: true,
      clickClickMove: true,
      notation: 0,
      events: {
        after: (orig, dest, metadata) => {
          console.log("Move:", orig, dest, metadata);
          const move = orig + dest;
          board.push(move);
          const fen = board.fen();
          console.log("New FEN:", fen);
          boardComponent.instance.set({
            fen: fen,
            turnColor: board.turn() ? "white" : "black",
            check: board.isCheck(),
            lastMove: [orig, dest],
            movable: {
              color: board.turn() ? "white" : "black",
              dests: getDests(board),
            },
          });
        },
        afterNewPiece: (piece, dest, metadata) => {
          console.log("Drop:", piece, dest);
          const role = piece.role;
          const color = piece.color;
          const move = role + "@" + dest;
          board.push(move);
          const fen = board.fen();
          boardComponent.instance.set({
            fen: fen,
            turnColor: board.turn() ? "white" : "black",
            check: board.isCheck(),
            movable: {
              color: board.turn() ? "white" : "black",
              dests: getDests(board),
            },
          });
        },
        select: (key) => {
          console.log("Selected:", key);
        },
      },
    };

    const result = boardComponent.initialize(variant, ffish, settings);
    board = result.board;
    boardComponent.instance.set({
      movable: {
        dests: getDests(board),
      },
    });

    flipBtn.onclick = () => {
      boardComponent.instance.toggleOrientation();
    };
  } catch (e) {
    console.error("Game initialization failed:", e);
  }
}

function getDests(board) {
  const dests = new Map();
  const legalMoves = board.legalMoves();
  if (!legalMoves) return dests;
  const moves = legalMoves.split(" ");
  for (const move of moves) {
    if (!move) continue;
    let from, to;
    if (move.includes("@")) {
      const parts = move.split("@");
      // Hand drop moves are not handled in this simple dests logic for drag-from-square
      // But we need to handle them if we want to support drops.
      // Chessground handles drops via pocketRoles and drag-from-pocket.
      // Here we only care about on-board moves for `dests`.
      to = parts[1].substring(0, 2);
    } else {
      from = move.substring(0, 2);
      to = move.substring(2, 4);
    }

    if (from) {
      if (!dests.has(from)) dests.set(from, []);
      dests.get(from).push(to);
    }
  }
  return dests;
}

initGame();

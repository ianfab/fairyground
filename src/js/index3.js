import { BoardComponent } from "./board_component.js";
import Module from "ffish-es6";

// DOM elements
const uploadSection = document.getElementById("upload-section");
const variantSelector = document.getElementById("variant-selector");
const gameContainer = document.getElementById("game-container");
const variantsUpload = document.getElementById("variants-upload");
const variantDropdown = document.getElementById("variant-dropdown");
const startGameBtn = document.getElementById("start-game-btn");
const uploadStatus = document.getElementById("upload-status");
const boardEl = document.getElementById("board");
const pocketTopEl = document.getElementById("pocket-top");
const pocketBottomEl = document.getElementById("pocket-bottom");
const flipBtn = document.getElementById("flip-btn");
const resetBtn = document.getElementById("reset-btn");
const newVariantBtn = document.getElementById("new-variant-btn");
const variantNameEl = document.getElementById("variant-name");
const turnIndicatorEl = document.getElementById("turn-indicator");
const gameStatusEl = document.getElementById("game-status");

// Chat elements
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let boardComponent;
let ffish;
let board;
let currentVariant = null;
let engine = null;
let engineThinking = false;
let ws = null;
let wsConnected = false;

// Fairy-Stockfish configuration specification
const FAIRY_STOCKFISH_SPEC = `
### Variant configuration:
The variant name needs to be specified as a section in square brackets,
followed by its rule configurations as key-value pairs as described below.

### Inheritance
If a variant is similar to a previously defined variant, inheritance can be used to simplify the definition.
To inherit from the configuration of an existing variant, specify the parent variant after the child variant name
separated by a colon, e.g., [gothic:capablanca]. When inheritance is used, only the differences to the parent variant
need to be defined. When no inheritance is used, the default template applies, which is basically standard chess but
without any predefined pieces.

### Piece types
Firstly, the piece types for a variant need to be defined. For that, specify the letter used for each piece type, e.g.: pawn = p

Available predefined piece types (with Betza notation):
- pawn (fmWfceF), knight (N), bishop (B), rook (R), queen (Q), fers (F), alfil (A), fersAlfil (FA)
- silver (FfW), aiwok (RNF), bers (RF), archbishop (BN), chancellor (RN), amazon (QN)
- knibis (mNcB), biskni (mBcN), kniroo (mNcR), rookni (mRcN)
- shogiPawn (fW), lance (fR), shogiKnight (fN), gold (WfF), dragonHorse (BW)
- clobber (cW), breakthrough (fmWfF), immobile ()
- cannon (mRcpR), janggiCannon (pR), soldier (fsW), horse (nN), elephant (nA), janggiElephant (nZ)
- banner (RcpRnN), wazir (W), commoner (K), centaur (KN), king (K)

### Custom pieces
Custom pieces can be defined using slots: customPiece1, customPiece2, ..., customPiece25
Example: customPiece1 = p:mfWcfF (pawn without double steps)

Custom king: king = k:KN (king moves like centaur)

Betza notation supported features:
- All base moves/atoms (W, F, etc.)
- All directional modifiers (f, b, etc.)
- Limited and unlimited distance sliders/riders for W/R, F/B, and N directions
- Hoppers and grasshoppers: pR, pB, gR, gB
- Lame leapers (n) for N, A, Z, D directions: nN, nA, nZ, nD

### Piece values
Override piece values: pieceValueMg = p:150 n:800, pieceValueEg = p:200 n:900
Reference: rook has pieceValueMg = r:1276, pieceValueEg = r:1380

### Option types
[bool] true/false, [Rank] 1-10, [File] 1-12 or a-i, [int] 0,1,...
[PieceType] single piece letter, [PieceSet] multiple piece letters (e.g., nbrq)
[Bitboard] list of squares (e.g., d4 e4 d5 e5). Use * as wildcard (e.g., *1 = first rank)
[Value] win/loss/draw

### Key Rule Options (defaults in parentheses):
# Board
maxRank (8), maxFile (8), chess960 (false), startFen (standard chess position)

# Pieces
pawn = p, knight = n, bishop = b, rook = r, queen = q, king = k

# Promotion
promotionRegionWhite (*8), promotionRegionBlack (*1)
promotionPieceTypes (nbrq), mandatoryPawnPromotion (true)
promotedPieceType (e.g., p:g s:g for shogi), pieceDemotion (false)

# Castling
castling (true), castlingKingsideFile (g), castlingQueensideFile (c)
castlingKingPiece (k), castlingRookPieces (r)

# Pawn moves
doubleStep (true), doubleStepRegionWhite (*2), doubleStepRegionBlack (*7)
tripleStepRegionWhite (-), tripleStepRegionBlack (-)
enPassantRegion (AllSquares)

# Drops
pieceDrops (false), capturesToHand (false), dropLoop (false)
firstRankPawnDrops (false), promotionZonePawnDrops (false)
dropNoDoubled (-), sittuyinRookDrop (false)

# Special rules
blastOnCapture (false), blastImmuneTypes (none)
mustCapture (false), checking (true), dropChecks (true)
gating (false), seirawanGating (false), wallingRule (none)
pass (false), passOnStalemate (false)

# Win conditions
stalemateValue (draw), checkmateValue (loss)
extinctionValue (none), extinctionPieceTypes ()
checkCounting (false), connectN (0), flagPiece (*), flagRegion ()
materialCounting (none), countingRule (none)

# Draw rules
nMoveRule (50), nFoldRule (3), nFoldValue (draw)
perpetualCheckIllegal (false), chasingRule (none)

### Common Examples:
[atomic:chess]
blastOnCapture = true

[crazyhouse:chess]
pieceDrops = true
capturesToHand = true

[horde:chess]
startFen = rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1

[3check:chess]
checkCounting = true
`;

// Chat Functions
function addChatMessage(content, type = "assistant") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${type}`;
  messageDiv.textContent = content;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function callClaudeAPI(userMessage) {
  const systemPrompt = `You are an expert at creating chess variant configurations for Fairy-Stockfish. When a user describes a chess variant they want to play, you generate the complete .ini configuration file for it.

IMPORTANT RULES:
1. Always wrap the configuration in a code block
2. The variant name should be descriptive and match what the user requested
3. Include all necessary piece definitions, board dimensions, and rules
4. Use inheritance from standard chess when possible (e.g., [variantname:chess])
5. Test your logic carefully - make sure rules don't contradict
6. Include comments to explain custom rules

Here is the complete specification for Fairy-Stockfish variant configurations:

${FAIRY_STOCKFISH_SPEC}

Generate a complete, working .ini configuration file based on the user's request.`;

  // Call proxy on port 5015 (server.js must be running)
  const response = await fetch("http://localhost:5015/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: userMessage,
      systemPrompt: systemPrompt,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "API request failed");
  }

  const data = await response.json();
  return data.content[0].text;
}

function extractIniConfig(response) {
  // Extract .ini configuration from code blocks
  const codeBlockMatch = response.match(/```(?:ini)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // If no code block, look for [variant-name] pattern
  const iniMatch = response.match(/\[[\w-]+(?::[\w-]+)?\][\s\S]*/);
  if (iniMatch) {
    return iniMatch[0].trim();
  }

  return null;
}

function loadVariantFromConfig(iniText) {
  try {
    // Parse variant name from .ini file
    const variantNameMatch = iniText.match(/^\[([^:\]]+)/m);
    const parsedVariantName = variantNameMatch
      ? variantNameMatch[1].toLowerCase()
      : null;
    console.log("Parsed variant name from .ini:", parsedVariantName);

    ffish.loadVariantConfig(iniText);
    console.log("Loaded variant config");

    // Get all available variants
    const variantsString = ffish.variants();
    console.log("Available variants:", variantsString);

    const variants = variantsString.split(" ").filter((v) => v.length > 0);

    if (variants.length === 0) {
      throw new Error("No variants found in configuration");
    }

    // Populate dropdown with variants
    variantDropdown.innerHTML =
      '<option value="">-- Select a variant --</option>';
    variants.forEach((variant) => {
      const option = document.createElement("option");
      option.value = variant;
      option.textContent = variant;
      variantDropdown.appendChild(option);
    });

    // Try to auto-select variant matching the parsed name from .ini
    if (parsedVariantName) {
      const matchingVariant = variants.find(
        (v) => v.toLowerCase() === parsedVariantName,
      );
      if (matchingVariant) {
        variantDropdown.value = matchingVariant;
        currentVariant = matchingVariant;
        startGameBtn.disabled = false;
        showMessage(
          uploadStatus,
          `Loaded ${matchingVariant} - click Start Game!`,
        );

        // Show variant selector
        variantSelector.style.display = "flex";

        return matchingVariant;
      }
    }

    showMessage(
      uploadStatus,
      `Successfully loaded ${variants.length} variant(s)!`,
    );
    variantSelector.style.display = "flex";

    return variants[0];
  } catch (error) {
    console.error("Failed to load variant:", error);
    throw error;
  }
}

// WebSocket and Engine functions
function connectWebSocket() {
  return new Promise((resolve, reject) => {
    try {
      ws = new WebSocket("ws://localhost:5016");

      let connectionHandshakeComplete = false;
      let verificationCode = Math.random().toString(36).substring(7);

      ws.onopen = () => {
        console.log("WebSocket opened, starting handshake...");
        // Send CONNECT message with verification code
        ws.send(`CONNECT\x10${verificationCode}`);
      };

      ws.onmessage = (event) => {
        console.log("WS received:", event.data);

        if (!connectionHandshakeComplete) {
          // Check if server echoed back our verification code
          if (event.data === verificationCode) {
            console.log("Verification code received, sending READYOK");
            ws.send("READYOK");
            connectionHandshakeComplete = true;
            wsConnected = true;
            console.log("WebSocket handshake complete");
            resolve(ws);
          }
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        wsConnected = false;
        reject(error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        wsConnected = false;
        connectionHandshakeComplete = false;
      };
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
      reject(e);
    }
  });
}

function initEngine() {
  return new Promise((resolve, reject) => {
    if (!wsConnected || !ws) {
      console.error("WebSocket not connected");
      reject(new Error("WebSocket not connected"));
      return;
    }

    if (!window.fairyground || !window.fairyground.BinaryEngineFeature) {
      console.error("BinaryEngineFeature not loaded");
      reject(new Error("BinaryEngineFeature not loaded"));
      return;
    }

    const BinaryEngineFeature = window.fairyground.BinaryEngineFeature;

    // Check if analysis engine already exists
    if (BinaryEngineFeature.analysis_engine) {
      engine = BinaryEngineFeature.analysis_engine;
      console.log("Using existing analysis engine");
      engine.ChangeVariant(currentVariant, false);
      resolve();
      return;
    }

    // Create new engine with WebSocket connection
    try {
      console.log("Creating analysis engine with WebSocket...");
      const engineObj = new Engine(
        "analysis-engine",
        "lib/stockfish.js",
        "./",
        "UCI",
        [],
        "ANALYSIS",
        15000,
        ws,
      );

      BinaryEngineFeature.analysis_engine = engineObj;
      engine = engineObj;
      console.log("Engine created, now loading...");

      // Set up engine callbacks BEFORE loading
      engine.LoadFinishCallBack = () => {
        console.log("✓ Engine loaded successfully!");
        console.log("Engine name:", engine.Name);
        console.log("Supported variants:", engine.Variants);
        console.log("Engine IsLoaded:", engine.IsLoaded);
        engine.IsUsing = true;
        console.log("Set IsUsing = true");
        engine.SetVariant(currentVariant, false);
        console.log("Variant set to:", currentVariant);
        resolve(); // Resolve the promise when engine is loaded
      };

      engine.LoadFailureCallBack = () => {
        console.error("✗ Engine failed to load");
        engine = null;
        reject(new Error("Engine failed to load"));
      };

      // Load the engine
      engine.Load(
        () => console.log("Load callback fired"),
        () => console.error("Load failure callback fired"),
      );
    } catch (e) {
      console.error("Failed to create engine:", e);
      reject(e);
    }
  });
}

function makeEngineMove() {
  console.log("makeEngineMove called");
  console.log("- board:", !!board);
  console.log("- game over:", board ? board.isGameOver() : "N/A");
  console.log("- engineThinking:", engineThinking);
  console.log("- engine:", !!engine);
  console.log("- engine.IsLoaded:", engine ? engine.IsLoaded : "N/A");

  if (
    !board ||
    board.isGameOver() ||
    engineThinking ||
    !engine ||
    !engine.IsLoaded
  ) {
    console.log("→ Skipping engine move (conditions not met)");
    return;
  }

  engineThinking = true;
  gameStatusEl.textContent = "Engine thinking...";

  console.log("→ Engine will think for variant:", currentVariant);

  // Get current position and moves
  const fen = board.fen();
  const moveStack = board.moveStack();
  const moves = moveStack
    ? moveStack
        .split(" ")
        .filter((m) => m)
        .join(" ")
    : "";
  const currentPlayer = board.turn() ? "WHITE" : "BLACK";

  // Set up position
  engine.NewGame();
  engine.SetVariant(currentVariant, false);

  if (moves) {
    engine.SetPosition(fen, moves, 8, 8);
  }

  // Set up callback for when engine finishes
  const originalCallback = engine.SendMessageCallBack;
  engine.SendMessageCallBack = (message) => {
    if (originalCallback) originalCallback(message);

    if (message.startsWith("bestmove")) {
      const match = message.match(/bestmove\s+(\S+)/);
      if (match && !board.isGameOver()) {
        const bestMove = match[1];
        console.log("Engine plays:", bestMove);

        try {
          board.push(bestMove);
          const newFen = board.fen();

          boardComponent.instance.set({
            fen: newFen,
            turnColor: board.turn() ? "white" : "black",
            check: board.isCheck(),
            lastMove:
              bestMove.length >= 4
                ? [bestMove.substring(0, 2), bestMove.substring(2, 4)]
                : undefined,
            movable: {
              color: board.turn() ? "white" : "black",
              dests: getDests(board),
            },
          });

          updateGameInfo();
        } catch (e) {
          console.error("Engine move failed:", e);
          gameStatusEl.textContent = "Engine move failed";
        }
      }

      engineThinking = false;
      engine.SendMessageCallBack = originalCallback;
    }
  };

  // Start thinking (movetime = 1000ms)
  engine.StartThinking(
    currentPlayer,
    false, // IsInfinite
    false, // IsAdvancedTimeControl
    false, // IsPonder
    false, // IsPonderHit
    false, // IsByoyomi
    0, // Depth (0 = no depth limit)
    1000, // MoveTime (1 second)
    0, // Nodes (0 = no node limit)
    0, // WhiteRemainingTime
    0, // WhiteTimeGain
    0, // BlackRemainingTime
    0, // BlackTimeGain
    0, // ByoyomiPeriodLength
  );
}

// Utility functions
function showMessage(element, message, isError = false) {
  element.innerHTML = `<div class="${isError ? "error-message" : "status-message"}">${message}</div>`;
}

function clearMessage(element) {
  element.innerHTML = "";
}

function updateGameInfo() {
  if (!board) return;

  const turn = board.turn() ? "white" : "black";
  const turnText = turn.charAt(0).toUpperCase() + turn.slice(1);
  turnIndicatorEl.textContent = `${turnText} to move`;

  if (board.isGameOver()) {
    const result = board.result();
    gameStatusEl.textContent = `Game Over: ${result}`;
  } else if (board.isCheck()) {
    gameStatusEl.textContent = "Check!";
  } else {
    gameStatusEl.textContent = "";
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
      // Hand drop moves
      const parts = move.split("@");
      to = parts[1].substring(0, 2);
      // Skip drops in dests (handled by pocketRoles)
      continue;
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

function initializeBoard(variant) {
  const settings = {
    isFischerRandom: false,
    showDests: true,
    clickClickMove: true,
    notation: 0,
    events: {
      after: (orig, dest, metadata) => {
        console.log("Move:", orig, dest, metadata);
        const move = orig + dest + (metadata?.promotion || "");

        try {
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

          updateGameInfo();

          // Engine disabled - no AI opponent
          // setTimeout(() => makeEngineMove(), 100);
        } catch (e) {
          console.error("Move failed:", e);
          // Reset to current position
          boardComponent.instance.set({
            fen: board.fen(),
          });
        }
      },
      afterNewPiece: (piece, dest, metadata) => {
        console.log("Drop:", piece, dest);
        const role = piece.role;
        const color = piece.color;
        const pieceChar = role.charAt(0).toUpperCase();
        const move = pieceChar + "@" + dest;

        try {
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

          updateGameInfo();

          // Engine disabled - no AI opponent
          // setTimeout(() => makeEngineMove(), 100);
        } catch (e) {
          console.error("Drop failed:", e);
          boardComponent.instance.set({
            fen: board.fen(),
          });
        }
      },
      select: (key) => {
        console.log("Selected:", key);
      },
    },
  };

  if (!boardComponent) {
    boardComponent = new BoardComponent({
      el: boardEl,
      container: gameContainer,
      pocketTop: pocketTopEl,
      pocketBottom: pocketBottomEl,
    });
  }

  const result = boardComponent.initialize(variant, ffish, settings);
  board = result.board;

  boardComponent.instance.set({
    movable: {
      dests: getDests(board),
    },
  });

  // Update board size classes
  const dimensions = boardComponent.getDimensions();
  gameContainer.className = `default blueboard board${dimensions.width}x${dimensions.height}`;

  // Update pocket visibility
  if (ffish.capturesToHand(variant)) {
    pocketTopEl.style.display = "flex";
    pocketBottomEl.style.display = "flex";
  } else {
    pocketTopEl.style.display = "none";
    pocketBottomEl.style.display = "none";
  }

  variantNameEl.textContent = variant;
  updateGameInfo();
}

// Step 1: Initialize ffish and wait for variant upload
async function initApp() {
  try {
    const loadedModule = await new Module();
    ffish = loadedModule;
    window.ffish = ffish;
    console.log("ffish initialized");

    showMessage(uploadStatus, "Ready to load variants!");
  } catch (e) {
    console.error("Failed to initialize ffish:", e);
    showMessage(uploadStatus, "Failed to initialize chess engine", true);
  }
}

// Step 2: Handle variant file upload
variantsUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  clearMessage(uploadStatus);
  showMessage(uploadStatus, "Loading variants...");

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const iniText = e.target.result;

      // Parse variant name from .ini file (look for [variant-name] or [variant-name:parent])
      const variantNameMatch = iniText.match(/^\[([^:\]]+)/m);
      const parsedVariantName = variantNameMatch
        ? variantNameMatch[1].toLowerCase()
        : null;
      console.log("Parsed variant name from .ini:", parsedVariantName);

      ffish.loadVariantConfig(iniText);

      console.log("Loaded variant config");

      // Get all available variants (returns a space-separated string)
      const variantsString = ffish.variants();
      console.log("Available variants:", variantsString);

      // Convert string to array and filter empty strings
      const variants = variantsString.split(" ").filter((v) => v.length > 0);

      if (variants.length === 0) {
        showMessage(uploadStatus, "No variants found in file", true);
        return;
      }

      // Populate dropdown with variants
      variantDropdown.innerHTML =
        '<option value="">-- Select a variant --</option>';
      variants.forEach((variant) => {
        const option = document.createElement("option");
        option.value = variant;
        option.textContent = variant;
        variantDropdown.appendChild(option);
      });

      // Try to auto-select variant matching the parsed name from .ini
      if (parsedVariantName) {
        const matchingVariant = variants.find(
          (v) => v.toLowerCase() === parsedVariantName,
        );
        if (matchingVariant) {
          variantDropdown.value = matchingVariant;
          currentVariant = matchingVariant;
          startGameBtn.disabled = false;
          showMessage(
            uploadStatus,
            `Loaded ${matchingVariant} - click Start Game!`,
          );
        } else {
          showMessage(
            uploadStatus,
            `Successfully loaded ${variants.length} variant(s)!`,
          );
        }
      } else {
        showMessage(
          uploadStatus,
          `Successfully loaded ${variants.length} variant(s)!`,
        );
      }

      // Show variant selector
      variantSelector.style.display = "flex";
    } catch (error) {
      console.error("Failed to load variants:", error);
      showMessage(
        uploadStatus,
        `Error loading variants: ${error.message}`,
        true,
      );
    }
  };

  reader.onerror = () => {
    showMessage(uploadStatus, "Failed to read file", true);
  };

  reader.readAsText(file);
});

// Step 3: Handle variant selection
variantDropdown.addEventListener("change", (e) => {
  const selectedVariant = e.target.value;
  startGameBtn.disabled = !selectedVariant;
  currentVariant = selectedVariant;
});

// Step 4: Start the game
startGameBtn.addEventListener("click", async () => {
  if (!currentVariant) return;

  try {
    console.log("Starting game with variant:", currentVariant);

    // Engine disabled for now - can add later if needed
    console.log("Engine support not enabled");

    // Initialize board
    initializeBoard(currentVariant);

    // Hide upload and selector, show game
    uploadSection.style.display = "none";
    variantSelector.style.display = "none";
    gameContainer.classList.add("active");
  } catch (e) {
    console.error("Failed to start game:", e);
    alert(`Failed to start game: ${e.message}`);
  }
});

// Game controls
flipBtn.addEventListener("click", () => {
  if (boardComponent && boardComponent.instance) {
    boardComponent.instance.toggleOrientation();
  }
});

resetBtn.addEventListener("click", () => {
  if (currentVariant && ffish) {
    initializeBoard(currentVariant);
  }
});

newVariantBtn.addEventListener("click", () => {
  // Reset to upload screen
  gameContainer.classList.remove("active");
  uploadSection.style.display = "flex";
  variantSelector.style.display = "flex";

  // Clear file input
  variantsUpload.value = "";
  variantDropdown.value = "";
  startGameBtn.disabled = true;
  currentVariant = null;

  clearMessage(uploadStatus);
});

// Chat event handlers
sendBtn.addEventListener("click", async () => {
  const userMessage = chatInput.value.trim();

  if (!userMessage) {
    return;
  }

  // Add user message to chat
  addChatMessage(userMessage, "user");
  chatInput.value = "";

  // Disable send button while processing
  sendBtn.disabled = true;
  sendBtn.textContent = "Generating...";

  try {
    // Call Claude API
    const response = await callClaudeAPI(userMessage);
    console.log("Claude response:", response);

    // Add assistant response to chat
    addChatMessage(response, "assistant");

    // Extract and load the .ini configuration
    const iniConfig = extractIniConfig(response);

    if (iniConfig) {
      console.log("Extracted config:", iniConfig);

      // Load the variant configuration
      const variantName = loadVariantFromConfig(iniConfig);

      addChatMessage(
        `✓ Successfully loaded variant: ${variantName}. Click "Start Game" to play!`,
        "assistant",
      );
    } else {
      addChatMessage(
        "I generated a response but couldn't find a valid .ini configuration. Please try rephrasing your request.",
        "error",
      );
    }
  } catch (error) {
    console.error("Chat error:", error);
    addChatMessage(`Error: ${error.message}`, "error");
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});

// Allow Enter to send (Shift+Enter for new line)
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// Initialize the app
initApp();

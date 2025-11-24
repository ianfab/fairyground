import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

// State Schema - This is synchronized with all clients
export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") color: string = ""; // "white" or "black"
  @type("number") rating: number = 1500;
  @type("boolean") ready: boolean = false;
  @type("number") timeRemaining: number = 600000; // 10 minutes in ms
}

export class ChessVariantState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") variant: string = "chess";
  @type("string") fen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  @type("string") currentTurn: string = "white";
  @type(["string"]) moveHistory: string[] = [];
  @type("string") gameStatus: string = "waiting"; // "waiting", "active", "finished"
  @type("string") winner: string = "";
  @type("string") gameMode: string = "casual"; // "casual", "ranked", "matchmaking"
  @type("number") startTime: number = 0;
  @type("boolean") isPaused: boolean = false;
}

interface RoomOptions {
  variant?: string;
  mode?: string;
  timeControl?: number;
  isPrivate?: boolean;
}

export class ChessVariantRoom extends Room<ChessVariantState> {
  maxClients = 2;
  private tickInterval?: NodeJS.Timeout;
  private roomOptions: RoomOptions = {};

  onCreate(options: RoomOptions) {
    console.log("ChessVariantRoom created!", options);
    
    this.roomOptions = options;
    this.setState(new ChessVariantState());

    // Set initial state based on options
    if (options.variant) {
      this.state.variant = options.variant;
      this.initializeVariant(options.variant);
    }

    if (options.mode) {
      this.state.gameMode = options.mode;
    }

    // Set room metadata for matchmaking
    this.setMetadata({
      variant: options.variant || "chess",
      mode: options.mode || "casual",
      isPrivate: options.isPrivate || false,
    });

    // Handle player messages
    this.onMessage("move", (client, message) => {
      this.handleMove(client, message);
    });

    this.onMessage("ready", (client) => {
      this.handlePlayerReady(client);
    });

    this.onMessage("chat", (client, message) => {
      this.handleChat(client, message);
    });

    this.onMessage("resign", (client) => {
      this.handleResign(client);
    });

    this.onMessage("draw_offer", (client) => {
      this.handleDrawOffer(client);
    });

    this.onMessage("draw_accept", (client) => {
      this.handleDrawAccept(client);
    });

    // Set up clock tick (every 100ms)
    this.setClockInterval();

    // Auto-dispose empty room after 5 minutes
    this.autoDispose = true;
  }

  onJoin(client: Client, options: { name?: string; rating?: number }) {
    console.log(client.sessionId, "joined!", options);

    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;
    player.rating = options.rating || 1500;

    // Assign color based on number of players
    if (this.state.players.size === 0) {
      player.color = "white";
    } else if (this.state.players.size === 1) {
      player.color = "black";
    }

    this.state.players.set(client.sessionId, player);

    // Start game if we have 2 players
    if (this.state.players.size === 2) {
      this.checkGameStart();
    }

    // Broadcast player joined
    this.broadcast("player_joined", {
      playerId: client.sessionId,
      playerCount: this.state.players.size,
    });
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!", consented);

    const player = this.state.players.get(client.sessionId);

    if (player) {
      // Allow reconnection for 60 seconds
      try {
        if (!consented) {
          await this.allowReconnection(client, 60);
          console.log(client.sessionId, "reconnected!");
          return;
        }
      } catch (e) {
        console.log(client.sessionId, "failed to reconnect");
      }

      // If game is active and player left, opponent wins
      if (this.state.gameStatus === "active") {
        const opponent = Array.from(this.state.players.values()).find(
          (p) => p.id !== client.sessionId
        );
        if (opponent) {
          this.state.winner = opponent.color;
          this.state.gameStatus = "finished";
          this.broadcast("game_over", {
            winner: opponent.color,
            reason: "opponent_left",
          });
        }
      }

      this.state.players.delete(client.sessionId);
    }

    this.broadcast("player_left", {
      playerId: client.sessionId,
      playerCount: this.state.players.size,
    });
  }

  onDispose() {
    console.log("ChessVariantRoom disposed!");
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }

  private initializeVariant(variant: string) {
    // Initialize FEN based on variant
    // For now, using standard chess FEN. In production, use ffish-es6 for variants
    switch (variant.toLowerCase()) {
      case "chess":
        this.state.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        break;
      case "chess960":
        // Generate random Chess960 starting position
        this.state.fen = this.generateChess960Position();
        break;
      case "3check":
      case "atomic":
      case "crazyhouse":
      case "kingofthehill":
        // These variants start with standard chess position
        this.state.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        break;
      default:
        this.state.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }
  }

  private generateChess960Position(): string {
    // Simplified Chess960 position generator
    // In production, use proper Scharnagl number generation
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }

  private checkGameStart() {
    // Check if all players are ready
    const allReady = Array.from(this.state.players.values()).every(
      (p) => p.ready
    );

    if (allReady && this.state.players.size === 2) {
      this.state.gameStatus = "active";
      this.state.startTime = Date.now();
      this.broadcast("game_start", {
        variant: this.state.variant,
        fen: this.state.fen,
      });
    }
  }

  private handlePlayerReady(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.ready = true;
      this.checkGameStart();
    }
  }

  private handleMove(client: Client, message: { from: string; to: string; promotion?: string }) {
    // Validate it's the player's turn
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (this.state.gameStatus !== "active") {
      client.send("error", { message: "Game is not active" });
      return;
    }

    if (player.color !== this.state.currentTurn) {
      client.send("error", { message: "Not your turn" });
      return;
    }

    // In production, validate move with ffish-es6
    // For now, we'll accept all moves and just switch turns
    const moveNotation = `${message.from}${message.to}${message.promotion || ""}`;
    this.state.moveHistory.push(moveNotation);

    // Switch turn
    this.state.currentTurn = this.state.currentTurn === "white" ? "black" : "white";

    // Broadcast move to all clients
    this.broadcast("move_made", {
      from: message.from,
      to: message.to,
      promotion: message.promotion,
      player: player.color,
    });

    // Check for game over conditions (simplified)
    // In production, use ffish-es6 to check for checkmate, stalemate, etc.
    if (this.state.moveHistory.length > 100) {
      this.state.gameStatus = "finished";
      this.broadcast("game_over", {
        result: "draw",
        reason: "move_limit",
      });
    }
  }

  private handleChat(client: Client, message: { text: string }) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Broadcast chat message
    this.broadcast("chat_message", {
      playerId: client.sessionId,
      playerName: player.name,
      text: message.text,
      timestamp: Date.now(),
    });
  }

  private handleResign(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (this.state.gameStatus !== "active") return;

    // Find opponent
    const opponent = Array.from(this.state.players.values()).find(
      (p) => p.id !== client.sessionId
    );

    if (opponent) {
      this.state.winner = opponent.color;
      this.state.gameStatus = "finished";
      this.broadcast("game_over", {
        winner: opponent.color,
        reason: "resignation",
      });
    }
  }

  private handleDrawOffer(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Find opponent
    const opponent = Array.from(this.state.players.values()).find(
      (p) => p.id !== client.sessionId
    );

    if (opponent) {
      // Send draw offer to opponent
      const opponentClient = Array.from(this.clients).find(
        (c) => c.sessionId === opponent.id
      );
      if (opponentClient) {
        opponentClient.send("draw_offered", {
          from: player.name,
        });
      }
    }
  }

  private handleDrawAccept(client: Client) {
    if (this.state.gameStatus !== "active") return;

    this.state.gameStatus = "finished";
    this.broadcast("game_over", {
      result: "draw",
      reason: "agreement",
    });
  }

  private setClockInterval() {
    // Update clocks every 100ms
    this.tickInterval = setInterval(() => {
      if (this.state.gameStatus !== "active" || this.state.isPaused) {
        return;
      }

      // Decrement time for current player
      const currentPlayer = Array.from(this.state.players.values()).find(
        (p) => p.color === this.state.currentTurn
      );

      if (currentPlayer && currentPlayer.timeRemaining > 0) {
        currentPlayer.timeRemaining -= 100;

        // Check for time out
        if (currentPlayer.timeRemaining <= 0) {
          currentPlayer.timeRemaining = 0;
          const opponent = Array.from(this.state.players.values()).find(
            (p) => p.id !== currentPlayer.id
          );
          if (opponent) {
            this.state.winner = opponent.color;
            this.state.gameStatus = "finished";
            this.broadcast("game_over", {
              winner: opponent.color,
              reason: "timeout",
            });
          }
        }
      }
    }, 100);
  }
}


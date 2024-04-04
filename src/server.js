const fs = require("fs");
const express = require("express");
const app = express();
const WebSocket = require("ws");
const { spawn } = require("child_process");
const os = require("os");
const WebSocketServer = WebSocket.Server;
let port = 5015;

console.log("============================================");
console.log("             SECURITY WARNING");
console.log("============================================");
console.log(
  "This backend does not check the input from the frontend. The client user can enter anything as the command, which can pose threat to your server security. Therefore you should only allow trusted users to connect.\n\n",
);

app.use(function (req, res, next) {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use("/public", express.static("public"));

app.all("/", function (req, res) {
  console.log("[HTTP Server] Redirect to index page.");
  res.redirect("/public/index.html");
});

const httpserver = app.listen(port, function () {
  let host = httpserver.address().address;
  let port = httpserver.address().port;
  console.log("=======================================");
  console.log("          FairyGround  Server");
  console.log("=======================================");
  console.log("This is the back end of FairyGround, acting as a server.");
  console.log(
    "To open FairyGround UI, open your browser and go to the following URL:",
  );
  console.log(`http://localhost:${port}`);
  console.log(
    "Closing this window will close FairyGround. Pages opened in your browser won't work then.\n",
  );
  console.log("[HTTP Server] Server is up at http://localhost:%s", port);
});

const LoadEngineTimeout = 15000;
const EngineProtocols = ["UCI", "USI", "UCCI", "UCI_CYCLONE"];

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

const wss = new WebSocketServer({ port: port + 1 }, () => {
  console.log("[WebSocket Server] Server is up at ws://localhost:%s", port + 1);
});

var ClientEngines = new Map();
var ConnectingClients = new Set();
var ConnectedClients = new Set();
const PathLevelSeperatorMatcher = new RegExp("\\\\|/", "");
const MessageSplitter = new RegExp("(?<!\\\\)\\|", "");

function GetWorkingDirectoryFromExcutablePath(path) {
  if (typeof path != "string") {
    throw TypeError();
  }
  let levels = path.split(PathLevelSeperatorMatcher);
  levels = levels.slice(0, -1);
  if (os.type == "Windows_NT") {
    return levels.join("\\");
  } else {
    return levels.join("/");
  }
}

function ProtocolInitializationCommand(protocol) {
  if (typeof protocol != "string") {
    throw TypeError();
  }
  if (protocol == "UCI" || protocol == "UCI_CYCLONE") {
    return "uci";
  } else if (protocol == "USI") {
    return "usi";
  } else if (protocol == "UCCI") {
    return "ucci";
  }
  return null;
}

function ReadFile(filepath) {
  let result = "";
  if (fs.existsSync(filepath)) {
    result = fs.readFileSync(filepath, "utf-8").replace(/\r\n|\r/g, "\n");
  } else {
    console.warn(
      `[WebSocket Server] ${filepath} does not exist. Creating one...`,
    );
    fs.writeFile(filepath, "", (writeErr) => {
      if (writeErr) {
        console.error("[WebSocket Server] Error writing file: ", writeErr);
        return;
      }
      console.log("[WebSocket Server] File created!");
    });
  }
  return result;
}

function WriteFile(filepath, content) {
  fs.writeFile(filepath, content, (writeErr) => {
    if (writeErr) {
      console.error("[WebSocket Server] Error writing file: ", writeErr);
      return;
    }
    console.log("[WebSocket Server] File written!");
  });
}

class Engine {
  constructor(
    ID,
    Command,
    WorkingDirectory,
    Protocol,
    Options,
    Color,
    LoadTimeOut,
    WebSocketConnection,
  ) {
    if (
      typeof ID != "string" ||
      typeof Command != "string" ||
      typeof WorkingDirectory != "string" ||
      typeof Protocol != "string" ||
      !Array.isArray(Options) ||
      typeof Color != "string" ||
      typeof LoadTimeOut != "number" ||
      !WebSocket.prototype.isPrototypeOf(WebSocketConnection)
    ) {
      throw TypeError();
    }
    if (WebSocketConnection.readyState != WebSocketConnection.OPEN) {
      throw Error("WebSocket connection error");
    }
    this.ID = ID.replace("|", "\\|");
    this.Command = Command.replace("|", "\\|");
    this.WorkingDirectory = WorkingDirectory.replace("|", "\\|");
    if (WorkingDirectory == "") {
      this.WorkingDirectory = GetWorkingDirectoryFromExcutablePath(Command);
    }
    this.Protocol = Protocol.replace("|", "\\|");
    this.Options = Options;
    this.Color = Color.replace("|", "\\|");
    this.IsLoading = false;
    this.IsLoaded = false;
    this.Process = null;
    this.WebSocketConnection = WebSocketConnection;
    this.Status = "NOT_LOADED";
    this.LoadTimeOut = LoadTimeOut;
    if (LoadTimeOut <= 0) {
      this.LoadTimeOut = LoadEngineTimeout;
    }
    this.LoadFinishCallBack = undefined;
    this.LoadFailureCallBack = undefined;
    this.WebSocketOnMessageHandlerBinded =
      this.WebSocketOnMessageHandler.bind(this);
    this.WebSocketOnSocketInvlalidHandlerBinded =
      this.WebSocketOnSocketInvlalidHandler.bind(this);
    this.WebSocketConnection.addEventListener(
      "message",
      this.WebSocketOnMessageHandlerBinded,
    );
    this.WebSocketConnection.addEventListener(
      "close",
      this.WebSocketOnSocketInvlalidHandlerBinded,
    );
    this.WebSocketConnection.addEventListener(
      "error",
      this.WebSocketOnSocketInvlalidHandlerBinded,
    );
  }

  destructor() {
    this.IsUsing = false;
    this.IsLoaded = false;
    this.IsLoading = false;
    this.Process.removeAllListeners();
    this.WebSocketConnection.removeEventListener(
      "close",
      this.WebSocketOnSocketInvlalidHandlerBinded,
    );
    this.WebSocketConnection.removeEventListener(
      "message",
      this.WebSocketOnMessageHandlerBinded,
    );
    this.WebSocketConnection.removeEventListener(
      "error",
      this.WebSocketOnSocketInvlalidHandlerBinded,
    );
    if (os.type() == "Windows_NT") {
      spawn("taskkill", ["/pid", this.Process.pid, "/f", "/t"]);
    } else {
      spawn("kill", ["-9", this.Process.pid]);
    }
  }

  WebSocketOnMessageHandler(event) {
    this.OnMessageFromClient(event.data);
  }

  WebSocketOnSocketInvlalidHandler(event) {
    this.IsUsing = false;
    this.IsLoaded = false;
    this.IsLoading = false;
  }

  Load(LoadFinishCallBack, LoadFailureCallBack) {
    if (
      typeof LoadFinishCallBack != "function" &&
      LoadFinishCallBack !== undefined
    ) {
      throw TypeError();
    }
    if (
      typeof LoadFailureCallBack != "function" &&
      LoadFailureCallBack !== undefined
    ) {
      throw TypeError();
    }
    if (this.WebSocketConnection.readyState != this.WebSocketConnection.OPEN) {
      return false;
    }
    if (this.IsLoading) {
      return;
    }
    this.IsLoading = true;
    this.IsLoaded = false;
    this.LoadFinishCallBack = LoadFinishCallBack;
    this.LoadFailureCallBack = LoadFailureCallBack;
    if (os.type() == "Windows_NT") {
      this.Process = spawn("cmd.exe", ["/C", this.Command], {
        cwd: this.WorkingDirectory,
      });
    } else if (os.type() == "Darwin" || os.type() == "Linux") {
      this.Process = spawn(this.Command, [], { cwd: this.WorkingDirectory });
    } else {
      console.warn(
        `Unknown OS type: ${os.type()}, default handler will be used.`,
      );
      this.Process = spawn(this.Command, [], { cwd: this.WorkingDirectory });
    }
    this.Process.on("error", (err) => {
      console.error(
        `[WebSocket Server] Failed to load ${this.Color} Engine (ID: ${this.ID}): `,
        err,
      );
      this.WebSocketConnection.send(
        `ERROR|LOAD_ENGINE|${this.ID}|${this.Color}`,
      );
      if (typeof this.LoadFailureCallBack == "function") {
        this.LoadFailureCallBack();
      }
      return;
    });
    this.Process.on("close", (code) => {
      if (wss.clients.has(this.WebSocketConnection)) {
        if (this.Status == "EXITING") {
          return;
        }
        if (this.IsLoading && this.Status == "TIMEOUT") {
          console.error(
            `[WebSocket Server] Engine ${this.Color} (ID: ${this.ID}) load timed out.`,
          );
          this.WebSocketConnection.send(
            `ERROR|ENGINE_TIMEOUT|${this.ID}|${this.Color}`,
          );
        } else {
          console.error(
            `[WebSocket Server] Failed to load ${this.Color} Engine (ID: ${this.ID}): `,
            code,
          );
          this.WebSocketConnection.send(
            `ERROR|LOAD_ENGINE|${this.ID}|${this.Color}`,
          );
        }
        this.Status = "";
        if (typeof this.LoadFailureCallBack == "function") {
          this.LoadFailureCallBack();
        }
        return;
      }
    });
    this.Process.stdout.on("data", (data) => {
      this.WebSocketConnection.send(
        `ENGINE_STDOUT|${this.ID}|${this.Color}|${data}`,
      );
    });
    this.Process.stderr.on("data", (data) => {
      this.WebSocketConnection.send(
        `ENGINE_STDERR|${this.ID}|${this.Color}|${data}`,
      );
    });
    console.log(
      "[WebSocket Server] Engine ",
      this.Command.split(PathLevelSeperatorMatcher).at(-1).trim(),
      " loading for ",
      this.Color,
      `(ID:${this.ID}).`,
    );
    console.log("[WebSocket Server] Engine protocol is " + this.Protocol);
    this.Process.stdin.write(
      `${ProtocolInitializationCommand(this.Protocol)}\n`,
    );
    setTimeout(() => {
      if (this.IsLoading) {
        this.Status = "TIMEOUT";
        if (os.type() == "Windows_NT") {
          spawn("taskkill", ["/pid", this.Process.pid, "/f", "/t"]);
        } else {
          spawn("kill", ["-9", this.Process.pid]);
        }
      }
    }, this.LoadTimeOut);
  }

  Exit() {
    this.Status = "EXITING";
    if (this.Process.connected) {
      this.Process.stdin.write("quit\n");
    }
    this.IsLoaded = false;
    this.IsLoading = false;
    setTimeout(() => {
      this.Status = "NOT_LOADED";
    }, 500);
  }

  LoadFinish() {
    this.IsLoading = false;
    this.IsLoaded = true;
    this.Status = "LOADED";
    if (typeof this.LoadFinishCallBack == "function") {
      this.LoadFinishCallBack();
    }
  }

  OnMessageFromClient(Message) {
    if (typeof Message != "string") {
      throw TypeError();
    }
    let msg = Message.split(MessageSplitter);
    if (msg[0] == "POST_MSG") {
      if (msg.length != 4) {
        console.warn(
          "[WebSocket Server] Received bad data from client. Syntax: POST_MSG|<ID>|<Color>|<info...>.",
        );
        return;
      }
      if (msg[1] == this.ID && msg[2] == this.Color) {
        this.Process.stdin.write(`${msg[3]}\n`);
      }
    } else if (msg[0] == "ENGINE_READY") {
      if (msg.length != 3) {
        console.warn(
          "[WebSocket Server] Received bad data from client. Syntax: ENGINE_READY|<ID>|<Color>.",
        );
        return;
      }
      if (msg[1] == this.ID && msg[2] == this.Color) {
        this.LoadFinish();
      }
    } else if (
      msg[0] == "CHANGE_ID" &&
      msg[1] == this.ID &&
      msg[2] == this.Color
    ) {
      if (typeof msg[3] == "string") {
        this.ID = msg[3];
        this.WebSocketConnection.send(`ID_CHANGED|${this.ID}|${this.Color}`);
      }
    }
  }
}

wss.on("connection", (ws, req) => {
  console.log("[WebSocket Server] Received connection from client.");
  ws.isAlive = true;
  ws.on("pong", heartbeat);
  ws.on("message", (message) => {
    let msg = message.toString().split("|");
    if (msg[0] == "CONNECT") {
      if (ConnectingClients.has(ws) || ConnectedClients.has(ws)) {
        console.warn(
          "[WebSocket Server] Received connection request from connecting or connected client.",
        );
      }
      console.log(
        `[WebSocket Server] Client connection verification code is ${msg[1]}.`,
      );
      ws.send(msg[1], (err) => {
        if (err) {
          console.error(`[WebSocket Server] Error: `, err);
        }
      });
      ConnectingClients.add(ws);
    } else if (msg[0] == "READYOK") {
      if (ConnectingClients.has(ws) && !ConnectedClients.has(ws)) {
        console.log(`[WebSocket Server] Client connected.`);
        ConnectedClients.add(ws);
        ConnectingClients.delete(ws);
        ws.send("UPDATE_DATA");
      } else {
        console.error(
          "[WebSocket Server] Received connection ready mark from connected or unknown client.",
        );
      }
    } else {
      if (!ConnectedClients.has(ws)) {
        console.error(
          `[WebSocket Server] Received bad data from client when connection established: ${message.toString()}`,
        );
        ws.close();
        return;
      }
    }
    if (msg[0] == "LOAD_ENGINE") {
      if (msg.length != 7) {
        console.warn(
          "[WebSocket Server] Received bad data from client. Syntax: LOAD_ENGINE|<ID>|<Color>|<Protocol>|<Command>|<WorkingDirectory>|<LoadTimeOut>.",
        );
        return;
      }
      if (!EngineProtocols.includes(msg[3])) {
        console.warn(
          "[WebSocket Server] Received bad engine protocol from client. Available protocols are:\n",
          EngineProtocols,
        );
        return;
      }
      if (ClientEngines.has(`${msg[1]}|${msg[2]}`)) {
        console.warn(
          `[WebSocket Server] Engine with ID: ${msg[1]} Color: ${msg[2]} already loaded. Reloading...`,
        );
        let ClientEngine = ClientEngines.get(`${msg[1]}|${msg[2]}`);
        ClientEngine.destructor();
        ClientEngines.delete(`${msg[1]}|${msg[2]}`);
      }
      let engineobj = new Engine(
        msg[1],
        msg[4],
        msg[5],
        msg[3],
        [],
        msg[2],
        parseInt(msg[6]),
        ws,
      );
      ClientEngines.set(`${msg[1]}|${msg[2]}`, engineobj);
      engineobj.Load(
        () => {
          console.log(
            `[WebSocket Server] Engine ID: ${msg[1]} Color: ${msg[2]} loaded successfully.`,
          );
        },
        () => {
          console.error(
            `[WebSocket Server] Error loading engine ID: ${msg[1]} Color: ${msg[2]}.`,
          );
        },
      );
    } else if (msg[0] == "EXIT_ENGINE") {
      if (msg.length != 3) {
        console.warn(
          "[WebSocket Server] Received bad data from client. Syntax: EXIT_ENGINE|<ID>|<Color>.",
        );
        return;
      }
      if (ClientEngines.has(`${msg[1]}|${msg[2]}`)) {
        let ClientEngine = ClientEngines.get(`${msg[1]}|${msg[2]}`);
        console.log(
          `[WebSocket Server] Exiting Engine ID: ${msg[1]} Color: ${msg[2]}`,
        );
        ClientEngines.delete(`${msg[1]}|${msg[2]}`);
        ClientEngine.Exit();
        ClientEngine.destructor();
        ClientEngine = undefined;
      } else {
        console.warn(
          "[WebSocket Server] Client has not loaded engine: ",
          `ID: ${msg[1]} Color: ${msg[2]}`,
        );
        return;
      }
    } else if (msg[0] == "GET_ENGINE_LIST") {
      let content = ReadFile("./EngineList.txt");
      ws.send(`ENGINE_LIST|${content}`);
    } else if (msg[0] == "SAVE_ENGINE_LIST") {
      if (msg.length != 2) {
        console.warn(
          "[WebSocket Server] Received bad data from client. Syntax: SAVE_ENGINE_LIST|<EngineListText>.",
        );
        return;
      }
      console.log(`[WebSocket Server] Saving engine list: ${msg[1]}`);
      WriteFile("./EngineList.txt", msg[1]);
    } else if (msg[0] == "CHANGE_ID") {
      if (msg.length != 4) {
        console.warn(
          "[WebSocket Server] Received bad data from client. Syntax: CHANGE_ID|<OldID>|<Color>|<NewID>.",
        );
        return;
      }
      if (ClientEngines.has(`${msg[1]}|${msg[2]}`)) {
        let ClientEngine = ClientEngines.get(`${msg[1]}|${msg[2]}`);
        ClientEngines.delete(`${msg[1]}|${msg[2]}`);
        ClientEngines.set(`${msg[3]}|${msg[2]}`, ClientEngine);
      }
    }
  });
  ws.on("close", (ws) => {
    console.log(`[WebSocket Server] Client disconnected.`);
    ClientEngines.forEach(function each(value, key) {
      let ClientEngine = value;
      if (ClientEngine.WebSocketConnection.readyState != WebSocket.OPEN) {
        ClientEngine.destructor();
        ClientEngines.delete(key);
      }
    });
    ConnectedClients.forEach(function each(value, value2) {
      if (!wss.clients.has(value)) {
        ConnectedClients.delete(value);
      }
    });
    ConnectingClients.forEach(function each(value, value2) {
      if (!wss.clients.has(value)) {
        ConnectingClients.delete(value);
      }
    });
  });
});

wss.on("close", (ws) => {
  console.log(`[WebSocket Server] Shutting Down!`);
  process.exit();
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

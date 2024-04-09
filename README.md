# fairyground

This is an attempt to have a simple demo and playground for [Fairy-Stockfish](https://github.com/ianfab/Fairy-Stockfish) in the browser, using its [WebAssembly port](https://github.com/ianfab/fairy-stockfish.wasm), its [ffish.js](https://www.npmjs.com/package/ffish-es6) library, and the graphical [chessgroundx](https://github.com/gbtami/chessgroundx) library. It is based on the [demo for Fairy-Stockfish WASM](https://github.com/ianfab/fairy-stockfish-nnue-wasm-demo) and [ffish-test](https://github.com/thearst3rd/ffish-test).

You can see it deployed at: [https://fairyground.vercel.app/](https://fairyground.vercel.app/)

## Usage

### ◎ Installation

#### ⊙ Prerequisites

Install [Node.js](https://nodejs.org/en/download) first.

#### ⊙ Setup

1. Open your console and switch the working directory to this directory (the directory that contains this README). All of the following commands should be executed in this console.

2. Install dependencies

```bash
npm install
```

3. Bundle JavaScript

##### -- Linux/macOS

```bash
# Build once (for end users)
npm run build

# or, continuously run in background and watch for changes (for developers)
npm run watch-build
```

##### -- Windows

```batch
::Build once (for end users)
npm run buildwithcmd

:: or, continuously run in background and watch for changes (for developers)
npm run watch-build
```

### ◎ Run Application

1. Open your console and switch the working directory to this directory (the directory that contains this README). All of the following commands should be executed in this console.

2. Start server (Choose one of the following commands)

```bash
#Static website, no back end required. This can be accessed remotely.
npm run serve

#Enable binary engine loading feature. Can be only accessed on local host.
node server.js
```

3. Then, browse to http://localhost:5000 (Static website) or http://localhost:5015 (Enable binary engine loading feature)

Enjoy!

## Supported Browsers

Most modern browsers should work, such as Google Chrome, Mozilla FireFox, Microsoft Edge, Apple Safari.
Older browsers like Internet Explorer of any version are not supported.

## Run Engines Remotely

This requires the computer that runs the server to install a SSH server and allows port forwarding.

You will need to use SSH port forwarding to forward one of the open port on the computer that opens the browser to the port that the server listens on the computer that runs the server.

For example, the server is running at http://192.168.1.10:5015 (which means IP: 192.168.1.10, Port: 5015), and the WebSocket Server will be launched at ws://192.168.1.10:5016 (which means IP: 192.168.1.10, Port: 5016, the port of WebSocket server will be port of HTTP +1), while 2 of the open ports on the computer which runs the browser are 9999 and 10000, then the command would be:

```
ssh -g -f -N -L 9999:192.168.1.10:5015 192.168.1.10
ssh -g -f -N -L 10000:192.168.1.10:5016 192.168.1.10
```

You need to build two connections, 9999 for HTTP and 9999 + 1 = 10000 for WebSocket in order to make it work.

Then browse to http://localhost:9999 and if you see \<Engine Management\> button it works.

## Make A Release

See [README.md](./release_make/README.md)

# Attribution

See [COPYING.md](COPYING.md)

# fairyground

This is an attempt to have a simple demo and playground for [Fairy-Stockfish](https://github.com/ianfab/Fairy-Stockfish) in the browser, using its [WebAssembly port](https://github.com/ianfab/fairy-stockfish.wasm), its [ffish.js](https://www.npmjs.com/package/ffish-es6) library, and the graphical [chessgroundx](https://github.com/gbtami/chessgroundx) library. It is based on the [demo for Fairy-Stockfish WASM](https://github.com/ianfab/fairy-stockfish-nnue-wasm-demo) and [ffish-test](https://github.com/thearst3rd/ffish-test).

You can see it deployed at: [https://fairyground.vercel.app/](https://fairyground.vercel.app/)

## Usage

The following steps (_**Installation**_ and _**Run Application**_) show the process to install a development environment.

If you want a one-click-to-run version, you can download the executables in the [Latest Build Actions](https://github.com/ianfab/fairyground/actions/workflows/ci.yml?query=event%3Apush+event%3Aworkflow_dispatch) section. (Requires logging in to GitHub)

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

# Build once (for developers, faster build without file compression & mangling)
npm run debug-build

# or, continuously run in background and watch for changes (for developers)
npm run watch-build
```

##### -- Windows

```batch
:: Build once (for end users)
npm run buildwithcmd

:: Build once (for developers, faster build without file compression & mangling)
npm run debug-buildwithcmd

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

### Full Support

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

### Limited Support

- Apple Safari

### No Support

- Microsoft Internet Explorer
- Opera Browser
- Brave Browser

Support for browsers not mentioned above are not clear. You need to check it yourself.

## Run Engines Remotely

> [!WARNING]
> All binary engine loading features are experimental

The definition of the terms used in this section:

*__Server__*: The computer that runs the fairyground server (a console application) and the binary engines.

*__Client__*: The computer that runs the browser and the UI (a graphical user interface, GUI).

You will need to use port forwarding (local forwarding) to forward one of the open port on the client to the port that the server listens. Any software that provides port forwarding is OK. In this guide we use SSH as the tool for instance.

This requires the server to install a SSH server and allows port forwarding. If the server runs Windows, You can install [OpenSSH For Windows](https://github.com/PowerShell/Win32-OpenSSH/releases).

For example, the server is running at http://192.168.1.10:5015 (which means IP: 192.168.1.10, Port: 5015), and then the WebSocket Server will be launched at ws://192.168.1.10:5016 (which means IP: 192.168.1.10, Port: 5016, the port of WebSocket server will be port of HTTP +1), while 2 of the open ports on the client are 9999 and 10000, then the command would be:

```
ssh -g -f -N -L 9999:192.168.1.10:5015 192.168.1.10
ssh -g -f -N -L 10000:192.168.1.10:5016 192.168.1.10
```

You need to build two connections, 9999 for HTTP and 9999 + 1 = 10000 for WebSocket in order to make it work.

Then browse to http://localhost:9999 on the client and if you see \<Engine Management\> button it works. Note that all the paths are paths *__on the server__*, *__NOT__* the path on the client. The binary executables of the engines need to be placed at respective paths *__on the server__*.

## Run External Binary Engines In Online Versions

> [!WARNING]
> All binary engine loading features are experimental

The definition of the terms used in this section:

*__Webpage Server__*: The computer that provides the webpage of fairyground. It is the server specified in the URL. For example, https://fairyground.vercel.app

*__Engine Server__*: The computer that runs the fairyground server (a console application) and the binary engines. For example, http://localhost:5015

*__Client__*: The computer that runs the browser and the UI (a graphical user interface, GUI).

Note: If the engine server and the client are on different computers, please refer to the [previous chapter](https://github.com/ianfab/fairyground#run-engines-remotely) when doing step 4. This guide assumes that the engine server and the client are on the same computer.

Steps to connect external binary engines:

1. Type the address of the *__webpage server__* in the browser and go to it. You will see the webpage of fairyground.
2. Run fairyground server. It will be the *__engine server__*. (run `node server.js` in the console or run the executable if you downloaded the release)
3. Check the *__WebSocket__* port of the engine server. By default it is 5016.
4. Click \<CONNECT\> button at the top of the page. In the prompt dialog, enter the *__WebSocket__* port of the *__engine server__*. (If the engine server and the client are on different computers, you need to use port forwarding to make this work. See [previous chapter](https://github.com/ianfab/fairyground#run-engines-remotely))
5. If connected, you will see \<Engine Management\> button. Click it to load your engines.  Note that all the paths are paths *__on the engine server__*, *__NOT__* the path on the client. The binary executables of the engines need to be placed at respective paths *__on the engine server__*.

## Make A Release

See [README.md](./release_make/README.md)

# Attribution

See [COPYING.md](COPYING.md)

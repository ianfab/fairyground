# fairyground

This is an attempt to have a simple demo and playground for [Fairy-Stockfish](https://github.com/ianfab/Fairy-Stockfish) in the browser, using its [WebAssembly port](https://github.com/ianfab/fairy-stockfish.wasm), its [ffish.js](https://www.npmjs.com/package/ffish-es6) library, and the graphical [chessgroundx](https://github.com/gbtami/chessgroundx) library. It is based on the [demo for Fairy-Stockfish WASM](https://github.com/ianfab/fairy-stockfish-nnue-wasm-demo) and [ffish-test](https://github.com/thearst3rd/ffish-test).

You can see it deployed at: [https://fairyground.vercel.app/](https://fairyground.vercel.app/)

## Usage

Install dependencies

```bash
npm install
```

Bundle javascript

```bash
# One time use
npm run build

# or, continuously run in background and watch for changes
npm run watch-build
```

Start server

```bash
npm run serve
```

Then, browse to http://localhost:5000

Enjoy!

# Attribution

See [COPYING.md](COPYING.md)

# fairyground

This is an attempt to integrate [Fairy-Stockfish](https://github.com/ianfab/Fairy-Stockfish), its [WebAssembly port](https://github.com/ianfab/fairy-stockfish.wasm), its [ffish.js](https://www.npmjs.com/package/ffish-es6) library, and the graphical [chessgroundx](https://github.com/gbtami/chessgroundx). 

You can see it deployed at: [https://ffish-test.vercel.app/](https://fairyground.vercel.app/)

## Usage

Install dependancies

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

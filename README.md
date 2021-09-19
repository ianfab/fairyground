# ffish-test

This is a fun little repository for me to hack on software like [Fairy-Stockfish](https://github.com/ianfab/Fairy-Stockfish), it's accompanying [ffish.js](https://www.npmjs.com/package/ffish-es6) library, and the graphical [chessgroundx](https://github.com/gbtami/chessgroundx). I can't guarantee that much of it will be very useful, I'm just hoping it's a fun project :)

## What is it

ffish-test is my little project which uses ffish.js to generate legal moves for chess and chess variants, and chessgroundx to graphically display them and let the user interact with them. It has a few simple options to undo moves, reset the board to a new game, and enable a random-mover "AI". It supports a few variants which I selected, and it's very easy to add new variants assuming they work with the currently-existing limited setup _(8x8 board only, mostly standard pieces + chancellor and archbishop, no pockets/piece dropping, etc)_.

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
npm start
```

Then, browse to http://localhost:8000

Enjoy!

# Attribution

See [COPYING.md](COPYING.md)

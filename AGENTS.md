# Overview
This project uses Fairy-Stockfish and libraries based on it to play and analyze chess variants in the browser.

The main libraries it uses are:
* ffish-es6 for the chess variant logic to generate and validate moves on the board
* fairy-stockfish.wasm as the WebAssembly engine for calculating the best move(s) in a given position
* chessgroundx for the rendering of and user interactions with the chess variant board and pieces
* mithril as a single page application framework

# Development
* Always make sure to call `npm run format:check` and `npm run format` before committing code to ensure that it is properly formatted
* The website is hosted with vercel. Do not change anything about the deployment configuration unless absolutely required or directly requested.
* Do not include other chess or chess variant libraries not based on Fairy-Stockfish, since they will not have the same feature set.
* Only stage and commit files that were added or changed intentionally in scope of the current task.

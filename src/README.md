# Source Files

The files in this directory are source files used for the build process of the project. The table below explains these files:

## File Explanation

| Source File                          | Destination File                         | Description                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src\README.md`                      | (none)                                   | This README, explaining the source files.                                                                                                                                                                                                                                                                                                            |
| `src\html\index.html`                | `public\index.html`                      | The main Hyper Text Markup Language file, containing all function of themes, advanced timing system, play mode control, in browser Fairy-Stockfish, user piece graphics and variant settings; part of review mode and board setup; all HTML elements on the main page; interface to PGN/EPD parser and binary engine loading.                        |
| `src\html\advanced.html`             | `public\advanced.html`                   | A redirect to the main page, kept so that links to the former "Advanced analysis" page still work. Query string and fragment are carried over.                                                                                                                                                                                                       |
| `src\html\resources.html`            | `public\resources.html`                  | The "Resources" page.                                                                                                                                                                                                                                                                                                                                |
| `src\js\main.js`                     | `public\bundle.js`                       | The main JavaScript file attached to index.html which imports ffish.js & Chessground X, and contains all function of position variants (custom positions), board logic and notation system; most of interactive analysis, board setup and search move dialog; part of review mode.                                                                   |
| `src\js\server.js`                   | `<root>\server.js`                       | The fairyground server or backend, which is the controller of binary engines and communicates with the webpage through WebSocket.                                                                                                                                                                                                                    |
| `src\js\server-parallel.js`          | (none)                                   | The parallel version of fairyground server or backend, which has the same function as `server.js` but supports load balance for HTTP. Not used by default, as it's only useful under high request frequency circumstances.                                                                                                                           |
| `src\js\BinaryEngineFeature.js`      | `public\lib\BinaryEngineFeature.js`      | This script exports all functions related to binary engines to index.html, such as UCI/UCCI/UCI-Cyclone/USI protocol translation, binary engine control logic and engine management/setup/settings UI. It does not contain GUI logic.                                                                                                                |
| `src\js\SavedGamesParsingFeature.js` | `public\lib\SavedGamesParsingFeature.js` | This script exports all functions related to PGN/EPD parser, such as file processing and parser UI. It does not contain GUI logic.                                                                                                                                                                                                                   |
| `src\js\*.canvas.worker.js`          | `public\lib\canvas\*.canvas.worker.js`   | These scripts are canvas workers that renders the animation in an individual thread at page background for UI theme. They receive a OffscreenCanvas from main page and draw things on them. Changes made to the canvas are committed automatically to main page. You can find which UI theme uses the corresponding script in `public\uithemes.txt`. |
| `src\js\move.js`                     | `public\bundle.js`                       | This script exports all logic related with move variations used in PGN variation moves.                                                                                                                                                                                                                                                              |
| `src\js\pgn.js`                      | `public\bundle.js`                       | This script exports PGN processing logic used in PGN variation moves. This script does not contain logic in PGN/EPD parser.                                                                                                                                                                                                                          |
| `src\js\chessgroundtheme.js`         | `public\bundle.js`                       | This script defines a HTMLElement that can get stylesheet values of the board and pieces, which will be used in image generation.                                                                                                                                                                                                                    |
| `src\js\image.js`                    | `public\bundle.js`                       | This script exports all functions related with board image generation.                                                                                                                                                                                                                                                                               |

### Notes

1. The location of the files are relative to the root directory of this project, which has COPYING.md.

2. Destination file is the produced file during the build process.

## File Placement & Size Reduction

The following table shows the current build process on file placement and file size reduction method (compress & mangle).

| Source                                                                                                   | Destination                 | Compress? | Mangle? | Note                                                                     |
| -------------------------------------------------------------------------------------------------------- | --------------------------- | --------- | ------- | ------------------------------------------------------------------------ |
| `src\js\*Feature.js`                                                                                     | `public\lib\`               | ✔         | ✔       | Can add more files without changing `package.json`                       |
| `src\js\*.canvas.worker.js`                                                                              | `public\lib\canvas\`        | ✔         | ✔       | Can add more files without changing `package.json`                       |
| `src\html\*.html`                                                                                        | `public\`                   | ✔         | ✔       | Can add more files without changing `package.json`                       |
| `src\js\main.js` & `src\js\move.js` & `src\js\pgn.js` & `src\js\chessgroundtheme.js` & `src\js\image.js` | Merge to `public\bundle.js` | ✔         | ✔       |                                                                          |
| `src\js\server.js`                                                                                       | `<root>\server.js`          | ✖         | ✖       | Only used in offline version, so reducing file size does not make sense. |

### Notes

1. The location of the files are relative to the root directory of this project, which has COPYING.md.

2. When using debug builds like `npm run debug-build` on Linux/macOS or `npm run debug-buildwithcmd` on Windows, compression and mangling are both disabled for all files.

3. Using debug builds is faster in building process and do not mess up variable names which makes it better to develop. Using normal builds like `npm run build` on Linux/macOS or `npm run buildwithcmd` on Windows take longer time to build but the file size are much smaller which can reduce network flow.

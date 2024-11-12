/* 
 * 
 * Usage (Bash or CMD):
 * node generate_chessgroundx_css.js > path/to/css/file
 * 
 */ 

let boardsize = 640;
let piecesizepercent = 100;
let miniboardscale = 0.5;
let miniboardsize = boardsize * miniboardscale;

let digitaccuracy = 1;
let percentaccuracy = 5;

const MAX_RANK = 10;
const MAX_FILE = 12;

let i = 0;
let j = 0;

let result = "";

for (i = 1; i <= MAX_FILE; i++) {
    for (j = 1; j <= MAX_RANK; j++) {
        result += `
.board${i}x${j} .cg-wrap {
    width: ${(i > j ? boardsize : boardsize * i / j).toFixed(digitaccuracy)}px;
    height: ${(j > i ? boardsize : boardsize * j / i).toFixed(digitaccuracy)}px;
}

.board${i}x${j}.pockets .cg-wrap {
    width: ${(i > j ? boardsize * i / (i + 2) : boardsize * i / j * i / (i + 2)).toFixed(digitaccuracy)}px;
    height: ${(j > i ? boardsize * i / (i + 2) : boardsize * j / (i + 2)).toFixed(digitaccuracy)}px;
}

.board${i}x${j} cg-helper {
    width: ${(piecesizepercent / i).toFixed(percentaccuracy)}%;
    height: ${(piecesizepercent / j).toFixed(percentaccuracy)}%;
}

.board${i}x${j} cg-board square {
    width: ${(piecesizepercent / i).toFixed(percentaccuracy)}%;
    height: ${(piecesizepercent / j).toFixed(percentaccuracy)}%;
}

.board${i}x${j} .cg-wrap piece {
    width: ${(piecesizepercent / i).toFixed(percentaccuracy)}%;
    height: ${(piecesizepercent / j).toFixed(percentaccuracy)}%;
}

.board${i}x${j} .cg-wrap.micro {
    width: ${(i > j ? miniboardsize : miniboardsize * i / j).toFixed(digitaccuracy)}px;
    height: ${(j > i ? miniboardsize : miniboardsize * j / i).toFixed(digitaccuracy)}px;
}

.board${i}x${j}.pockets .cg-wrap.micro {
    width: ${(i > j ? miniboardsize * i / (i + 2) : miniboardsize * i / j * i / (i + 2)).toFixed(digitaccuracy)}px;
    height: ${(j > i ? miniboardsize * i / (i + 2) : miniboardsize * j / (i + 2)).toFixed(digitaccuracy)}px;
}
`.replace(/\r\n|\r|\n|[ ]{4}/g,"").replace(/\:[ ]+/g,":");
    }
}

console.log(result);

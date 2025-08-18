import * as moveutil from "./move.js";

function ParseFEN(fen) {
  if (typeof fen != "string") {
    throw TypeError;
  }
  let i = 0;
  let j = 0;
  const pieceprefixes = ["+", "|"];
  const piecesuffixes = ["~"];
  const specialpieces = ["*"];
  let boardwidth = 0;
  let boardheight = 0;
  let chcode = 0;
  let ParserState = -1;
  let pieces = [];
  let piececolor = "";
  let pieceid = "";
  let firstrow = true;
  let columncount = 0;
  let prefix = "";
  let suffix = "";
  let blankcount = 0;
  let ch;
  const fenelem = fen.split(/[ ]+/);
  const position = fenelem[0];
  for (i = 0; i < position.length; i++) {
    ch = position[i];
    chcode = ch.charCodeAt(0);
    if (ParserState == -1) {
      //Initial state
      if (chcode >= 65 && chcode <= 90) {
        boardheight = 1;
        columncount++;
        piececolor = "white";
        pieceid = String.fromCharCode(chcode + 32);
        ParserState = 1;
      } else if (chcode >= 97 && chcode <= 122) {
        boardheight = 1;
        columncount++;
        piececolor = "black";
        pieceid = ch;
        ParserState = 1;
      } else if (chcode >= 48 && chcode <= 57) {
        boardheight = 1;
        blankcount = parseInt(ch);
        ParserState = 0;
      } else if (pieceprefixes.includes(ch)) {
        if (prefix.includes(ch)) {
          console.warn(
            `Duplicated piece prefix "${ch}" at char ${i + 1} of FEN.`,
          );
          return null;
        }
        boardheight = 1;
        prefix += ch;
        ParserState = 0;
      } else if (specialpieces.includes(ch)) {
        columncount++;
        boardheight = 1;
        pieces.push({ role: ch, color: null, prefix: null, suffix: null });
        ParserState = 0;
      } else {
        console.warn(`Illegal character "${ch}" at char ${i + 1} of FEN.`);
        return null;
      }
    } else if (ParserState == 0) {
      //Main state
      if (blankcount > 0 && (chcode < 48 || chcode > 57)) {
        for (j = 0; j < blankcount; j++) {
          pieces.push({ role: null, color: null, prefix: null, suffix: null });
        }
        columncount += blankcount;
        blankcount = 0;
      }
      if (chcode >= 65 && chcode <= 90) {
        piececolor = "white";
        pieceid = String.fromCharCode(chcode + 32);
        columncount++;
        ParserState = 1;
      } else if (chcode >= 97 && chcode <= 122) {
        piececolor = "black";
        pieceid = ch;
        columncount++;
        ParserState = 1;
      } else if (chcode >= 48 && chcode <= 57) {
        if (prefix.length > 0) {
          console.warn(
            `Illegal prefix "${prefix}" describing empty squares at char ${i + 1} of FEN.`,
          );
          return null;
        }
        blankcount = blankcount * 10 + parseInt(ch);
        prefix = "";
        suffix = "";
      } else if (pieceprefixes.includes(ch)) {
        if (prefix.includes(ch)) {
          console.warn(
            `Duplicated piece prefix "${ch}" at char ${i + 1} of FEN.`,
          );
          return null;
        }
        prefix += ch;
      } else if (specialpieces.includes(ch)) {
        if (prefix.length > 0) {
          console.warn(
            `Illegal prefix "${prefix}" describing special piece at char ${i + 1} of FEN.`,
          );
          return null;
        }
        columncount++;
        pieces.push({ role: ch, color: null, prefix: null, suffix: null });
      } else if (ch == "/") {
        if (firstrow) {
          boardwidth = columncount;
          firstrow = false;
        } else if (columncount != boardwidth) {
          console.warn(
            `Column count mismatch at row ${boardheight}. Expected: ${boardwidth}, Actual: ${columncount}`,
          );
          return null;
        }
        columncount = 0;
        boardheight++;
        if (prefix.length > 0) {
          console.warn(
            `Illegal prefix "${prefix}" at end of row at char ${i + 1} of FEN.`,
          );
          return null;
        }
      } else {
        console.warn(`Illegal character "${ch}" at char ${i + 1} of FEN.`);
        return null;
      }
    } else if (ParserState == 1) {
      //Parsing suffixes
      if (piecesuffixes.includes(ch)) {
        suffix += ch;
      } else {
        pieces.push({
          role: pieceid,
          color: piececolor,
          prefix: prefix,
          suffix: suffix,
        });
        prefix = "";
        suffix = "";
        i--;
        ParserState = 0;
      }
    }
  }
  if (ParserState == 0) {
    if (blankcount > 0) {
      for (j = 0; j < blankcount; j++) {
        pieces.push({ role: null, color: null, prefix: null, suffix: null });
      }
      columncount += blankcount;
    }
  } else if (ParserState == 1) {
    pieces.push({
      role: pieceid,
      color: piececolor,
      prefix: prefix,
      suffix: suffix,
    });
    prefix = "";
  }
  if (firstrow) {
    boardwidth = columncount;
  } else if (columncount != boardwidth) {
    console.warn(
      `Column count mismatch at row ${boardheight}. Expected: ${boardwidth}, Actual: ${columncount}`,
    );
    return null;
  }
  if (prefix.length > 0) {
    console.warn(
      `Illegal prefix "${prefix}" at end of row at char ${i + 1} of FEN.`,
    );
    return null;
  }
  return pieces;
}

function GetBoardAndPocket(FEN) {
  if (typeof FEN != "string") {
    throw TypeError();
  }
  let fenpieces = FEN.split(" ")[0];
  let index = fenpieces.indexOf("[");
  let index2 = fenpieces.indexOf("]");
  if (index >= 0 && index2 > index) {
    return {
      board: fenpieces.substring(0, index),
      pocket: fenpieces.substring(index + 1, index2),
    };
  } else {
    return { board: fenpieces, pocket: "" };
  }
}

function ConvertSquareToCoordinate(Square, BoardHeight) {
  if (typeof Square != "string" || typeof BoardHeight != "number") {
    throw TypeError();
  }
  let x = Square.charCodeAt(0) - 97;
  let y = BoardHeight - parseInt(Square.substring(1));
  if (x >= 0 && x <= 25 && y >= 0) {
    return { x: x, y: y };
  } else {
    return { x: -1, y: -1 };
  }
}

function ConvertMoveToCoordinate(UCIMove, BoardHeight) {
  if (typeof UCIMove != "string" || typeof BoardHeight != "number") {
    throw TypeError();
  }
  let move = moveutil.ParseUCIMove(UCIMove);
  let from = move[0];
  let to = move[1];
  if (typeof from == "string" && typeof to == "string") {
    let from_sq = ConvertSquareToCoordinate(from, BoardHeight);
    let to_sq = ConvertSquareToCoordinate(to, BoardHeight);
    return {
      from_x: from_sq.x,
      from_y: from_sq.y,
      to_x: to_sq.x,
      to_y: to_sq.y,
    };
  } else {
    return { from_x: -1, from_y: -1, to_x: -1, to_y: -1 };
  }
}

function CoordinateListIncludes(CoordinateList, X, Y) {
  if (
    !(CoordinateList instanceof Array) ||
    typeof X != "number" ||
    typeof Y != "number"
  ) {
    throw TypeError();
  }
  let i = 0;
  for (i = 0; i < CoordinateList.length; i++) {
    if (CoordinateList[i].x == X && CoordinateList[i].y == Y) {
      return true;
    }
  }
  return false;
}

export function GenerateBoardImage(
  FEN,
  LastMove,
  CheckedSquares,
  HasPocket,
  Orientation,
  BoardWidth,
  BoardHeight,
  PieceImageURLMap,
  BoardImageURL,
  ImageWidth,
  ImageHeight,
  OnFinishedCallback,
) {
  if (
    typeof FEN != "string" ||
    typeof LastMove != "string" ||
    !(CheckedSquares instanceof Array) ||
    typeof HasPocket != "boolean" ||
    typeof Orientation != "string" ||
    typeof BoardWidth != "number" ||
    typeof BoardHeight != "number" ||
    !(PieceImageURLMap instanceof Map) ||
    typeof BoardImageURL != "string" ||
    typeof ImageWidth != "number" ||
    typeof ImageHeight != "number" ||
    typeof OnFinishedCallback != "function"
  ) {
    throw TypeError();
  }
  function CountCharacters(str) {
    if (typeof str != "string") {
      throw TypeError();
    }
    let i = 0;
    let char;
    const whitepieces = new Map();
    const blackpieces = new Map();
    for (i = 0; i < str.length; i++) {
      char = str[i];
      if (char.charCodeAt(0) >= 65 && char.charCodeAt(0) <= 90) {
        whitepieces.set(char, (whitepieces.get(char) || 0) + 1);
      } else if (char.charCodeAt(0) >= 97 && char.charCodeAt(0) <= 122) {
        blackpieces.set(char, (blackpieces.get(char) || 0) + 1);
      }
    }
    return { white: whitepieces, black: blackpieces };
  }
  let i = 0;
  let drawnelementcount = 0;
  let fenparts = GetBoardAndPocket(FEN);
  let pieces = ParseFEN(fenparts.board);
  let pocket = CountCharacters(fenparts.pocket);
  let lastmove = ConvertMoveToCoordinate(LastMove, BoardHeight);
  let whitepocket = [...pocket.white.keys()];
  let blackpocket = [...pocket.black.keys()];
  let pocketsize = Math.max(whitepocket.length, blackpocket.length);
  let totalcount = pieces.length + whitepocket.length + blackpocket.length;
  let displaywidth = Math.max(BoardWidth, pocketsize);
  let displayheight = HasPocket ? BoardHeight + 2 : BoardHeight;
  let squarepixelwidth = ImageWidth / displaywidth;
  let squarepixelheight = ImageHeight / displayheight;
  let noflipboard = Orientation == "white";
  let checkedsquarescoordinate = [];
  if (pieces.length != BoardWidth * BoardHeight) {
    throw SyntaxError("Invalid FEN.");
  }
  for (i = 0; i < CheckedSquares.length; i++) {
    checkedsquarescoordinate.push(
      ConvertSquareToCoordinate(CheckedSquares[i], BoardHeight),
    );
  }
  const canvas = document.createElement("canvas");
  canvas.width = ImageWidth;
  canvas.height = ImageHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, ImageWidth, ImageHeight);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  //Board
  const boardimg = new Image();
  boardimg.onload = () => {
    let i = 0,
      j = 0;
    let pieceitem;
    let piecechar;
    ctx.drawImage(
      boardimg,
      0,
      HasPocket ? squarepixelheight : 0,
      squarepixelwidth * BoardWidth,
      squarepixelheight * BoardHeight,
    );

    //Pieces On Board
    for (i = 0; i < BoardWidth; i++) {
      for (j = 0; j < BoardHeight; j++) {
        pieceitem = pieces[j * BoardWidth + i];
        piecechar = pieceitem.role;
        if (piecechar != null) {
          if (pieceitem.color == "white") {
            piecechar = piecechar.toUpperCase();
          }
          if (pieceitem.prefix && pieceitem.prefix.includes("+")) {
            piecechar = "p" + piecechar;
          }
        }
        if (noflipboard) {
          (function (x, y, index_x, index_y, imgurl) {
            if (
              (index_x == lastmove.from_x && index_y == lastmove.from_y) ||
              (index_x == lastmove.to_x && index_y == lastmove.to_y)
            ) {
              ctx.fillStyle = "rgba(155, 199, 0, 0.41)";
              ctx.fillRect(x, y, squarepixelwidth, squarepixelheight);
              ctx.fillStyle = "";
            } else if (
              CoordinateListIncludes(checkedsquarescoordinate, index_x, index_y)
            ) {
              // let halflinewidth=Math.min(squarepixelwidth, squarepixelheight)/32;
              // ctx.lineWidth=halflinewidth*2;
              // ctx.strokeStyle="red";
              // ctx.strokeRect(x+halflinewidth, y+halflinewidth, squarepixelwidth-2*halflinewidth, squarepixelheight-2*halflinewidth);
              // ctx.strokeStyle="";
              ctx.fillStyle = "#f006";
              ctx.fillRect(x, y, squarepixelwidth, squarepixelheight);
              ctx.fillStyle = "";
            }
            if (imgurl) {
              const pieceimg = new Image();
              pieceimg.onload = () => {
                ctx.drawImage(
                  pieceimg,
                  x,
                  y,
                  squarepixelwidth,
                  squarepixelheight,
                );
                drawnelementcount++;
                if (drawnelementcount >= totalcount) {
                  OnFinishedCallback(canvas);
                }
              };
              pieceimg.src = imgurl;
            } else {
              drawnelementcount++;
              if (drawnelementcount >= totalcount) {
                OnFinishedCallback(canvas);
              }
            }
          })(
            i * squarepixelwidth,
            (HasPocket ? j + 1 : j) * squarepixelheight,
            i,
            j,
            PieceImageURLMap.get(piecechar),
          );
        } else {
          (function (x, y, index_x, index_y, imgurl) {
            if (
              (index_x == lastmove.from_x && index_y == lastmove.from_y) ||
              (index_x == lastmove.to_x && index_y == lastmove.to_y)
            ) {
              ctx.fillStyle = "rgba(155, 199, 0, 0.41)";
              ctx.fillRect(x, y, squarepixelwidth, squarepixelheight);
              ctx.fillStyle = "";
            } else if (
              CoordinateListIncludes(checkedsquarescoordinate, index_x, index_y)
            ) {
              // let halflinewidth=Math.min(squarepixelwidth, squarepixelheight)/32;
              // ctx.lineWidth=halflinewidth*2;
              // ctx.strokeStyle="red";
              // ctx.strokeRect(x+halflinewidth, y+halflinewidth, squarepixelwidth-2*halflinewidth, squarepixelheight-2*halflinewidth);
              // ctx.strokeStyle="";
              ctx.fillStyle = "#f006";
              ctx.fillRect(x, y, squarepixelwidth, squarepixelheight);
              ctx.fillStyle = "";
            }
            if (imgurl) {
              const pieceimg = new Image();
              pieceimg.onload = () => {
                ctx.drawImage(
                  pieceimg,
                  x,
                  y,
                  squarepixelwidth,
                  squarepixelheight,
                );
                drawnelementcount++;
                if (drawnelementcount >= totalcount) {
                  OnFinishedCallback(canvas);
                }
              };
              pieceimg.src = imgurl;
            } else {
              drawnelementcount++;
              if (drawnelementcount >= totalcount) {
                OnFinishedCallback(canvas);
              }
            }
          })(
            (BoardWidth - i - 1) * squarepixelwidth,
            (HasPocket ? BoardHeight - j : BoardHeight - j - 1) *
              squarepixelheight,
            i,
            j,
            PieceImageURLMap.get(piecechar),
          );
        }
      }
    }
  };
  boardimg.src = BoardImageURL;

  //Pocket
  if (HasPocket) {
    let piecechar;
    let fontsize = Math.min(0.3 * squarepixelwidth, 0.3 * squarepixelheight);
    if (noflipboard) {
      for (i = 0; i < blackpocket.length; i++) {
        piecechar = blackpocket[i];
        (function (x, count, imgurl) {
          if (imgurl) {
            const pieceimg = new Image();
            pieceimg.onload = () => {
              ctx.fillStyle = "#888";
              ctx.fillRect(x, 0, squarepixelwidth, squarepixelheight);
              ctx.fillStyle = "";
              ctx.drawImage(
                pieceimg,
                x,
                0,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "#d85000";
              ctx.fillRect(
                x + (2 * squarepixelwidth) / 3,
                (2 * squarepixelheight) / 3,
                squarepixelwidth / 3,
                squarepixelheight / 3,
              );
              ctx.fillStyle = "#fff";
              ctx.font = `${fontsize}px Arial`;
              ctx.fillText(
                String(count),
                x + (5 / 6) * squarepixelwidth,
                (5 / 6) * squarepixelheight,
                squarepixelwidth / 3,
              );
              ctx.fillStyle = "";
              ctx.font = "";
              drawnelementcount++;
              if (drawnelementcount >= totalcount) {
                OnFinishedCallback(canvas);
              }
            };
            pieceimg.src = imgurl;
          } else {
            drawnelementcount++;
            if (drawnelementcount >= totalcount) {
              OnFinishedCallback(canvas);
            }
          }
        })(
          i * squarepixelwidth,
          pocket.black.get(piecechar),
          PieceImageURLMap.get(piecechar),
        );
      }
      for (i = 0; i < whitepocket.length; i++) {
        piecechar = whitepocket[i];
        (function (x, count, imgurl) {
          if (imgurl) {
            const pieceimg = new Image();
            pieceimg.onload = () => {
              ctx.fillStyle = "#888";
              ctx.fillRect(
                x,
                ImageHeight - squarepixelheight,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "";
              ctx.drawImage(
                pieceimg,
                x,
                ImageHeight - squarepixelheight,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "#d85000";
              ctx.fillRect(
                x + (2 * squarepixelwidth) / 3,
                ImageHeight - squarepixelheight / 3,
                squarepixelwidth / 3,
                squarepixelheight / 3,
              );
              ctx.fillStyle = "#fff";
              ctx.font = `${fontsize}px Arial`;
              ctx.fillText(
                String(count),
                x + (5 / 6) * squarepixelwidth,
                ImageHeight - squarepixelheight / 6,
                squarepixelwidth / 3,
              );
              ctx.fillStyle = "";
              ctx.font = "";
              drawnelementcount++;
              if (drawnelementcount >= totalcount) {
                OnFinishedCallback(canvas);
              }
            };
            pieceimg.src = imgurl;
          } else {
            drawnelementcount++;
            if (drawnelementcount >= totalcount) {
              OnFinishedCallback(canvas);
            }
          }
        })(
          i * squarepixelwidth,
          pocket.white.get(piecechar),
          PieceImageURLMap.get(piecechar),
        );
      }
    } else {
      for (i = 0; i < whitepocket.length; i++) {
        piecechar = whitepocket[i];
        (function (x, count, imgurl) {
          if (imgurl) {
            const pieceimg = new Image();
            pieceimg.onload = () => {
              ctx.fillStyle = "#888";
              ctx.fillRect(x, 0, squarepixelwidth, squarepixelheight);
              ctx.fillStyle = "";
              ctx.drawImage(
                pieceimg,
                x,
                0,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "#d85000";
              ctx.fillRect(
                x + (2 * squarepixelwidth) / 3,
                (2 * squarepixelheight) / 3,
                squarepixelwidth / 3,
                squarepixelheight / 3,
              );
              ctx.fillStyle = "#fff";
              ctx.font = `${fontsize}px Arial`;
              ctx.fillText(
                String(count),
                x + (5 / 6) * squarepixelwidth,
                (5 / 6) * squarepixelheight,
                squarepixelwidth / 3,
              );
              ctx.fillStyle = "";
              ctx.font = "";
              drawnelementcount++;
              if (drawnelementcount >= totalcount) {
                OnFinishedCallback(canvas);
              }
            };
            pieceimg.src = imgurl;
          } else {
            drawnelementcount++;
            if (drawnelementcount >= totalcount) {
              OnFinishedCallback(canvas);
            }
          }
        })(
          i * squarepixelwidth,
          pocket.white.get(piecechar),
          PieceImageURLMap.get(piecechar),
        );
      }
      for (i = 0; i < blackpocket.length; i++) {
        piecechar = blackpocket[i];
        (function (x, count, imgurl) {
          if (imgurl) {
            const pieceimg = new Image();
            pieceimg.onload = () => {
              ctx.fillStyle = "#888";
              ctx.fillRect(
                x,
                ImageHeight - squarepixelheight,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "";
              ctx.drawImage(
                pieceimg,
                x,
                ImageHeight - squarepixelheight,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "#d85000";
              ctx.fillRect(
                x + (2 * squarepixelwidth) / 3,
                ImageHeight - squarepixelheight / 3,
                squarepixelwidth / 3,
                squarepixelheight / 3,
              );
              ctx.fillStyle = "#fff";
              ctx.font = `${fontsize}px Arial`;
              ctx.fillText(
                String(count),
                x + (5 / 6) * squarepixelwidth,
                ImageHeight - squarepixelheight / 6,
                squarepixelwidth / 3,
              );
              ctx.fillStyle = "";
              ctx.font = "";
              drawnelementcount++;
              if (drawnelementcount >= totalcount) {
                OnFinishedCallback(canvas);
              }
            };
            pieceimg.src = imgurl;
          } else {
            drawnelementcount++;
            if (drawnelementcount >= totalcount) {
              OnFinishedCallback(canvas);
            }
          }
        })(
          i * squarepixelwidth,
          pocket.black.get(piecechar),
          PieceImageURLMap.get(piecechar),
        );
      }
    }
  }
}

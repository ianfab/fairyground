import * as moveutil from "./move.js";

const FORWARD = 0;
const BACKWARD = 1;

const ARABIC_NUMBER = 0;
const ENGLISH_LETTER = 1;
const CHINESE_LETTER = 2;
const THAI_NUMBER = 3;
const THAI_LETTER = 4;

const NOTATION_CHESS = 0;
const NOTATION_SHOGI = 1;
const NOTATION_SHOGI_NUMBER = 2;
const NOTATION_SHOGI_HANZI = 3;
const NOTATION_JANGGI = 4;
const NOTATION_XIANGQI = 5;
const NOTATION_XIANGQI_HANZI = 6;
const NOTATION_THAI = 7;

const LETTER_ENGLISH = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
];
const LETTER_THAI = [
  "ก",
  "ข",
  "ค",
  "ง",
  "จ",
  "ฉ",
  "ช",
  "ญ",
  "ต",
  "ถ",
  "ท",
  "น",
  "ป",
  "ผ",
  "พ",
  "ม",
];
const NUMBER_ARABIC = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
];
const LETTER_CHINESE = [
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
];
const NUMBER_THAI = [
  "๑",
  "๒",
  "๓",
  "๔",
  "๕",
  "๖",
  "๗",
  "๘",
  "๙",
  "๑๐",
  "๑๑",
  "๑๒",
  "๑๓",
  "๑๔",
  "๑๕",
  "๑๖",
];

function IsImageURLValid(ImageURL) {
  if (typeof ImageURL != "string") {
    return false;
  }
  return ImageURL.length > 0;
}

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

function DrawCoordinatesOnBoard(
  CanvasContext2D,
  FlipBoard,
  BoardWidth,
  BoardHeight,
  SquarePixelWidth,
  SquarePixelHeight,
  BoardStartX,
  BoardStartY,
  LightSquareCoordinateColor,
  DarkSquareCoordinateColor,
  Notation,
) {
  if (
    !(CanvasContext2D instanceof CanvasRenderingContext2D) ||
    typeof FlipBoard != "boolean" ||
    typeof BoardWidth != "number" ||
    typeof BoardHeight != "number" ||
    typeof SquarePixelWidth != "number" ||
    typeof SquarePixelHeight != "number" ||
    typeof BoardStartX != "number" ||
    typeof BoardStartY != "number" ||
    typeof LightSquareCoordinateColor != "string" ||
    typeof DarkSquareCoordinateColor != "string" ||
    typeof Notation != "number"
  ) {
    throw TypeError();
  }
  let i = 0;
  let x = 0,
    y = 0;
  let index_x = 0,
    index_y = 0;
  let drawbottom = false;
  let drawtop = false;
  let drawside = false;
  let bottomdirection = FORWARD;
  let topdirection = FORWARD;
  let sidedirection = FORWARD;
  let bottomtext = ARABIC_NUMBER;
  let sidetext = ARABIC_NUMBER;
  let toptext = ARABIC_NUMBER;
  let coordinates = NUMBER_ARABIC;
  let fontsize = Math.min(0.2 * SquarePixelWidth, 0.2 * SquarePixelHeight);
  if (Notation == NOTATION_CHESS) {
    drawbottom = true;
    drawside = true;
    bottomdirection = FORWARD;
    sidedirection = BACKWARD;
    bottomtext = ENGLISH_LETTER;
    sidetext = ARABIC_NUMBER;
  } else if (Notation == NOTATION_SHOGI) {
    drawtop = true;
    drawside = true;
    topdirection = BACKWARD;
    sidedirection = FORWARD;
    toptext = ARABIC_NUMBER;
    sidetext = ENGLISH_LETTER;
  } else if (Notation == NOTATION_SHOGI_HANZI) {
    drawtop = true;
    drawside = true;
    topdirection = BACKWARD;
    sidedirection = FORWARD;
    toptext = ARABIC_NUMBER;
    sidetext = CHINESE_LETTER;
  } else if (Notation == NOTATION_SHOGI_NUMBER) {
    drawtop = true;
    drawside = true;
    topdirection = BACKWARD;
    sidedirection = FORWARD;
    toptext = ARABIC_NUMBER;
    sidetext = ARABIC_NUMBER;
  } else if (Notation == NOTATION_JANGGI) {
    drawbottom = true;
    drawside = true;
    bottomdirection = FORWARD;
    sidedirection = BACKWARD;
    bottomtext = ARABIC_NUMBER;
    sidetext = ARABIC_NUMBER;
  } else if (Notation == NOTATION_XIANGQI) {
    drawtop = true;
    drawbottom = true;
    topdirection = FlipBoard ? BACKWARD : FORWARD;
    bottomdirection = FlipBoard ? FORWARD : BACKWARD;
    toptext = ARABIC_NUMBER;
    bottomtext = ARABIC_NUMBER;
  } else if (Notation == NOTATION_XIANGQI_HANZI) {
    drawtop = true;
    drawbottom = true;
    topdirection = FlipBoard ? BACKWARD : FORWARD;
    bottomdirection = FlipBoard ? FORWARD : BACKWARD;
    toptext = ARABIC_NUMBER;
    bottomtext = CHINESE_LETTER;
  } else if (Notation == NOTATION_THAI) {
    drawbottom = true;
    drawside = true;
    bottomdirection = FORWARD;
    sidedirection = BACKWARD;
    bottomtext = THAI_LETTER;
    sidetext = THAI_NUMBER;
  }
  if (drawbottom) {
    if (bottomtext == ARABIC_NUMBER) {
      coordinates = NUMBER_ARABIC;
    } else if (bottomtext == ENGLISH_LETTER) {
      coordinates = LETTER_ENGLISH;
    } else if (bottomtext == CHINESE_LETTER) {
      coordinates = LETTER_CHINESE;
    } else if (bottomtext == THAI_NUMBER) {
      coordinates = NUMBER_THAI;
    } else if (bottomtext == THAI_LETTER) {
      coordinates = LETTER_THAI;
    }
    if (
      (bottomdirection == FORWARD && !FlipBoard) ||
      (bottomdirection == BACKWARD && FlipBoard)
    ) {
      x = BoardStartX + (7 * SquarePixelWidth) / 8;
      y = BoardStartY + SquarePixelHeight * BoardHeight - SquarePixelHeight / 8;
      if (FlipBoard) {
        index_x = BoardWidth;
        index_y = BoardHeight;
      } else {
        index_x = 1;
        index_y = 1;
      }
      CanvasContext2D.font = `${fontsize}px Arial`;
      for (i = 0; i < BoardWidth; i++) {
        if ((index_x & 1) == (index_y & 1)) {
          CanvasContext2D.fillStyle = DarkSquareCoordinateColor;
        } else {
          CanvasContext2D.fillStyle = LightSquareCoordinateColor;
        }
        CanvasContext2D.fillText(coordinates[i], x, y, SquarePixelWidth / 4);
        x += SquarePixelWidth;
        if (FlipBoard) {
          index_x--;
        } else {
          index_x++;
        }
      }
      CanvasContext2D.fillStyle = "";
      CanvasContext2D.font = "";
    } else {
      x = BoardStartX + BoardWidth * SquarePixelWidth - SquarePixelWidth / 8;
      y = BoardStartY + SquarePixelHeight * BoardHeight - SquarePixelHeight / 8;
      if (FlipBoard) {
        index_x = 1;
        index_y = BoardHeight;
      } else {
        index_x = BoardWidth;
        index_y = 1;
      }
      CanvasContext2D.font = `${fontsize}px Arial`;
      for (i = 0; i < BoardWidth; i++) {
        if ((index_x & 1) == (index_y & 1)) {
          CanvasContext2D.fillStyle = DarkSquareCoordinateColor;
        } else {
          CanvasContext2D.fillStyle = LightSquareCoordinateColor;
        }
        CanvasContext2D.fillText(coordinates[i], x, y, SquarePixelWidth / 4);
        x -= SquarePixelWidth;
        if (FlipBoard) {
          index_x++;
        } else {
          index_x--;
        }
      }
      CanvasContext2D.fillStyle = "";
      CanvasContext2D.font = "";
    }
  }
  if (drawside) {
    if (sidetext == ARABIC_NUMBER) {
      coordinates = NUMBER_ARABIC;
    } else if (sidetext == ENGLISH_LETTER) {
      coordinates = LETTER_ENGLISH;
    } else if (sidetext == CHINESE_LETTER) {
      coordinates = LETTER_CHINESE;
    } else if (sidetext == THAI_NUMBER) {
      coordinates = NUMBER_THAI;
    } else if (sidetext == THAI_LETTER) {
      coordinates = LETTER_THAI;
    }
    if (
      (sidedirection == FORWARD && !FlipBoard) ||
      (sidedirection == BACKWARD && FlipBoard)
    ) {
      x = BoardStartX + BoardWidth * SquarePixelWidth - SquarePixelWidth / 8;
      y = BoardStartY + SquarePixelHeight / 8;
      if (FlipBoard) {
        index_x = 1;
        index_y = 1;
      } else {
        index_x = BoardWidth;
        index_y = BoardHeight;
      }
      CanvasContext2D.font = `${fontsize}px Arial`;
      for (i = 0; i < BoardHeight; i++) {
        if ((index_x & 1) == (index_y & 1)) {
          CanvasContext2D.fillStyle = DarkSquareCoordinateColor;
        } else {
          CanvasContext2D.fillStyle = LightSquareCoordinateColor;
        }
        CanvasContext2D.fillText(coordinates[i], x, y, SquarePixelWidth / 4);
        y += SquarePixelHeight;
        if (FlipBoard) {
          index_y++;
        } else {
          index_y--;
        }
      }
      CanvasContext2D.fillStyle = "";
      CanvasContext2D.font = "";
    } else {
      x = BoardStartX + BoardWidth * SquarePixelWidth - SquarePixelWidth / 8;
      y =
        BoardStartY +
        SquarePixelHeight * BoardHeight -
        (7 * SquarePixelHeight) / 8;
      if (FlipBoard) {
        index_x = 1;
        index_y = BoardHeight;
      } else {
        index_x = BoardWidth;
        index_y = 1;
      }
      CanvasContext2D.font = `${fontsize}px Arial`;
      for (i = 0; i < BoardHeight; i++) {
        if ((index_x & 1) == (index_y & 1)) {
          CanvasContext2D.fillStyle = DarkSquareCoordinateColor;
        } else {
          CanvasContext2D.fillStyle = LightSquareCoordinateColor;
        }
        CanvasContext2D.fillText(coordinates[i], x, y, SquarePixelWidth / 4);
        y -= SquarePixelHeight;
        if (FlipBoard) {
          index_y--;
        } else {
          index_y++;
        }
      }
      CanvasContext2D.fillStyle = "";
      CanvasContext2D.font = "";
    }
  }
  if (drawtop) {
    if (toptext == ARABIC_NUMBER) {
      coordinates = NUMBER_ARABIC;
    } else if (toptext == ENGLISH_LETTER) {
      coordinates = LETTER_ENGLISH;
    } else if (toptext == CHINESE_LETTER) {
      coordinates = LETTER_CHINESE;
    } else if (toptext == THAI_NUMBER) {
      coordinates = NUMBER_THAI;
    } else if (toptext == THAI_LETTER) {
      coordinates = LETTER_THAI;
    }
    if (
      (topdirection == FORWARD && !FlipBoard) ||
      (topdirection == BACKWARD && FlipBoard)
    ) {
      x = BoardStartX + SquarePixelWidth / 8;
      y = BoardStartY + SquarePixelHeight / 8;
      if (FlipBoard) {
        index_x = BoardWidth;
        index_y = 1;
      } else {
        index_x = 1;
        index_y = BoardHeight;
      }
      CanvasContext2D.font = `${fontsize}px Arial`;
      for (i = 0; i < BoardWidth; i++) {
        if ((index_x & 1) == (index_y & 1)) {
          CanvasContext2D.fillStyle = DarkSquareCoordinateColor;
        } else {
          CanvasContext2D.fillStyle = LightSquareCoordinateColor;
        }
        CanvasContext2D.fillText(coordinates[i], x, y, SquarePixelWidth / 4);
        x += SquarePixelWidth;
        if (FlipBoard) {
          index_x--;
        } else {
          index_x++;
        }
      }
      CanvasContext2D.fillStyle = "";
      CanvasContext2D.font = "";
    } else {
      x =
        BoardStartX +
        BoardWidth * SquarePixelWidth -
        (7 * SquarePixelWidth) / 8;
      y = BoardStartY + SquarePixelHeight / 8;
      if (FlipBoard) {
        index_x = 1;
        index_y = 1;
      } else {
        index_x = BoardWidth;
        index_y = BoardHeight;
      }
      CanvasContext2D.font = `${fontsize}px Arial`;
      for (i = 0; i < BoardWidth; i++) {
        if ((index_x & 1) == (index_y & 1)) {
          CanvasContext2D.fillStyle = DarkSquareCoordinateColor;
        } else {
          CanvasContext2D.fillStyle = LightSquareCoordinateColor;
        }
        CanvasContext2D.fillText(coordinates[i], x, y, SquarePixelWidth / 4);
        x -= SquarePixelWidth;
        if (FlipBoard) {
          index_x++;
        } else {
          index_x--;
        }
      }
      CanvasContext2D.fillStyle = "";
      CanvasContext2D.font = "";
    }
  }
}

export function GenerateBoardImage(
  StatelessFEN,
  LastMove,
  CheckedSquares,
  HasPocket,
  Orientation,
  BoardWidth,
  BoardHeight,
  CoordinateNotation,
  LightSquareCoordinateColor,
  DarkSquareCoordinateColor,
  ShowPlayerInformation,
  FirstPlayerName,
  SecondPlayerName,
  FirstPlayerRepresentativePiece,
  SecondPlayerRepresentativePiece,
  SideToMove,
  PieceImageURLMap,
  BoardImageURL,
  ImageWidth,
  ImageHeight,
  OnFinishedCallback,
) {
  if (
    typeof StatelessFEN != "string" ||
    typeof LastMove != "string" ||
    !(CheckedSquares instanceof Array) ||
    typeof HasPocket != "boolean" ||
    typeof Orientation != "string" ||
    typeof BoardWidth != "number" ||
    typeof BoardHeight != "number" ||
    typeof CoordinateNotation != "number" ||
    typeof LightSquareCoordinateColor != "string" ||
    typeof DarkSquareCoordinateColor != "string" ||
    typeof ShowPlayerInformation != "boolean" ||
    typeof FirstPlayerName != "string" ||
    typeof SecondPlayerName != "string" ||
    typeof FirstPlayerRepresentativePiece != "string" ||
    typeof SecondPlayerRepresentativePiece != "string" ||
    typeof SideToMove != "string" ||
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
  let fenparts = GetBoardAndPocket(StatelessFEN);
  let pieces = ParseFEN(fenparts.board);
  let pocket = CountCharacters(fenparts.pocket);
  let lastmove = ConvertMoveToCoordinate(LastMove, BoardHeight);
  let whitepocket = [...pocket.white.keys()];
  let blackpocket = [...pocket.black.keys()];
  let pocketsize = Math.max(whitepocket.length, blackpocket.length);
  let totalcount =
    pieces.length +
    whitepocket.length +
    blackpocket.length +
    (ShowPlayerInformation ? 2 : 0);
  let displaywidth = Math.max(BoardWidth, pocketsize);
  let displayheight =
    BoardHeight + (HasPocket ? 2 : 0) + (ShowPlayerInformation ? 2 : 0);
  let squarepixelwidth = ImageWidth / displaywidth;
  let squarepixelheight = ImageHeight / displayheight;
  let noflipboard = Orientation == "white";
  let checkedsquarescoordinate = [];
  let boardYoffset =
    (HasPocket ? squarepixelheight : 0) +
    (ShowPlayerInformation ? squarepixelheight : 0);
  let pocketYoffset = ShowPlayerInformation ? squarepixelheight : 0;
  let fontsize = Math.min(0.3 * squarepixelwidth, 0.3 * squarepixelheight);
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
    let boardpixelwidth = squarepixelwidth * BoardWidth;
    let boardpixelheight = squarepixelheight * BoardHeight;
    if (!noflipboard) {
      ctx.translate(boardpixelwidth / 2, boardYoffset + boardpixelheight / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-boardpixelwidth / 2, -boardYoffset - boardpixelheight / 2);
    }
    ctx.drawImage(boardimg, 0, boardYoffset, boardpixelwidth, boardpixelheight);

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    //Board Coordinates
    DrawCoordinatesOnBoard(
      ctx,
      !noflipboard,
      BoardWidth,
      BoardHeight,
      squarepixelwidth,
      squarepixelheight,
      0,
      boardYoffset,
      LightSquareCoordinateColor,
      DarkSquareCoordinateColor,
      CoordinateNotation,
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
            piecechar = "+" + piecechar;
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
            if (IsImageURLValid(imgurl)) {
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
            boardYoffset + j * squarepixelheight,
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
            if (IsImageURLValid(imgurl)) {
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
            boardYoffset + (BoardHeight - j - 1) * squarepixelheight,
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
    if (noflipboard) {
      for (i = 0; i < blackpocket.length; i++) {
        piecechar = blackpocket[i];
        (function (x, count, imgurl) {
          if (IsImageURLValid(imgurl)) {
            const pieceimg = new Image();
            pieceimg.onload = () => {
              ctx.fillStyle = "#888";
              ctx.fillRect(
                x,
                pocketYoffset,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "";
              ctx.drawImage(
                pieceimg,
                x,
                pocketYoffset,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "#d85000";
              ctx.fillRect(
                x + (2 * squarepixelwidth) / 3,
                pocketYoffset + (2 * squarepixelheight) / 3,
                squarepixelwidth / 3,
                squarepixelheight / 3,
              );
              ctx.fillStyle = "#fff";
              ctx.font = `${fontsize}px Arial`;
              ctx.fillText(
                String(count),
                x + (5 / 6) * squarepixelwidth,
                pocketYoffset + (5 / 6) * squarepixelheight,
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
          if (IsImageURLValid(imgurl)) {
            const pieceimg = new Image();
            pieceimg.onload = () => {
              ctx.fillStyle = "#888";
              ctx.fillRect(
                x,
                ImageHeight - pocketYoffset - squarepixelheight,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "";
              ctx.drawImage(
                pieceimg,
                x,
                ImageHeight - pocketYoffset - squarepixelheight,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "#d85000";
              ctx.fillRect(
                x + (2 * squarepixelwidth) / 3,
                ImageHeight - pocketYoffset - squarepixelheight / 3,
                squarepixelwidth / 3,
                squarepixelheight / 3,
              );
              ctx.fillStyle = "#fff";
              ctx.font = `${fontsize}px Arial`;
              ctx.fillText(
                String(count),
                x + (5 / 6) * squarepixelwidth,
                ImageHeight - pocketYoffset - squarepixelheight / 6,
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
          if (IsImageURLValid(imgurl)) {
            const pieceimg = new Image();
            pieceimg.onload = () => {
              ctx.fillStyle = "#888";
              ctx.fillRect(
                x,
                pocketYoffset,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "";
              ctx.drawImage(
                pieceimg,
                x,
                pocketYoffset,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "#d85000";
              ctx.fillRect(
                x + (2 * squarepixelwidth) / 3,
                pocketYoffset + (2 * squarepixelheight) / 3,
                squarepixelwidth / 3,
                squarepixelheight / 3,
              );
              ctx.fillStyle = "#fff";
              ctx.font = `${fontsize}px Arial`;
              ctx.fillText(
                String(count),
                x + (5 / 6) * squarepixelwidth,
                pocketYoffset + (5 / 6) * squarepixelheight,
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
          if (IsImageURLValid(imgurl)) {
            const pieceimg = new Image();
            pieceimg.onload = () => {
              ctx.fillStyle = "#888";
              ctx.fillRect(
                x,
                ImageHeight - pocketYoffset - squarepixelheight,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "";
              ctx.drawImage(
                pieceimg,
                x,
                ImageHeight - pocketYoffset - squarepixelheight,
                squarepixelwidth,
                squarepixelheight,
              );
              ctx.fillStyle = "#d85000";
              ctx.fillRect(
                x + (2 * squarepixelwidth) / 3,
                ImageHeight - pocketYoffset - squarepixelheight / 3,
                squarepixelwidth / 3,
                squarepixelheight / 3,
              );
              ctx.fillStyle = "#fff";
              ctx.font = `${fontsize}px Arial`;
              ctx.fillText(
                String(count),
                x + (5 / 6) * squarepixelwidth,
                ImageHeight - pocketYoffset - squarepixelheight / 6,
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

  //Player information
  if (ShowPlayerInformation) {
    let namefontsize = 0.3 * squarepixelheight;
    ctx.fillStyle = "#f0f8ff";
    ctx.fillRect(0, 0, ImageWidth, squarepixelheight);
    ctx.fillRect(
      0,
      ImageHeight - squarepixelheight,
      ImageWidth,
      squarepixelheight,
    );
    ctx.fillStyle = "#778899";
    if (
      (noflipboard && SideToMove == "white") ||
      (!noflipboard && SideToMove == "black")
    ) {
      ctx.fillRect(
        0,
        ImageHeight - squarepixelheight,
        squarepixelwidth,
        squarepixelheight,
      );
    } else {
      ctx.fillRect(0, 0, squarepixelwidth, squarepixelheight);
    }
    ctx.fillStyle = "#000";
    ctx.font = `${namefontsize}px Arial`;
    let firstplayernametextsize = ctx.measureText(FirstPlayerName);
    let secondplayernametextsize = ctx.measureText(SecondPlayerName);
    if (firstplayernametextsize.width > ImageWidth - squarepixelwidth) {
      ctx.font = `${(namefontsize * (ImageWidth - squarepixelwidth)) / firstplayernametextsize.width}px Arial`;
    }
    if (noflipboard) {
      ctx.fillText(
        FirstPlayerName,
        squarepixelwidth + 0.5 * (ImageWidth - squarepixelwidth),
        ImageHeight - squarepixelheight / 2,
      );
    } else {
      ctx.fillText(
        FirstPlayerName,
        squarepixelwidth + 0.5 * (ImageWidth - squarepixelwidth),
        squarepixelheight / 2,
      );
    }
    ctx.font = `${namefontsize}px Arial`;
    if (secondplayernametextsize.width > ImageWidth - squarepixelwidth) {
      ctx.font = `${(namefontsize * (ImageWidth - squarepixelwidth)) / secondplayernametextsize.width}px Arial`;
    }
    if (noflipboard) {
      ctx.fillText(
        SecondPlayerName,
        squarepixelwidth + 0.5 * (ImageWidth - squarepixelwidth),
        squarepixelheight / 2,
      );
    } else {
      ctx.fillText(
        SecondPlayerName,
        squarepixelwidth + 0.5 * (ImageWidth - squarepixelwidth),
        ImageHeight - squarepixelheight / 2,
      );
    }
    ctx.fillStyle = "";
    ctx.font = "";
    let imgurl = PieceImageURLMap.get(FirstPlayerRepresentativePiece);
    if (IsImageURLValid(imgurl)) {
      const pieceimg = new Image();
      pieceimg.onload = () => {
        if (noflipboard) {
          ctx.drawImage(
            pieceimg,
            0,
            ImageHeight - squarepixelheight,
            squarepixelwidth,
            squarepixelheight,
          );
        } else {
          ctx.drawImage(pieceimg, 0, 0, squarepixelwidth, squarepixelheight);
        }
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
    imgurl = PieceImageURLMap.get(SecondPlayerRepresentativePiece);
    if (IsImageURLValid(imgurl)) {
      const pieceimg = new Image();
      pieceimg.onload = () => {
        if (noflipboard) {
          ctx.drawImage(pieceimg, 0, 0, squarepixelwidth, squarepixelheight);
        } else {
          ctx.drawImage(
            pieceimg,
            0,
            ImageHeight - squarepixelheight,
            squarepixelwidth,
            squarepixelheight,
          );
        }
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
  }
}

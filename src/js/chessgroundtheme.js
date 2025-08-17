const PieceCharacters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "+A",
  "+B",
  "+C",
  "+D",
  "+E",
  "+F",
  "+G",
  "+H",
  "+I",
  "+J",
  "+K",
  "+L",
  "+M",
  "+N",
  "+O",
  "+P",
  "+Q",
  "+R",
  "+S",
  "+T",
  "+U",
  "+V",
  "+W",
  "+X",
  "+Y",
  "+Z",
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
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "+a",
  "+b",
  "+c",
  "+d",
  "+e",
  "+f",
  "+g",
  "+h",
  "+i",
  "+j",
  "+k",
  "+l",
  "+m",
  "+n",
  "+o",
  "+p",
  "+q",
  "+r",
  "+s",
  "+t",
  "+u",
  "+v",
  "+w",
  "+x",
  "+y",
  "+z",
  "*",
];
const URLCSSSyntaxMatcher = new RegExp("url\\(('|\")|('|\")\\)", "g");

function ReplaceURLCSSFunction(CSSDeclaration) {
  if (typeof CSSDeclaration != "string") {
    throw TypeError();
  }
  return CSSDeclaration.replace(URLCSSSyntaxMatcher, "");
}

export class ChessgroundThemeDetector {
  constructor(Container) {
    if (!(Container instanceof HTMLElement)) {
      throw TypeError();
    }
    let i = 0,
      item,
      elem;
    this.Container = Container;
    this.Wrapper = document.createElement("div");
    this.Wrapper.classList.value =
      "chessground-theme-detector merida blueboard board8x8";
    this.ChessgroundWrapper = document.createElement("div");
    this.ChessgroundWrapper.classList.add("cg-wrap");
    this.ChessgroundWrapper.classList.add("orientation-white");
    this.Orientation = "white";
    this.Board = document.createElement("cg-board");
    this.ChessgroundWrapper.appendChild(this.Board);
    this.Wrapper.appendChild(this.ChessgroundWrapper);
    this.Pieces = [];
    this.BoardWidth = 8;
    this.BoardHeight = 8;
    this.PieceTheme = "default";
    this.BoardTheme = "defaultboard";
    for (i = 0; i < PieceCharacters.length; i++) {
      elem = document.createElement("piece");
      item = PieceCharacters[i];
      if (item.startsWith("+")) {
        elem.classList.add(`p${item[1].toLowerCase()}-piece`);
        if (item.charCodeAt(1) >= 65 && item.charCodeAt(1) <= 90) {
          elem.classList.add("white");
        } else if (item.charCodeAt(1) >= 97 && item.charCodeAt(1) <= 122) {
          elem.classList.add("black");
        }
      } else {
        if (item == "*") {
          elem.classList.add("_-piece");
        } else {
          elem.classList.add(`${item[0].toLowerCase()}-piece`);
          if (item.charCodeAt(0) >= 65 && item.charCodeAt(0) <= 90) {
            elem.classList.add("white");
          } else if (item.charCodeAt(0) >= 97 && item.charCodeAt(0) <= 122) {
            elem.classList.add("black");
          }
        }
      }
      this.Pieces.push(elem);
      this.ChessgroundWrapper.appendChild(elem);
    }
    Container.appendChild(this.Wrapper);
  }

  destructor() {}

  SetOrientation(Orientation) {
    if (typeof Orientation != "string") {
      throw TypeError();
    }
    if (Orientation == "white") {
      this.ChessgroundWrapper.classList.add("orientation-white");
      this.ChessgroundWrapper.classList.remove("orientation-black");
    } else {
      this.ChessgroundWrapper.classList.remove("orientation-white");
      this.ChessgroundWrapper.classList.add("orientation-black");
    }
    this.Orientation = Orientation;
  }

  ToggleOrientation() {
    if (this.Orientation == "white") {
      this.ChessgroundWrapper.classList.remove("orientation-white");
      this.ChessgroundWrapper.classList.add("orientation-black");
      this.Orientation = "black";
    } else {
      this.ChessgroundWrapper.classList.add("orientation-white");
      this.ChessgroundWrapper.classList.remove("orientation-black");
      this.Orientation = "white";
    }
  }

  SetThemes(PieceThemeTag, BoardThemeTag) {
    if (typeof PieceThemeTag != "string" || typeof BoardThemeTag != "string") {
      throw TypeError();
    }
    this.PieceTheme = PieceThemeTag;
    this.BoardTheme = BoardThemeTag;
    this.Wrapper.classList.value = `chessground-theme-detector ${PieceThemeTag} ${BoardThemeTag} board${this.BoardWidth}x${this.BoardHeight}`;
  }

  SetBoardDimensions(BoardWidth, BoardHeight) {
    if (typeof BoardWidth != "number" || typeof BoardHeight != "number") {
      throw TypeError();
    }
    this.BoardWidth = BoardWidth;
    this.BoardHeight = BoardHeight;
    this.Wrapper.classList.value = `chessground-theme-detector ${this.PieceTheme} ${this.BoardTheme} board${BoardWidth}x${BoardHeight}`;
  }

  GetThemes() {
    let i = 0;
    let style = window.getComputedStyle(this.Board);
    let boardimgurl = ReplaceURLCSSFunction(style.backgroundImage);
    let pieceimgurlmap = new Map();
    for (i = 0; i < PieceCharacters.length; i++) {
      style = window.getComputedStyle(this.Pieces[i]);
      pieceimgurlmap.set(
        PieceCharacters[i],
        ReplaceURLCSSFunction(style.backgroundImage),
      );
    }
    return { board: boardimgurl, pieces: pieceimgurlmap };
  }
}

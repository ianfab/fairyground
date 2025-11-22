import { Chessground } from "chessgroundx";
import * as pocketutil from "chessgroundx/pocket";

const WHITE = true;
const BLACK = false;

export class BoardComponent {
  constructor(elements, config) {
    // elements: { el, container, pocketTop, pocketBottom }
    this.el = elements.el;
    this.container = elements.container;
    this.pocketTop = elements.pocketTop;
    this.pocketBottom = elements.pocketBottom;
    this.board = null; // The ffish board instance

    // Initialize chessground if config is provided
    if (config) {
      this.instance = Chessground(this.el, config, this.pocketTop, this.pocketBottom);
    }
  }

  initialize(variant, ffish, settings) {
    // settings: { isFischerRandom, showDests, clickClickMove, notation, events: { after, afterNewPiece, select } }
    if (this.board !== null) this.board.delete();
    
    this.board = new ffish.Board(
      variant,
      ffish.startingFen(variant),
      settings.isFischerRandom
    );

    const fenBoard = this.board.fen().split(" ")[0];
    let pocketRoles = undefined;

    if (fenBoard.includes("[")) {
      const wpocket = this.board.pocket(WHITE);
      const bpocket = this.board.pocket(BLACK);

      if (ffish.capturesToHand(variant)) {
        const pieceLetters = fenBoard.replace(/[^A-Za-z]/g, "");
        const pieceRoles = this.getPieceRoles(pieceLetters);
        pocketRoles = {
          white: pieceRoles,
          black: pieceRoles,
        };
      } else {
        pocketRoles = {
          white: this.getPieceRoles(wpocket),
          black: this.getPieceRoles(bpocket),
        };
      }
    }

    const config = {
      autoCastle: false,
      dimensions: this.getDimensions(),
      fen: fenBoard,
      movable: {
        free: true,
        showDests: settings.showDests,
        events: {
          after: settings.events.after,
          afterNewPiece: settings.events.afterNewPiece,
        },
      },
      draggable: {
        showGhost: true,
      },
      selectable: {
        enabled: settings.clickClickMove,
      },
      pocketRoles: pocketRoles,
      events: {
        select: settings.events.select,
      },
      notation: settings.notation,
    };

    this.instance = Chessground(this.el, config, this.pocketTop, this.pocketBottom);
    
    // Handle pocket visibility
    if (pocketRoles === undefined) {
      this.pocketTop.classList.add("no-inital-pocket-piece");
      this.pocketBottom.classList.add("no-inital-pocket-piece");
    } else {
      this.pocketTop.classList.remove("no-inital-pocket-piece");
      this.pocketBottom.classList.remove("no-inital-pocket-piece");
    }

    return { board: this.board, config: config, pocketRoles: pocketRoles };
  }

  getDimensions() {
    if (!this.board) {
      return {
        width: 8,
        height: 8,
      };
    }
    const fenBoard = this.board.fen().split(" ")[0];
    const ranks = fenBoard.split("/").length;
    const lastRank = fenBoard.split("/")[0].replace(/[^0-9a-z*]/gi, "");
    let files = lastRank.length;

    for (const match of lastRank.matchAll(/\d+/g)) {
      files += parseInt(match[0]) - match[0].length;
    }

    return {
      width: files,
      height: ranks,
    };
  }

  getPieceRoles(pieceLetters) {
    const uniqueLetters = new Set(pieceLetters.toLowerCase().split(""));
    return [...uniqueLetters].map((char) => char + "-piece");
  }


  reinitialize(config) {
    this.instance = Chessground(this.el, config, this.pocketTop, this.pocketBottom);
    return this.instance;
  }

  set(config) {
    this.instance.set(config);
  }

  get state() {
    return this.instance.state;
  }

  setAutoShapes(shapes) {
    this.instance.setAutoShapes(shapes);
  }

  updatePockets(dimensions, falsefen) {
    let mainboard = this.container.getElementsByTagName("cg-board")[0];
    let mainboardcontainer = this.container.getElementsByTagName("cg-container")[0];
    let css_height = mainboardcontainer.style.height;
    let css_width = mainboardcontainer.style.width;
    let state = this.instance.state;
    let pockettoplength = 0;
    let pocketbottomlength = 0;

    let elements = {
      board: mainboard,
      pocketTop: this.pocketTop,
      pocketBottom: this.pocketBottom,
      wrap: this.el,
      container: this.container,
    };

    if (state.orientation == "white") {
      pocketbottomlength = state.pocketRoles.white.length;
      pockettoplength = state.pocketRoles.black.length;
    } else {
      pocketbottomlength = state.pocketRoles.black.length;
      pockettoplength = state.pocketRoles.white.length;
    }

    let pocketlength = Math.max(pockettoplength, pocketbottomlength);

    const setStyle = (el) => {
      el.setAttribute(
        "style",
        `--pocketLength: ${pocketlength}; --files: ${dimensions.width}; --ranks: ${dimensions.height}; --cg-width: ${css_width}; --cg-height: ${css_height}`
      );
    };

    setStyle(this.pocketTop);
    setStyle(this.pocketBottom);

    pocketutil.renderPocketsInitial(state, elements, this.pocketTop, this.pocketBottom);
    pocketutil.renderPockets(state);

    setStyle(this.pocketTop);
    setStyle(this.pocketBottom);

    if (falsefen) {
      this.instance.set({
        fen: falsefen,
      });
    }
  }

  updateInnerCoordinateColor(showInnerCoords, boardSize) {
    const coordinateobj =
      this.instance.state.dom.elements.container.getElementsByTagName("coords");
    let i, j;
    let elem, childs;
    for (i = 0; i < coordinateobj.length; i++) {
      elem = coordinateobj[i];
      if (elem instanceof HTMLElement) {
        childs = elem.childNodes;
        for (j = 0; j < childs.length; j++) {
          childs.item(j).classList.remove("light");
          childs.item(j).classList.remove("dark");
        }
      }
    }
    if (!showInnerCoords) {
      return;
    }
    const size = boardSize;
    let classes, styles;
    let isblack = this.instance.state.orientation == "black";
    
    for (i = 0; i < coordinateobj.length; i++) {
      elem = coordinateobj[i];
      if (elem instanceof HTMLElement) {
        classes = elem.classList;
        styles = window.getComputedStyle(elem);
        if (classes.contains("bottom")) {
          childs = elem.childNodes;
          let startsdark = false;
          if (styles.flexDirection == "row") {
            if (isblack) {
              if ((size.width & 1) != (size.height & 1)) {
                startsdark = true;
              }
            }
          } else if (styles.flexDirection == "row-reverse") {
            if (isblack) {
              if (1 != (size.height & 1)) {
                startsdark = true;
              }
            } else {
              if ((size.width & 1) != 1) {
                startsdark = true;
              }
            }
          }
          if (startsdark) {
            for (j = 0; j < size.width; j++) {
              if (j & 1) {
                childs.item(j).classList.add("light");
              } else {
                childs.item(j).classList.add("dark");
              }
            }
          } else {
            for (j = 0; j < size.width; j++) {
              if (j & 1) {
                childs.item(j).classList.add("dark");
              } else {
                childs.item(j).classList.add("light");
              }
            }
          }
        } else if (classes.contains("top")) {
          childs = elem.childNodes;
          let startsdark = false;
          if (styles.flexDirection == "row") {
            if (isblack) {
              if ((size.width & 1) != 1) {
                startsdark = true;
              }
            } else {
              if (1 != (size.height & 1)) {
                startsdark = true;
              }
            }
          } else if (styles.flexDirection == "row-reverse") {
            if (!isblack) {
              if ((size.width & 1) != (size.height & 1)) {
                startsdark = true;
              }
            }
          }
          if (startsdark) {
            for (j = 0; j < size.width; j++) {
              if (j & 1) {
                childs.item(j).classList.add("light");
              } else {
                childs.item(j).classList.add("dark");
              }
            }
          } else {
            for (j = 0; j < size.width; j++) {
              if (j & 1) {
                childs.item(j).classList.add("dark");
              } else {
                childs.item(j).classList.add("light");
              }
            }
          }
        } else if (classes.contains("side")) {
          childs = elem.childNodes;
          let startsdark = false;
          if (styles.flexDirection == "column") {
            if (!isblack) {
              if ((size.width & 1) != (size.height & 1)) {
                startsdark = true;
              }
            }
          } else if (styles.flexDirection == "column-reverse") {
            if (isblack) {
              if (1 != (size.height & 1)) {
                startsdark = true;
              }
            } else {
              if ((size.width & 1) != 1) {
                startsdark = true;
              }
            }
          }
          if (startsdark) {
            for (j = 0; j < size.height; j++) {
              if (j & 1) {
                childs.item(j).classList.add("light");
              } else {
                childs.item(j).classList.add("dark");
              }
            }
          } else {
            for (j = 0; j < size.height; j++) {
              if (j & 1) {
                childs.item(j).classList.add("dark");
              } else {
                childs.item(j).classList.add("light");
              }
            }
          }
        }
      }
    }
  }
}


import * as movelib from "./move.js";

const AllPGNLineCommentMatcher = new RegExp("\\:(.*?)(\r\n|\r|\n)", "g");
const AllWhiteSpacePlaceHolderMatcher = new RegExp("\x03", "g");
const AllLineSplitterMatcher = new RegExp("\r\n|\r|\n", "g");
const MoveNumberMatcher = new RegExp("(^\\d*\\.+)|(^\\d+$)", "");
const DiscreteMoveNumberMatcher = new RegExp("^\\d+\\.+$", "");
const WhiteSpaceMatcher = new RegExp("[ ]+", "");
const LineSplitterReplacer = new RegExp("\\r\\n|\\r", "g");
const SymbolLengthSorted = ["!!", "!?", "?!", "??", "!", "?"];

export function ParseSinglePGN(PGNString) {
  if (typeof PGNString != "string") {
    throw TypeError();
  }
  let texts = PGNString.replace(LineSplitterReplacer, "\n").split("\n");
  let text = "";
  let i = 0;
  let header = "";
  let index = 0;
  let value = "";
  let movetext = "";
  let headers = new Map();
  for (i = 0; i < texts.length; i++) {
    text = texts[i].trim();
    if (text == "") {
      continue;
    }
    if (text.startsWith("[") && text.endsWith("]")) {
      index = text.indexOf(" ");
      if (index < 0) {
        continue;
      }
      header = text.slice(1, index);
      value = text.slice(index + 1, -1).trim();
      if (!value.startsWith('"') || !value.endsWith('"')) {
        continue;
      }
      headers.set(header, value.slice(1, -1));
    } else {
      movetext = texts.slice(i).join(" ");
      break;
    }
  }
  return { headers: headers, moves: movetext };
}

export function ConvertSymbolToText(Symbol) {
  if (typeof Symbol != "string") {
    throw TypeError();
  }
  let num = 0;
  if (Symbol.startsWith("$")) {
    num = parseInt(Symbol[1]);
  } else {
    num = parseInt(Symbol[0]);
  }
  return movelib.Symbols[num];
}

export function GetSymbolFromMove(MoveText) {
  if (typeof MoveText != "string") {
    throw TypeError();
  }
  let i = 0;
  for (i = 0; i < SymbolLengthSorted.length; i++) {
    if (MoveText.endsWith(SymbolLengthSorted[i])) {
      return {
        move: MoveText.slice(0, -SymbolLengthSorted[i].length),
        symbol: SymbolLengthSorted[i],
      };
    }
  }
  return { move: MoveText, symbol: null };
}

function IsBracketEnclosureCorrect(Text) {
  if (typeof Text != "string") {
    throw TypeError();
  }
  let stack = [];
  let i = 0;
  let ch;
  for (i = 0; i < Text.length; i++) {
    ch = Text[i];
    if (ch == "(" || ch == "[" || ch == "{") {
      stack.push(ch);
    } else if (ch == ")") {
      if (stack.pop() != "(") {
        return false;
      }
    } else if (ch == "]") {
      if (stack.pop() != "[") {
        return false;
      }
    } else if (ch == "}") {
      if (stack.pop() != "{") {
        return false;
      }
    }
  }
  return stack.length == 0;
}

function PreprocessPGN(MovesText) {
  if (typeof MovesText != "string") {
    throw TypeError();
  }
  let i = 0;
  let isinbracket = 0;
  let result = [];
  for (i = 0; i < MovesText.length; i++) {
    if (MovesText[i] == " ") {
      if (isinbracket > 0) {
        result.push("\x03");
        continue;
      }
    } else if (MovesText[i] == "{") {
      isinbracket++;
      if (isinbracket == 1) {
        result.push(" {");
        continue;
      }
    } else if (MovesText[i] == "}") {
      isinbracket--;
      if (isinbracket == 0) {
        result.push("} ");
        continue;
      }
    } else if (MovesText[i] == "(") {
      if (isinbracket == 0) {
        result.push(" ( ");
        continue;
      }
    } else if (MovesText[i] == ")") {
      if (isinbracket == 0) {
        result.push(" ) ");
        continue;
      }
    }
    result.push(MovesText[i]);
  }
  return result.join("");
}

export function ParsePGNMovesToMoveTree(
  MovesText,
  Variant,
  IsFischerRandom,
  InitialFEN,
  Notation,
  FFishJSLibrary,
) {
  if (
    typeof MovesText != "string" ||
    typeof Variant != "string" ||
    typeof IsFischerRandom != "boolean" ||
    typeof InitialFEN != "string" ||
    Notation == null ||
    FFishJSLibrary == null
  ) {
    throw TypeError();
  }
  if (!IsBracketEnclosureCorrect(MovesText)) {
    console.error("Error parsing PGN: Bad bracket enclosure.");
    return null;
  }
  const fen =
    InitialFEN == "" ? FFishJSLibrary.startingFen(Variant) : InitialFEN;
  if (FFishJSLibrary.validateFen(fen, Variant, IsFischerRandom) < 0) {
    console.error("Error parsing PGN: Illegal FEN: " + fen);
    return null;
  }
  const WHITE = 0;
  const BLACK = 1;
  let fenlist = fen.split(" ");
  let initialmovenumber = parseInt(fenlist[fenlist.length - 1]);
  let sidetomove = WHITE;
  if (isNaN(initialmovenumber)) {
    console.error("Error parsing PGN: Illegal FEN: " + fen);
    return null;
  }
  if (fenlist[1] == "b") {
    sidetomove = BLACK;
  }
  let board = new FFishJSLibrary.Board(Variant, fen, IsFischerRandom);
  let tree = new movelib.MoveTree();
  let i = 0;
  let items = PreprocessPGN(MovesText)
    .trim()
    .replace(AllPGNLineCommentMatcher, " ")
    .replace(AllLineSplitterMatcher, " ")
    .split(WhiteSpaceMatcher);
  let content = "";
  let aftermovenum = false;
  let stack = [];
  let pointer = tree.RootNode;
  let move = null;
  let symbolnum = 0;
  let addingvariation = false;
  let textbefore = [];
  let moveandsymbol = null;
  let movestack = "";
  let lastmoveindex = 0;
  let pointerandmovestack = null;
  tree.SetInitialCondition(initialmovenumber, sidetomove, 2);
  for (i = 0; i < items.length; i++) {
    if (DiscreteMoveNumberMatcher.test(items[i])) {
      if (aftermovenum) {
        console.warn("A move number is next to previous one: ", content);
      }
      aftermovenum = true;
      continue;
    }
    content = items[i].replace(MoveNumberMatcher, "");
    if (content == "") {
      continue;
    }
    if (content.startsWith("{") && content.endsWith("}")) {
      if (pointer == tree.RootNode || addingvariation || aftermovenum) {
        textbefore.push(
          content.slice(1, -1).replace(AllWhiteSpacePlaceHolderMatcher, " "),
        );
      } else {
        pointer.Move.TextAfter += content
          .slice(1, -1)
          .replace(AllWhiteSpacePlaceHolderMatcher, " ");
      }
    } else if (content.startsWith("$")) {
      if (pointer == tree.RootNode || addingvariation || aftermovenum) {
        console.warn("A numeric annotation glyph must be added after a move.");
        continue;
      } else if (pointer.Move.Symbol != "") {
        console.warn("Symbol already defined for move: ", pointer.Move.Move);
        continue;
      }
      symbolnum = parseInt(content.slice(1));
      if (isNaN(symbolnum)) {
        console.warn("Illegal numeric annotation glyph: " + content);
        continue;
      }
      if (symbolnum < 0 || symbolnum > 139) {
        console.warn("Not supported numeric annotation glyph: " + content);
        continue;
      }
      pointer.Move.SetSymbol(symbolnum);
    } else if (
      content == "*" ||
      content == "1-0" ||
      content == "0-1" ||
      content == "1/2-1/2"
    ) {
      if (i < items.length - 1) {
        console.error(
          "Error parsing PGN: Game result can be only added at the end of moves.",
        );
        board.delete();
        return null;
      }
    } else if (content == "(") {
      if (pointer == tree.RootNode || addingvariation || aftermovenum) {
        console.error(
          "Error parsing PGN: A variation line must be added after a move.",
        );
        board.delete();
        return null;
      }
      stack.push({ currentnode: pointer, movestack: movestack });
      addingvariation = true;
    } else if (content == ")") {
      if (addingvariation) {
        console.error("Error parsing PGN: Cannot add empty variation lines.");
        board.delete();
        return null;
      } else if (aftermovenum) {
        console.error(
          "Error parsing PGN: A move must exist after move number.",
        );
        board.delete();
        return null;
      }
      pointerandmovestack = stack.pop();
      pointer = pointerandmovestack.currentnode;
      movestack = pointerandmovestack.movestack;
      board.setFen(fen);
      board.pushMoves(movestack);
    } else {
      if (addingvariation) {
        board.pop();
      }
      aftermovenum = false;
      moveandsymbol = GetSymbolFromMove(content);
      if (!board.pushSan(moveandsymbol.move, Notation)) {
        console.error("Error parsing PGN: Illegal move: " + moveandsymbol.move);
        board.delete();
        return null;
      }
      movestack = board.moveStack();
      lastmoveindex = movestack.lastIndexOf(" ");
      if (lastmoveindex < 0) {
        move = new movelib.Move(movestack, 0, 0);
      } else {
        move = new movelib.Move(movestack.slice(lastmoveindex + 1), 0, 0);
      }
      if (textbefore.length > 0) {
        move.TextBefore = textbefore.join(" ");
        textbefore = [];
      }
      if (moveandsymbol.symbol) {
        move.Symbol = moveandsymbol.symbol;
      }
      if (addingvariation) {
        pointer = pointer.ParentNode();
        pointer.AddVariationNode(new movelib.MoveTreeNode(move, pointer, []));
        addingvariation = false;
        pointer = pointer.NextNodes[pointer.NextNodes.length - 1];
      } else {
        pointer.AddMainNode(new movelib.MoveTreeNode(move, pointer, []));
        pointer = pointer.NextMainNode();
      }
    }
  }
  pointer = tree.RootNode;
  while (pointer.NextMainNode()) {
    pointer = pointer.NextMainNode();
    tree.MainLineMove.push(pointer.Move.Move);
  }
  board.delete();
  return tree;
}

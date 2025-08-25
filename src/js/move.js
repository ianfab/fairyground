export const SpecialMoves = ["win", "draw", "lose", "resign", "(", ")"];
export const Symbols = ["!", "?", "!!", "??", "!?", "?!"];
export const NumericAnnotationGlyphs = [
  "",
  "!",
  "?",
  "!!",
  "??",
  "!?",
  "?!",
  "□",
  "",
  "",
  "=",
  "",
  "",
  "∞",
  "⩲",
  "⩱",
  "±",
  "∓",
  "+-",
  "-+",
  "+#",
  "-#",
  "⨀",
  "⨀",
  "",
  "",
  "○",
  "○",
  "",
  "",
  "",
  "",
  "↑↑",
  "↑↑",
  "",
  "",
  "↑",
  "↑",
  "",
  "",
  "→",
  "→",
  "",
  "",
  "=∞",
  "=∞",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "⇆",
  "⇆",
  "",
  "",
  "",
  "",
  "⨁",
  "⨁",
  "∆",
  "∇",
  "⌓",
  "<=",
  "==",
  "RR",
  "N",
  "!!!",
  "!??",
];

export function ParseUCIMove(ucimove) {
  if (typeof ucimove != "string") {
    throw TypeError;
  }
  if (ucimove == "0000" || ucimove == "") {
    return [undefined, undefined, undefined, undefined];
  }
  function SplitNumberAndLetter(move) {
    if (typeof move != "string") {
      throw TypeError();
    }
    let j = 0;
    let numstart = 0;
    let letterstart = 0;
    let state = 0;
    let nums = [];
    let letters = [];
    for (j = 0; j < move.length; j++) {
      if (state == 0) {
        if (move.charCodeAt(j) >= 48 && move.charCodeAt(j) <= 57) {
          state = 1;
          if (letterstart != j) {
            letters.push(move.substring(letterstart, j));
          }
          numstart = j;
        }
      } else {
        if (move.charCodeAt(j) >= 97 && move.charCodeAt(j) <= 122) {
          state = 0;
          if (numstart != j) {
            nums.push(move.substring(numstart, j));
          }
          letterstart = j;
        }
      }
    }
    if (state == 1) {
      if (numstart != j) {
        nums.push(move.substring(numstart, j));
      }
    } else {
      if (letterstart != j) {
        letters.push(move.substring(letterstart, j));
      }
    }
    return { numbers: nums, letters: letters };
  }
  let move = ucimove;
  let gatingmove = "";
  if (move.includes(",")) {
    let parts = move.split(",");
    let gating = parts[1];
    move = parts[0];
    let targets = SplitNumberAndLetter(gating);
    gatingmove = targets.letters[1] + targets.numbers[1];
  }
  if (move.includes("@")) {
    let indexofat = move.indexOf("@");
    return [
      move.slice(0, indexofat + 1),
      move.slice(indexofat + 1),
      "",
      gatingmove,
    ];
  }
  let additional = "";
  let lastch = move.at(-1);
  if (lastch == "+") {
    additional = "+";
    move = move.slice(0, -1);
  } else if (lastch == "-") {
    additional = "-";
    move = move.slice(0, -1);
  } else {
    let chcode = lastch.charCodeAt(0);
    if (chcode >= 97 && chcode <= 122) {
      additional = lastch;
      move = move.slice(0, -1);
    }
  }
  let target = SplitNumberAndLetter(move);
  let files = target.letters;
  let ranks = target.numbers;
  if (files.length != 2) {
    return [null, null, null, null];
  }
  if (ranks.length != 2) {
    return [null, null, null, null];
  }
  return [files[0] + ranks[0], files[1] + ranks[1], additional, gatingmove];
}

export function ParseTextActions(Text) {
  if (typeof Text != "string") {
    throw TypeError();
  }
  let index = 0,
    indexend = 0,
    indexspace = 0;
  let result = new Map();
  while (true) {
    index = Text.indexOf("[%", index);
    if (index >= 0) {
      indexend = Text.indexOf("]", index + 2);
      if (indexend >= 0) {
        indexspace = Text.indexOf(" ", index + 2);
        if (indexspace >= 0) {
          result.set(
            Text.slice(index + 2, indexspace),
            Text.slice(indexspace + 1, indexend),
          );
        }
        index = indexend + 1;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return result;
}

export class Move {
  constructor(UCIMove, MoverRound, HalfMoveNumber) {
    if (
      typeof UCIMove != "string" ||
      typeof MoverRound != "number" ||
      typeof HalfMoveNumber != "number"
    ) {
      throw TypeError();
    }
    let moveinfo = ParseUCIMove(UCIMove);
    this.Move = UCIMove;
    this.MoveInformation = moveinfo;
    this.IsDropMove = moveinfo[0] == null ? false : moveinfo[0].includes("@");
    this.Symbol = [""];
    this.TextBefore = "";
    this.TextAfter = "";
    this.HalfMoveNumber = Math.floor(HalfMoveNumber);
    this.MoverRound = Math.floor(MoverRound);
    this.HideSubsequentMoves = false;
    this.Valid =
      moveinfo[0] !== null &&
      moveinfo[1] !== null &&
      moveinfo[2] !== null &&
      moveinfo[3] !== null;
    this.Symbol.pop();
  }

  static FromString(StringifiedMove) {
    if (typeof StringifiedMove != "string") {
      throw TypeError();
    }
    let tokens = StringifiedMove.split("\x01");
    if (tokens.length == 7) {
      let result = new Move(
        tokens[0],
        parseInt(tokens[4]),
        parseInt(tokens[5]),
      );
      result.Symbol = tokens[1] == "" ? [] : tokens[1].split(",");
      result.TextBefore = tokens[2];
      result.TextAfter = tokens[3];
      result.HideSubsequentMoves = tokens[6] == "1";
      return result;
    } else if (tokens.length == 1) {
      return new Move(tokens[0], 0, 0);
    } else {
      throw SyntaxError("Illegal value for move: " + StringifiedMove);
    }
  }

  IsValid() {
    return this.Valid;
  }

  OriginalSquare() {
    return this.MoveInformation[0];
  }

  DestinationSquare() {
    return this.MoveInformation[1];
  }

  AdditionalPieceAction() {
    return this.MoveInformation[2];
  }

  WallGatingSquare() {
    return this.MoveInformation[3];
  }

  IsShogiPromotion() {
    return this.MoveInformation[2] == "+";
  }

  IsShogiDemotion() {
    return this.MoveInformation[2] == "-";
  }

  IsPawnPromotion() {
    return (
      this.MoveInformation[2].charCodeAt(0) >= 97 &&
      this.MoveInformation[2].charCodeAt(0) <= 122
    );
  }

  IsDrop() {
    return this.IsDropMove;
  }

  IsWallGatingOnly() {
    return (
      this.MoveInformation[0] == this.MoveInformation[1] &&
      this.MoveInformation[3] != ""
    );
  }

  IsPass() {
    return (
      this.MoveInformation[0] == this.MoveInformation[1] &&
      this.MoveInformation[3] == ""
    );
  }

  DroppedPieceType() {
    if (this.IsDropMove) {
      return this.MoveInformation[0][0];
    } else {
      return null;
    }
  }

  AddSymbol(SymbolIndex) {
    if (typeof SymbolIndex != "number") {
      throw TypeError();
    }
    if (SymbolIndex < 0 || SymbolIndex >= NumericAnnotationGlyphs.length) {
      throw RangeError();
    }
    this.Symbol.push(`$${SymbolIndex}`);
  }

  AddSymbolText(Symbol) {
    if (typeof Symbol != "string") {
      throw TypeError();
    }
    this.Symbol.push(`$${Symbols.indexOf(Symbol) + 1}`);
  }

  SetHalfNumber(HalfMoveNumber) {
    if (typeof HalfMoveNumber != "number") {
      throw TypeError();
    }
    this.HalfMoveNumber = Math.floor(HalfMoveNumber);
  }

  SetMoverRound(MoverRound) {
    if (typeof MoverRound != "string") {
      throw TypeError();
    }
    this.MoverRound = Math.floor(MoverRound);
  }

  SetTextBefore(Text) {
    if (typeof Text != "string") {
      throw TypeError();
    }
    this.TextBefore = Text;
  }

  SetTextAfter(Text) {
    if (typeof Text != "string") {
      throw TypeError();
    }
    this.TextAfter = Text;
  }

  AddTextBefore(Text) {
    if (typeof Text != "string") {
      throw TypeError();
    }
    if (Text == "") {
      return;
    }
    if (this.TextBefore == "") {
      this.TextBefore = Text;
    } else {
      this.TextBefore += "\x02" + Text;
    }
  }

  AddTextAfter(Text) {
    if (typeof Text != "string") {
      throw TypeError();
    }
    if (Text == "") {
      return;
    }
    if (this.TextAfter == "") {
      this.TextAfter = Text;
    } else {
      this.TextAfter += "\x02" + Text;
    }
  }

  ToString() {
    return [
      this.Move,
      this.Symbol.join(","),
      this.TextBefore,
      this.TextAfter,
      this.MoverRound,
      this.HalfMoveNumber,
      this.HideSubsequentMoves ? "1" : "0",
    ].join("\x01");
  }

  ToPGNNote(ForceShowMoveNumber, TotalMoverCount) {
    if (
      typeof ForceShowMoveNumber != "boolean" ||
      typeof TotalMoverCount != "number"
    ) {
      throw TypeError();
    }
    if (TotalMoverCount < 2) {
      throw RangeError("Total mover count must be greater than or equal to 2.");
    }
    let prefix = "";
    let suffix = "";
    let i = 0;
    if (this.TextBefore) {
      let texts = this.TextBefore.split("\x02");
      for (i = 0; i < texts.length; i++) {
        prefix += "{" + texts[i] + "} ";
      }
      if (this.MoverRound == 0) {
        prefix += `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}. `;
      } else {
        prefix += `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}... `;
      }
    } else if (ForceShowMoveNumber) {
      if (this.MoverRound == 0) {
        prefix += `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}. `;
      } else {
        prefix += `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}... `;
      }
    } else if (this.MoverRound == 0) {
      prefix += `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}. `;
    }
    if (this.Symbol) {
      suffix = this.Symbol.trim();
    }
    if (this.TextAfter) {
      let texts = this.TextAfter.split("\x02");
      for (i = 0; i < texts.length; i++) {
        suffix += " {" + texts[i] + "}";
      }
    }
    return { PGNNoteBefore: prefix, UCIMove: this.Move, PGNNoteAfter: suffix };
  }

  ToPGNToken(ForceShowMoveNumber, TotalMoverCount) {
    if (
      typeof ForceShowMoveNumber != "boolean" ||
      typeof TotalMoverCount != "number"
    ) {
      throw TypeError();
    }
    if (TotalMoverCount < 2) {
      throw RangeError("Total mover count must be greater than or equal to 2.");
    }
    let i = 0;
    let textbefore = [];
    let textafter = [];
    let symbol = "";
    let movenumber = "";
    if (this.TextBefore) {
      let texts = this.TextBefore.split("\x02");
      for (i = 0; i < texts.length; i++) {
        textbefore.push("{" + texts[i] + "} ");
      }
      if (this.MoverRound == 0) {
        movenumber = `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}. `;
      } else {
        movenumber = `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}... `;
      }
    } else if (ForceShowMoveNumber) {
      if (this.MoverRound == 0) {
        movenumber = `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}. `;
      } else {
        movenumber = `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}... `;
      }
    } else if (this.MoverRound == 0) {
      movenumber = `${Math.ceil(this.HalfMoveNumber / TotalMoverCount)}. `;
    }
    if (this.Symbol) {
      symbol = this.Symbol.trim();
    }
    if (this.TextAfter) {
      let texts = this.TextAfter.split("\x02");
      for (i = 0; i < texts.length; i++) {
        textafter.push("{" + texts[i] + "}");
      }
    }
    return {
      textbefore: textbefore,
      movenumber: movenumber,
      ucimove: this.Move,
      symbol: symbol,
      textafter: textafter,
    };
  }
}

export class MoveTreeNode {
  constructor(MoveObject, PreviousNode, NextNodes) {
    if (!(MoveObject instanceof Move)) {
      throw TypeError();
    }
    if (
      !(PreviousNode instanceof MoveTreeNode) &&
      typeof PreviousNode != "undefined"
    ) {
      throw TypeError();
    }
    if (!(NextNodes instanceof Array)) {
      throw TypeError();
    }
    this.Move = MoveObject;
    this.PreviousNode = PreviousNode;
    this.NextNodes = NextNodes.filter((value) => value instanceof MoveTreeNode);
    this.RelativePositionInParentNode = 0;
  }

  NextMainNode() {
    if (this.NextNodes.length > 0) {
      return this.NextNodes[0];
    } else {
      return null;
    }
  }

  NextVariationNode(Index) {
    if (typeof Index != "number") {
      throw TypeError();
    }
    if (Index < 0 || Index >= this.NextNodes.length) {
      return null;
    }
    return this.NextNodes[Index];
  }

  ParentNode() {
    if (this.PreviousNode instanceof MoveTreeNode) {
      return this.PreviousNode;
    } else {
      return null;
    }
  }

  IsRootNode() {
    return this.PreviousNode == undefined;
  }

  AddMainNode(NewNode) {
    if (!(NewNode instanceof MoveTreeNode)) {
      throw TypeError();
    }
    let i = 0;
    NewNode.PreviousNode = this;
    this.NextNodes.unshift(NewNode);
    for (i = 0; i < this.NextNodes.length; i++) {
      this.NextNodes[i].RelativePositionInParentNode = i;
    }
  }

  AddVariationNode(NewNode) {
    if (!(NewNode instanceof MoveTreeNode)) {
      throw TypeError();
    }
    NewNode.RelativePositionInParentNode = this.NextNodes.length;
    NewNode.PreviousNode = this;
    this.NextNodes.push(NewNode);
  }

  RemoveNode(Index) {
    if (typeof Index != "number") {
      throw TypeError();
    }
    if (Index < 0 || Index >= this.NextNodes.length) {
      return;
    }
    let i = 0;
    this.NextNodes.splice(Index, 1);
    for (i = Index; i < this.NextNodes.length; i++) {
      this.NextNodes[i].RelativePositionInParentNode = i;
    }
  }

  SetVariationNodeToMainNode(Index) {
    if (typeof Index != "number") {
      throw TypeError();
    }
    if (Index < 1 || Index >= this.NextNodes.length) {
      return;
    }
    let i = 0;
    this.NextNodes.unshift(this.NextNodes.splice(Index, 1)[0]);
    for (i = 0; i < this.NextNodes.length; i++) {
      this.NextNodes[i].RelativePositionInParentNode = i;
    }
  }

  IndexOf(NextNode) {
    let i = 0;
    for (i = 0; i < this.NextNodes.length; i++) {
      if (NextNode == this.NextNodes[i]) {
        return i;
      }
    }
    return -1;
  }
}

class MoveTreeNodeMovePair {
  constructor(TreeNode, MoveObject, IsSplitter) {
    if (
      !(TreeNode instanceof MoveTreeNode) ||
      !(MoveObject instanceof Move) ||
      typeof IsSplitter != "boolean"
    ) {
      throw TypeError();
    }
    this.IsSplitter = IsSplitter;
    this.Node = TreeNode;
    this.Move = MoveObject;
  }
}

export class MoveTree {
  constructor() {
    this.RootNode = new MoveTreeNode(new Move("", 0, 0), undefined, []);
    this.MainLineMove = [];
    this.InitialHalfMoveNumber = 0;
    this.InitialMoverRound = 0;
  }

  At(Path) {
    if (!Array.isArray(Path)) {
      throw TypeError();
    }
    let i = 0;
    let pointer = this.RootNode;
    let index;
    for (i = 0; i < Path.length; i++) {
      index = Path[i];
      if (typeof index != "number") {
        throw TypeError();
      }
      if (index < pointer.NextNodes.length) {
        pointer = pointer.NextNodes[index];
      } else {
        return null;
      }
    }
    return pointer;
  }

  SetInitialCondition(InitialMoveNumber, InitialMoverRound, TotalMoverCount) {
    if (
      typeof InitialMoveNumber != "number" ||
      typeof InitialMoverRound != "number" ||
      typeof TotalMoverCount != "number"
    ) {
      throw TypeError();
    }
    if (TotalMoverCount < 2) {
      throw RangeError("Total mover count must be greater than or equal to 2.");
    }
    if (InitialMoverRound < 0 || InitialMoverRound >= TotalMoverCount) {
      throw RangeError(
        `Illegal initial mover round: ${InitialMoverRound}. Min: 0 Max: ${TotalMoverCount - 1}`,
      );
    }
    this.InitialMoverRound = InitialMoverRound;
    this.InitialHalfMoveNumber =
      TotalMoverCount * (InitialMoveNumber - 1) + InitialMoverRound + 1;
  }

  SetInitialHalfMoveNumber(HalfMoveNumber) {
    if (typeof HalfMoveNumber != "number") {
      throw TypeError();
    }
    this.InitialHalfMoveNumber = HalfMoveNumber;
  }

  AddMainLineMove(MoveObject) {
    if (!(MoveObject instanceof Move)) {
      throw TypeError();
    }
    let element = this.RootNode;
    let i = 1;
    while (element.NextMainNode()) {
      element = element.NextMainNode();
      i++;
    }
    element.AddMainNode(new MoveTreeNode(MoveObject, element, []));
    this.MainLineMove.push(MoveObject.Move);
  }

  TakebackMainLineMove() {
    let element = this.RootNode;
    while (element.NextMainNode()) {
      element = element.NextMainNode();
    }
    if (element != this.RootNode) {
      element.ParentNode().RemoveNode(element.RelativePositionInParentNode);
      this.MainLineMove.pop();
    }
  }

  SetMainLineMoves(MoveObjectList) {
    if (!Array.isArray(MoveObjectList)) {
      throw TypeError();
    }
    this.RootNode = new MoveTreeNode(new Move("", 0, 0), undefined, []);
    this.MainLineMove = [];
    let i = 0;
    let element;
    let pointer = this.RootNode;
    for (i = 0; i < MoveObjectList.length; i++) {
      element = MoveObjectList[i];
      if (element instanceof Move) {
        this.MainLineMove.push(element.Move);
        pointer.AddMainNode(new MoveTreeNode(element, pointer, []));
        pointer = pointer.NextMainNode();
      }
    }
  }

  AddVariationMove(MoveObject, TreeNodeObject) {
    if (
      !(MoveObject instanceof Move) ||
      !(TreeNodeObject instanceof MoveTreeNode)
    ) {
      throw TypeError();
    }
    let pointer = this.RootNode;
    this.MainLineMove = [];
    TreeNodeObject.AddVariationNode(
      new MoveTreeNode(MoveObject, TreeNodeObject, []),
    );
    while (pointer.NextMainNode()) {
      pointer = pointer.NextMainNode();
      this.MainLineMove.push(pointer.Move.Move);
    }
  }

  RemoveVariationMove(TreeNodeObject) {
    if (!(TreeNodeObject instanceof MoveTreeNode)) {
      throw TypeError();
    }
    if (!TreeNodeObject.IsRootNode()) {
      let pointer = this.RootNode;
      this.MainLineMove = [];
      TreeNodeObject.ParentNode().RemoveNode(
        TreeNodeObject.RelativePositionInParentNode,
      );
      while (pointer.NextMainNode()) {
        pointer = pointer.NextMainNode();
        this.MainLineMove.push(pointer.Move.Move);
      }
    }
  }

  SetAsFirstMove(TreeNodeObject) {
    if (!(TreeNodeObject instanceof MoveTreeNode)) {
      throw TypeError();
    }
    let pointer = TreeNodeObject;
    this.RootNode.NextNodes = [TreeNodeObject];
    this.MainLineMove = [TreeNodeObject.Move.Move];
    while (pointer.NextMainNode()) {
      pointer = pointer.NextMainNode();
      this.MainLineMove.push(pointer.Move.Move);
    }
  }

  SetVariationMoveToMainMove(TreeNodeObject) {
    if (!(TreeNodeObject instanceof MoveTreeNode)) {
      throw TypeError();
    }
    if (!TreeNodeObject.IsRootNode()) {
      let pointer = this.RootNode;
      this.MainLineMove = [];
      TreeNodeObject.ParentNode().SetVariationNodeToMainNode(
        TreeNodeObject.RelativePositionInParentNode,
      );
      while (pointer.NextMainNode()) {
        pointer = pointer.NextMainNode();
        this.MainLineMove.push(pointer.Move.Move);
      }
    }
  }

  GetMoveListFromMove(TreeNodeObject) {
    if (!(TreeNodeObject instanceof MoveTreeNode)) {
      throw TypeError();
    }
    let result = [];
    let pointer = TreeNodeObject;
    while (!pointer.IsRootNode()) {
      result.unshift(pointer.Move);
      pointer = pointer.ParentNode();
    }
    return result;
  }

  IsMainLineNode(TreeNodeObject) {
    if (!(TreeNodeObject instanceof MoveTreeNode)) {
      throw TypeError();
    }
    let pointer = this.RootNode;
    while (pointer.NextMainNode()) {
      pointer = pointer.NextMainNode();
      if (TreeNodeObject == pointer) {
        return true;
      }
    }
    return false;
  }

  ToPGNTokens(TotalMoverCount) {
    if (typeof TotalMoverCount != "number") {
      throw TypeError();
    }
    if (TotalMoverCount < 2) {
      throw RangeError("Total mover count must be greater than or equal to 2.");
    }
    let result = [];
    let depth = 0;
    let startmovenumber = this.InitialHalfMoveNumber;
    let initialmoverround = this.InitialMoverRound;
    function Traverse(Node) {
      if (Node instanceof MoveTreeNode) {
        let i = 0;
        Node.Move.HalfMoveNumber = startmovenumber + depth - 1;
        Node.Move.MoverRound =
          (depth + initialmoverround - 1) % TotalMoverCount;
        if (Node.NextNodes.length > 0) {
          result.push(
            new MoveTreeNodeMovePair(
              Node.NextNodes[0],
              Node.NextNodes[0].Move,
              false,
            ),
          );
        } else {
          result.push(
            new MoveTreeNodeMovePair(Node, new Move(")", 0, 0), true),
          );
        }
        for (i = 1; i < Node.NextNodes.length; i++) {
          result.push(
            new MoveTreeNodeMovePair(Node, new Move("(", 0, 0), true),
          );
          result.push(
            new MoveTreeNodeMovePair(
              Node.NextNodes[i],
              Node.NextNodes[i].Move,
              false,
            ),
          );
          depth++;
          Traverse(Node.NextNodes[i]);
        }
        if (Node.NextNodes.length > 0) {
          depth++;
          Traverse(Node.NextNodes[0]);
        }
        depth--;
      }
    }
    Traverse(this.RootNode);
    result.pop();
    return result.filter((value) => value instanceof MoveTreeNodeMovePair);
  }

  ToString() {
    let result = [];
    function Traverse(Node) {
      if (Node instanceof MoveTreeNode) {
        let i = 0;
        if (Node.NextNodes.length > 0) {
          result.push(Node.NextNodes[0].Move.ToString());
        } else {
          result.push(")");
        }
        for (i = 1; i < Node.NextNodes.length; i++) {
          result.push("(");
          result.push(Node.NextNodes[i].Move.ToString());
          Traverse(Node.NextNodes[i]);
        }
        if (Node.NextNodes.length > 0) {
          Traverse(Node.NextNodes[0]);
        }
      }
    }
    Traverse(this.RootNode);
    result.pop();
    return result.join("\x00");
  }

  FromString(StringifiedMoveTree) {
    if (typeof StringifiedMoveTree != "string") {
      throw TypeError();
    }
    let contents = StringifiedMoveTree.trim().split("\x00");
    let i = 0;
    let content = "";
    let stack = [];
    let NewNode = new MoveTreeNode(new Move("", 0, 0), undefined, []);
    let pointer = NewNode;
    let move = null;
    let addingvariation = false;
    let bracketlevel = 0;
    for (i = 0; i < contents.length; i++) {
      content = contents[i];
      if (content == "") {
        continue;
      }
      if (content == "(") {
        if (addingvariation || i == 0) {
          throw SyntaxError("A variation line must be added after a move.");
        }
        stack.push(pointer);
        addingvariation = true;
        bracketlevel++;
      } else if (content == ")") {
        if (addingvariation) {
          throw SyntaxError("Cannot add empty variation lines.");
        }
        pointer = stack.pop();
        bracketlevel--;
        if (bracketlevel < 0) {
          throw SyntaxError("Bad bracket enclosure.");
        }
      } else {
        move = Move.FromString(content);
        if (addingvariation) {
          pointer = pointer.ParentNode();
          pointer.AddVariationNode(new MoveTreeNode(move, pointer, []));
          addingvariation = false;
          pointer = pointer.NextNodes[pointer.NextNodes.length - 1];
        } else {
          pointer.AddMainNode(new MoveTreeNode(move, pointer, []));
          pointer = pointer.NextMainNode();
        }
      }
    }
    if (bracketlevel > 0) {
      throw SyntaxError("Bad bracket enclosure.");
    }
    this.RootNode = NewNode;
    this.MainLineMove = [];
    pointer = this.RootNode;
    while (pointer.NextMainNode()) {
      pointer = pointer.NextMainNode();
      this.MainLineMove.push(pointer.Move.Move);
    }
  }

  Clone() {
    let other = new MoveTree();
    other.FromString(this.ToString());
    other.InitialHalfMoveNumber = this.InitialHalfMoveNumber;
    other.InitialMoverRound = this.InitialMoverRound;
    return other;
  }

  toString() {
    let result = [];
    function Traverse(Node) {
      if (Node instanceof MoveTreeNode) {
        let i = 0;
        if (Node.NextNodes.length > 0) {
          result.push(Node.NextNodes[0].Move.Move);
        } else {
          result.push(")");
        }
        for (i = 1; i < Node.NextNodes.length; i++) {
          result.push("(");
          result.push(Node.NextNodes[i].Move.Move);
          Traverse(Node.NextNodes[i]);
        }
        if (Node.NextNodes.length > 0) {
          Traverse(Node.NextNodes[0]);
        }
      }
    }
    Traverse(this.RootNode);
    result.pop();
    return result.join(" ");
  }
}

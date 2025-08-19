// ffish.js test using chessgroundx
const Chessground = require("chessgroundx").Chessground;
const ZIP = require("jszip");
import * as util from "chessgroundx/util";
import * as pocketutil from "chessgroundx/pocket";
import * as moveutil from "./move.js";
import * as pgnutil from "./pgn.js";
import * as imageutil from "./image.js";
import * as themeutil from "./chessgroundtheme.js";

const divMain = document.getElementsByTagName("main")[0];
const variantsIni = document.getElementById("variants-ini");
const dropdownVariant = document.getElementById("dropdown-variant");
const buttonReset = document.getElementById("reset");
const buttonFlip = document.getElementById("button-flip");
const buttonUndo = document.getElementById("undo");
const rangeVolume = document.getElementById("range-volume");
const checkboxDests = document.getElementById("check-dests");
const checkboxAdjudicate = document.getElementById("check-adjudicate");
const textFen = document.getElementById("fen");
const textMoves = document.getElementById("move");
const buttonSetFen = document.getElementById("setpos");
const buttonStop = document.getElementById("stop");
const pSetFen = document.getElementById("set");
const labelPgn = document.getElementById("label-pgn");
const labelStm = document.getElementById("label-stm");
const chessgroundContainerEl = document.getElementById(
  "chessground-container-div",
);
const chessgroundMiniContainerEl = document.getElementById(
  "chessground-mini-container-div",
);
const chessgroundMini = document.getElementById("chessground-mini");
const chessgroundMiniBoardWrapper = document.getElementById(
  "chessground-mini-board-wrapper-div",
);
const chessgroundMiniBoardOperations = document.getElementById(
  "chessground-mini-board-operation-div",
);
const chessgroundEl = document.getElementById("chessground-board");
const chessgroundMiniEl = document.getElementById("chessground-board-mini");
const pocketTopEl = document.getElementById("pocket-top");
const pocketTopMiniEl = document.getElementById("pocket-top-mini");
const pocketBottomEl = document.getElementById("pocket-bottom");
const pocketBottomMiniEl = document.getElementById("pocket-bottom-mini");
const imageGenerator = document.getElementById("imagegenerator");
const chessgroundThemeDetector = document.getElementById(
  "themedetectorcontainer",
);
const dropdownImageFileType = document.getElementById("dropdown-filetype");
const dropdownGenerationMode = document.getElementById("dropdown-genmode");
const inputImageWidth = document.getElementById("imagewidth");
const inputImageHeight = document.getElementById("imageheight");
const checkboxKeepAspectRatio = document.getElementById("keepaspectratio");
const inputImageQuality = document.getElementById("imagequality");
const inputFrameDuration = document.getElementById("frameduration");
const buttonGenerateImage = document.getElementById("generateimage");
const buttonExitImageGenerator = document.getElementById("exitimagegenerator");
const textImageGenerationProgress = document.getElementById(
  "imagegenerationprogress",
);
const displayMoves = document.getElementById("displaymoves");
const displayReady = document.getElementById("displayready");
const isReviewMode = document.getElementById("isreviewmode");
const buttonNextPosition = document.getElementById("nextposition");
const buttonPreviousPosition = document.getElementById("previousposition");
const buttonInitialPosition = document.getElementById("initialposition");
const buttonFinalPosition = document.getElementById("finalposition");
const buttonCurrentPosition = document.getElementById("currentposition");
const buttonSpecifiedPosition = document.getElementById("specifiedposition");
const inputHalfMoveNumber = document.getElementById("gotomovenum");
const buttonGameStart = document.getElementById("gamestart");
const playWhite = document.getElementById("playwhite");
const playBlack = document.getElementById("playblack");
const randomMoverWhite = document.getElementById("randommoverwhite");
const randomMoverBlack = document.getElementById("randommoverblack");
const currentBoardFen = document.getElementById("currentboardfen");
const gameResult = document.getElementById("gameresult");
const gameStatus = document.getElementById("gamestatus");
const whiteTime = document.getElementById("whitetime");
const blackTime = document.getElementById("blacktime");
const timeOutSide = document.getElementById("timeoutside");
const loadThemes = document.getElementById("loadthemes");
const initializeThemes = document.getElementById("initializethemes");
const isBoardSetup = document.getElementById("isboardsetup");
const isAdvPGNMode = document.getElementById("isadvpgnmode");
const buttonMoveTreeClear = document.getElementById("movetree-clear");
const buttonMoveTreeHideShow = document.getElementById("movetree-hideshow");
const buttonMoveTreeRemoveVariations = document.getElementById(
  "movetree-removevariations",
);
const buttonMoveTreeSetToMainBranch = document.getElementById(
  "movetree-settomainbranch",
);
const buttonMoveTreeSetAsMainLine = document.getElementById(
  "movetree-setasmainline",
);
const buttonMoveTreeCutBranch = document.getElementById("movetree-cutbranch");
const buttonMoveTreeCropBranch = document.getElementById("movetree-cropbranch");
const buttonMoveTreeCut = document.getElementById("movetree-cut");
const buttonMoveTreeCrop = document.getElementById("movetree-crop");
const buttonMoveTreeUncomment = document.getElementById("movetree-uncomment");
const buttonMoveTreeTextBefore = document.getElementById("movetree-textbefore");
const buttonMoveTreeTextAfter = document.getElementById("movetree-textafter");
const buttonMoveTreeSymbol = document.getElementById("movetree-symbol");
const buttonMoveTreeUndo = document.getElementById("movetree-undo");
const buttonMoveTreeRedo = document.getElementById("movetree-redo");
const buttonMoveTreeSave = document.getElementById("movetree-save");
const buttonMoveTreeSaveImage = document.getElementById("movetree-imagesave");
const dropdownSetPiece = document.getElementById("dropdown-setpiece");
const buttonClearBoard = document.getElementById("clearboard");
const buttonInitialBoardPosition = document.getElementById("initboardpos");
const buttonAddToPocket = document.getElementById("addtopocket");
const buttonBoardSetupCopyFEN = document.getElementById("boardsetupcopyfen");
const buttonValidatePosition = document.getElementById("validatepos");
const dropdownSideToMove = document.getElementById("dropdown-sidetomove");
const whiteOO = document.getElementById("whitekingsidecastle");
const whiteOOO = document.getElementById("whitequeensidecastle");
const blackOO = document.getElementById("blackkingsidecastle");
const blackOOO = document.getElementById("blackqueensidecastle");
const halfMoveClock = document.getElementById("halfmoveclock");
const whiteRemainingChecks = document.getElementById("whiteremainingchecks");
const blackRemainingChecks = document.getElementById("blackremainingchecks");
const currentMoveNumber = document.getElementById("currentmovenum");
const enPassantFile = document.getElementById("enpassantfile");
const enPassantRank = document.getElementById("enpassantrank");
const seirawanGatingFiles = document.getElementById("seirwangatingfiles");
const copySetFEN = document.getElementById("copysetfen");
const dropdownPositionVariantType = document.getElementById(
  "dropdown-posvarianttype",
);
const dropdownPositionVariantName = document.getElementById(
  "dropdown-posvariantname",
);
const buttonAboutPosition = document.getElementById("aboutposition");
const positionInformation = document.getElementById("positioninfo");
const clickClickMove = document.getElementById("clickclickmove");
const positionVariantTxt = document.getElementById("posvariant-txt");
const quickPromotionPiece = document.getElementById("dropdown-quickpromotion");
const buttonPassMove = document.getElementById("passmove");
const buttonPlaceWall = document.getElementById("placewall");
const dropdownVisualEffect = document.getElementById("dropdown-visualeffect");
const dropdownVisualEffectPerspective = document.getElementById(
  "dropdown-visualeffectperspective",
);
const engineOutput = document.getElementById("engineoutputline");
const setPgnString = document.getElementById("pgnstring");
const isAnalysis = document.getElementById("analysis");
const pcheckCounts = document.getElementById("checkcounts");
const evaluationBar = document.getElementById("evalbarprogress");
const evalscore = document.getElementById("cp");
const multipv = document.getElementById("multipv");
const evalinfo = document.getElementById("evalinfo");
const pvinfo = document.getElementById("pvinfo");
const availablemovelist = document.getElementById("availablemovelist");
const movesearchfilter = document.getElementById("movesearchfilter");
const issearchregexp = document.getElementById("regexp1");
const buttonsearchmove = document.getElementById("searchmove");
const origfilter = document.getElementById("origfilter");
const destfilter = document.getElementById("destfilter");
const isdrop = document.getElementById("isdrop");
const haswallgating = document.getElementById("haswallgating");
const haspiecechange = document.getElementById("haspiecechange");
const buttonmakemove = document.getElementById("makemove");
const buttonhighlightmove = document.getElementById("highlightmove");
const searchresultinfo = document.getElementById("searchresultinfo");
const dropdownNotationSystem = document.getElementById("sannotation");
const pRandomMoverGo = document.getElementById("randommovergo");
const dropdownBoardCoordinate = document.getElementById("boardcoordinate");
const checkboxFischerRandom = document.getElementById("isfischerrandommode");
const checkBoxInnerCoordinate = document.getElementById(
  "check-innercoordinate",
);
const soundMove = new Audio("assets/sound/thearst3rd/move.mp3");
const soundCapture = new Audio("assets/sound/thearst3rd/capture.mp3");
const soundCheck = new Audio("assets/sound/thearst3rd/check.mp3");
const soundTerminal = new Audio("assets/sound/thearst3rd/terminal.mp3");
const files = [
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
];
const pieces = [
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
  "*",
];
const simplenotations = [
  "DEFAULT",
  "SAN",
  "LAN",
  "SHOGI_HOSKING",
  "SHOGI_HODGES",
  "SHOGI_HODGES_NUMBER",
  "JANGGI",
  "XIANGQI_WXF",
  "THAI_SAN",
  "THAI_LAN",
];
const chessgroundnotations = [
  "ALGEBRAIC", // English letters on bottom, Arabic numbers on side
  "SHOGI_ENGLET", // Arabic numbers on top, English letters on side
  "SHOGI_ARBNUM", // Arabic numbers on top and side
  "SHOGI_HANNUM", // Arabic numbers on top, Kanji numbers on side
  "JANGGI", // Arabic numbers on bottom and side, with 0 denoting 10th rank
  "XIANGQI_ARBNUM", // Arabic numbers on top and bottom
  "XIANGQI_HANNUM", // Arabic numbers on top, Hanzi numbers on bottom
  "THAI_ALGEBRAIC", // Thai letters on bottom, Thai numbers on side
];
let ffishnotationobjects = null;
var PositionVariantsDirectory = new Map();
let EmptyMap = new Map();
let ffish = null;
let board = null;
let chessground = null;
let chessground_mini = null;
var i = 0;
const WHITE = true;
const BLACK = false;
var evaluation = 0.0;
var multipvrecord = [];
var evaluationindex = [];
const mateevalfactor = 2147483647;
const maxmultipvcount = 4096;
var recordedmultipv = 1;
var previousclicktime = Date.now();
var hasdoubleclicked = false;
var previousclicksquare = "00";
var multipvminiboardtimer = null;
//var PGNDiv = generateStaticPreviewDiv(512);

class MultiplePrincipalVariationEntry {
  constructor(IsValid, HeaderString, Variant, Is960, FEN, UCIMoves) {
    if (
      typeof IsValid != "boolean" ||
      typeof HeaderString != "string" ||
      typeof Variant != "string" ||
      typeof Is960 != "boolean" ||
      typeof FEN != "string" ||
      typeof UCIMoves != "string"
    ) {
      throw TypeError();
    }
    this.IsValid = IsValid;
    this.HeaderString = HeaderString;
    this.Variant = Variant;
    this.Is960 = Is960;
    this.FEN = FEN;
    this.UCIMoves = UCIMoves;
  }

  destructor() {}
}

class MultiplePrincipalVariationMiniBoardHandler {
  constructor() {
    this.Element = document.createElement("div");
    this.Element.classList.add("multipv-miniboard-div");
    this.StoredPrincipalVariationCount = 0;
    this.ValidPrincipalVariationCount = 0;
    this.PrincipalVariationElementList = [];
    this.PrincipalVariationDataList = [
      new MultiplePrincipalVariationEntry(false, "", "", false, "", ""),
    ];
  }

  destructor() {}

  SetValidPrincipalVariationCount(PrincipalVariationCount) {
    if (typeof PrincipalVariationCount != "number") {
      throw TypeError(
        "SetValidPrincipalVariationCount(PrincipalVariationCount:number)",
      );
    }
    this.ValidPrincipalVariationCount = PrincipalVariationCount;
  }

  SetPrincipalVariation(
    PrincipalVariationNumber,
    VariantID,
    Is960,
    CurrentBoardFEN,
    UCIMoves,
    IsMate,
    EvaluationNumber,
    Depth,
    SelectiveDepth,
  ) {
    if (
      typeof PrincipalVariationNumber != "number" ||
      typeof VariantID != "string" ||
      typeof Is960 != "boolean" ||
      typeof CurrentBoardFEN != "string" ||
      typeof UCIMoves != "string" ||
      typeof IsMate != "boolean" ||
      typeof EvaluationNumber != "number" ||
      typeof Depth != "number" ||
      typeof SelectiveDepth != "number"
    ) {
      throw TypeError(
        "SetPrincipalVariation(PrincipalVariationNumber:number, VariantID:string, Is960:boolean, CurrentBoardFEN:string, UCIMoves:string, IsMate:boolean, EvaluationNumber:number, Depth:number, SelectiveDepth:number)",
      );
    }
    let i = 0;
    if (this.PrincipalVariationDataList.length < PrincipalVariationNumber) {
      for (
        i = this.PrincipalVariationDataList.length;
        i < PrincipalVariationNumber;
        i++
      ) {
        this.PrincipalVariationDataList.push(
          new MultiplePrincipalVariationEntry(false, "", "", false, "", ""),
        );
      }
      this.ValidPrincipalVariationCount = PrincipalVariationNumber;
    }
    let selected =
      this.PrincipalVariationDataList[PrincipalVariationNumber - 1];
    let evaluation = "";
    if (IsMate) {
      if (EvaluationNumber > 0) {
        evaluation = `#+${parseInt(EvaluationNumber)}`;
      } else {
        evaluation = `#${parseInt(EvaluationNumber)}`;
      }
    } else {
      if (EvaluationNumber > 0) {
        evaluation = `+${EvaluationNumber.toFixed(2)}`;
      } else {
        evaluation = `${EvaluationNumber.toFixed(2)}`;
      }
    }
    selected.IsValid = true;
    selected.HeaderString = `${PrincipalVariationNumber == 1 ? "" : "<hr />"}Principal Variation ${PrincipalVariationNumber}: (Depth: Average ${Depth > -1 ? Depth : "❓"} Max ${SelectiveDepth > -1 ? SelectiveDepth : "❓"}) <evalnum>${evaluation}</evalnum> `;
    selected.Variant = VariantID;
    selected.Is960 = Is960;
    selected.FEN = CurrentBoardFEN;
    selected.UCIMoves = UCIMoves;
  }

  GetMovesDivElement() {
    if (
      this.PrincipalVariationDataList.length < this.ValidPrincipalVariationCount
    ) {
      throw Error("Missing PV.");
    }
    let i = 0;
    let deletelater = [];
    let selecteddata,
      selected,
      moveselem,
      notationindex,
      existingmoveelem,
      textelem,
      lineelem;
    if (
      this.PrincipalVariationElementList.length <
      this.ValidPrincipalVariationCount
    ) {
      for (
        i = this.PrincipalVariationElementList.length;
        i < this.ValidPrincipalVariationCount;
        i++
      ) {
        lineelem = document.createElement("div");
        lineelem.classList.add("multipv-miniboard-pvline");
        textelem = document.createElement("p");
        textelem.classList.add("multipv-miniboard-pvline-header");
        lineelem.appendChild(textelem);
        this.PrincipalVariationElementList.push(lineelem);
      }
    }
    if (
      this.StoredPrincipalVariationCount < this.ValidPrincipalVariationCount
    ) {
      for (
        i = this.StoredPrincipalVariationCount;
        i < this.ValidPrincipalVariationCount;
        i++
      ) {
        this.Element.appendChild(this.PrincipalVariationElementList[i]);
      }
      this.StoredPrincipalVariationCount = this.ValidPrincipalVariationCount;
    } else if (
      this.StoredPrincipalVariationCount > this.ValidPrincipalVariationCount
    ) {
      for (
        i = this.ValidPrincipalVariationCount;
        i < this.StoredPrincipalVariationCount;
        i++
      ) {
        this.Element.removeChild(this.PrincipalVariationElementList[i]);
      }
      this.StoredPrincipalVariationCount = this.ValidPrincipalVariationCount;
    }
    for (i = 0; i < this.ValidPrincipalVariationCount; i++) {
      selecteddata = this.PrincipalVariationDataList[i];
      if (selecteddata.IsValid) {
        selecteddata.IsValid = false;
        selected = this.PrincipalVariationElementList[i];
        moveselem = null;
        notationindex = simplenotations.indexOf(
          dropdownNotationSystem[dropdownNotationSystem.selectedIndex].value,
        );
        selected.childNodes.item(0).innerHTML = selecteddata.HeaderString;
        existingmoveelem = selected.childNodes.item(1);
        if (notationindex < 0) {
          if (existingmoveelem) {
            existingmoveelem.innerHTML = "";
            existingmoveelem.innerText = getNotation(
              dropdownNotationSystem[dropdownNotationSystem.selectedIndex]
                .value,
              selecteddata.Variant,
              selecteddata.FEN,
              selecteddata.Is960,
              selecteddata.UCIMoves,
              false,
            );
          } else {
            moveselem = document.createElement("div");
            moveselem.classList.add("multipv-miniboard-pvline-moves");
            moveselem.innerText = getNotation(
              dropdownNotationSystem[dropdownNotationSystem.selectedIndex]
                .value,
              selecteddata.Variant,
              selecteddata.FEN,
              selecteddata.Is960,
              selecteddata.UCIMoves,
              false,
            );
            selected.appendChild(moveselem);
          }
        } else {
          if (existingmoveelem) {
            deletelater.push(selected.removeChild(existingmoveelem));
          }
          moveselem = parseUCIMovesToPreviewElements(
            selecteddata.Variant,
            selecteddata.FEN,
            selecteddata.Is960,
            selecteddata.UCIMoves,
            `movediv-${i}`,
            ffishnotationobjects[notationindex],
            gametree.OriginalFEN,
            board.moveStack(),
          );
          moveselem.classList.add("multipv-miniboard-pvline-moves");
          selected.appendChild(moveselem);
        }
      }
    }
    setTimeout(() => {
      let tmp = deletelater;
      deletelater = null;
    }, 500);
    return this.Element;
  }
}

class GameTree {
  constructor() {
    this.MoveTree = new moveutil.MoveTree();
    this.OriginalFEN = "";
    this.Variant = "chess";
    this.Is960 = false;
    this.BlankSplitter = new RegExp("[ ]+");
    this.MoveTextActionPartsMatcher = new RegExp("\\[.*?\\]", "g");
    this.CurrentMove = this.MoveTree.RootNode;
    this.HistoryStack = [];
    this.CurrentHistory = -1;
  }

  destructor() {}

  AddHistory() {
    if (this.CurrentHistory < this.HistoryStack.length - 1) {
      this.HistoryStack.splice(this.CurrentHistory + 1);
    }
    this.HistoryStack.push({
      fen: this.OriginalFEN,
      movetree: this.MoveTree.ToString(),
      moves: this.GetMoveListOfMove(this.CurrentMove),
    });
    this.CurrentHistory = this.HistoryStack.length - 1;
  }

  UpdateHistory() {
    if (this.CurrentHistory < 0) {
      this.HistoryStack = [
        {
          fen: this.OriginalFEN,
          movetree: this.MoveTree.ToString(),
          moves: this.GetMoveListOfMove(this.CurrentMove),
        },
      ];
      this.CurrentHistory = 0;
    } else {
      this.HistoryStack[this.CurrentHistory] = {
        fen: this.OriginalFEN,
        movetree: this.MoveTree.ToString(),
        moves: this.GetMoveListOfMove(this.CurrentMove),
      };
    }
  }

  ClearHistory() {
    console.log("clear history");
    this.HistoryStack = [];
    this.CurrentHistory = -1;
  }

  Undo() {
    if (this.CurrentHistory > 0) {
      this.CurrentHistory--;
      this.OriginalFEN = this.HistoryStack[this.CurrentHistory].fen;
      this.MoveTree.FromString(this.HistoryStack[this.CurrentHistory].movetree);
      this.GoToMoveList(this.HistoryStack[this.CurrentHistory].moves);
      return true;
    }
    return false;
  }

  Redo() {
    if (this.CurrentHistory < this.HistoryStack.length - 1) {
      this.CurrentHistory++;
      this.OriginalFEN = this.HistoryStack[this.CurrentHistory].fen;
      this.MoveTree.FromString(this.HistoryStack[this.CurrentHistory].movetree);
      this.GoToMoveList(this.HistoryStack[this.CurrentHistory].moves);
      return true;
    }
    return false;
  }

  GoToMoveList(MoveList) {
    if (typeof MoveList != "string") {
      throw TypeError();
    }
    const trimmedmoves = MoveList.trim();
    let node_id = -1;
    let i = 0,
      j = 0;
    let pointer = this.MoveTree.RootNode;
    let movelist = trimmedmoves.split(this.BlankSplitter);
    if (trimmedmoves.length == 0) {
      this.CurrentMove = this.MoveTree.RootNode;
      return;
    }
    for (i = 0; i < movelist.length; i++) {
      node_id = -1;
      for (j = 0; j < pointer.NextNodes.length; j++) {
        if (pointer.NextNodes[j].Move.Move == movelist[i]) {
          node_id = j;
          break;
        }
      }
      if (node_id >= 0) {
        pointer = pointer.NextNodes[node_id];
      } else {
        break;
      }
    }
    this.CurrentMove = pointer;
  }

  SetCurrentMoveList(Variant, Is960, FEN, MoveList) {
    if (
      typeof Variant != "string" ||
      typeof Is960 != "boolean" ||
      typeof FEN != "string" ||
      typeof MoveList != "string"
    ) {
      throw TypeError();
    }
    const trimmedmoves = MoveList.trim();
    let movelist = trimmedmoves.split(this.BlankSplitter);
    let i = 0,
      j = 0;
    let node_id = -1;
    let pointer = this.MoveTree.RootNode;
    let variant = Variant == "" ? "chess" : Variant;
    let fen = FEN == "" ? ffish.startingFen(variant) : FEN;
    if (
      fen != this.OriginalFEN ||
      variant != this.Variant ||
      Is960 != this.Is960
    ) {
      this.MoveTree.RootNode.NextNodes = [];
      this.OriginalFEN = fen;
      this.Variant = variant;
      this.Is960 = Is960;
      this.ClearHistory();
    }
    if (trimmedmoves.length == 0) {
      this.CurrentMove = this.MoveTree.RootNode;
      return;
    }
    for (i = 0; i < movelist.length; i++) {
      node_id = -1;
      for (j = 0; j < pointer.NextNodes.length; j++) {
        if (pointer.NextNodes[j].Move.Move == movelist[i]) {
          node_id = j;
          break;
        }
      }
      if (node_id == -1) {
        for (j = i; j < movelist.length; j++) {
          pointer.AddVariationNode(
            new moveutil.MoveTreeNode(
              new moveutil.Move(movelist[j], 0, 0),
              undefined,
              [],
            ),
          );
          pointer = pointer.NextNodes[pointer.NextNodes.length - 1];
        }
        this.ClearHistory();
        break;
      } else {
        pointer = pointer.NextNodes[node_id];
      }
    }
    this.CurrentMove = pointer;
  }

  GetMoveListOfMove(MoveNode) {
    if (!(MoveNode instanceof moveutil.MoveTreeNode)) {
      throw TypeError();
    }
    let pointer = MoveNode;
    let moves = [];
    while (pointer != this.MoveTree.RootNode) {
      moves.unshift(pointer.Move.Move);
      pointer = pointer.PreviousNode;
    }
    return moves.join(" ");
  }

  GetCompleteMainLineMoveListOfMove(MoveNode) {
    if (!(MoveNode instanceof moveutil.MoveTreeNode)) {
      throw TypeError();
    }
    let pointer = MoveNode;
    let moves = [];
    while (pointer != this.MoveTree.RootNode) {
      if (pointer == null) {
        return null;
      }
      moves.unshift(pointer.Move.Move);
      pointer = pointer.PreviousNode;
    }
    pointer = MoveNode;
    while (pointer.NextNodes[0]) {
      pointer = pointer.NextNodes[0];
      moves.push(pointer.Move.Move);
    }
    return moves.join(" ");
  }

  GetMainLineMoveList() {
    let moves = [];
    let pointer = this.MoveTree.RootNode;
    while (pointer.NextNodes[0]) {
      pointer = pointer.NextNodes[0];
      moves.push(pointer.Move.Move);
    }
    return moves.join(" ");
  }

  ClearMoves() {
    this.UpdateHistory();
    this.MoveTree.RootNode.NextNodes = [];
    this.CurrentMove = this.MoveTree.RootNode;
    this.AddHistory();
  }

  SetCurrentMoveToMainBranch() {
    if (
      this.CurrentMove != this.MoveTree.RootNode ||
      this.CurrentMove.RelativePositionInParentNode > 0
    ) {
      this.UpdateHistory();
      this.CurrentMove.ParentNode().SetVariationNodeToMainNode(
        this.CurrentMove.RelativePositionInParentNode,
      );
      this.AddHistory();
    }
  }

  SetCurrentMoveBranchAsMainLine() {
    if (this.CurrentMove != this.MoveTree.RootNode) {
      let pointer = this.CurrentMove;
      this.UpdateHistory();
      while (pointer.PreviousNode) {
        pointer
          .ParentNode()
          .SetVariationNodeToMainNode(pointer.RelativePositionInParentNode);
        pointer = pointer.PreviousNode;
      }
      this.AddHistory();
    }
  }

  RemoveCurrentMoveBranch() {
    let pointer = this.CurrentMove;
    this.UpdateHistory();
    while (pointer.PreviousNode) {
      if (pointer.RelativePositionInParentNode != 0) {
        break;
      }
      pointer = pointer.PreviousNode;
    }
    if (pointer == this.MoveTree.RootNode) {
      this.MoveTree.RootNode.NextNodes = [];
      this.CurrentMove = this.MoveTree.RootNode;
    } else {
      pointer.ParentNode().RemoveNode(pointer.RelativePositionInParentNode);
      this.CurrentMove = pointer.PreviousNode;
    }
    this.AddHistory();
  }

  RemoveNonCurrentMoveBranch() {
    let pointer = this.CurrentMove;
    this.UpdateHistory();
    while (pointer.PreviousNode) {
      pointer.ParentNode().NextNodes = [pointer];
      pointer.RelativePositionInParentNode = 0;
      pointer = pointer.PreviousNode;
    }
    this.AddHistory();
  }

  CutCurrentMove() {
    this.UpdateHistory();
    if (this.CurrentMove == this.MoveTree.RootNode) {
      this.MoveTree.RootNode.NextNodes = [];
      this.CurrentMove = this.MoveTree.RootNode;
    } else {
      this.CurrentMove.ParentNode().RemoveNode(
        this.CurrentMove.RelativePositionInParentNode,
      );
      this.CurrentMove = this.CurrentMove.PreviousNode;
    }
    this.AddHistory();
  }

  CropCurrentMove() {
    if (this.CurrentMove == this.MoveTree.RootNode) {
      return;
    }
    let moves = [];
    let pointer = this.CurrentMove.ParentNode();
    let tmpboard = new ffish.Board(this.Variant, this.OriginalFEN, this.Is960);
    this.UpdateHistory();
    while (pointer != this.MoveTree.RootNode) {
      moves.unshift(pointer.Move.Move);
      pointer = pointer.PreviousNode;
    }
    if (moves.length > 0) {
      tmpboard.pushMoves(moves.join(" "));
    }
    this.OriginalFEN = tmpboard.fen();
    this.MoveTree.RootNode.NextNodes = [this.CurrentMove];
    this.CurrentMove.PreviousNode = this.MoveTree.RootNode;
    this.CurrentMove.RelativePositionInParentNode = 0;
    this.AddHistory();
    tmpboard.delete();
  }

  RemoveVariationsOfCurrentMove() {
    if (this.CurrentMove.NextNodes.length > 1) {
      this.UpdateHistory();
      this.CurrentMove.NextNodes = [this.CurrentMove.NextNodes[0]];
      this.AddHistory();
    }
  }

  ShowOrHideCurrentMove() {
    if (this.CurrentMove == this.MoveTree.RootNode) {
      return;
    }
    this.UpdateHistory();
    this.CurrentMove.Move.HideSubsequentMoves =
      !this.CurrentMove.Move.HideSubsequentMoves;
    this.AddHistory();
  }

  UncommentCurrentMove() {
    if (this.CurrentMove == this.MoveTree.RootNode) {
      return;
    }
    this.UpdateHistory();
    this.CurrentMove.Move.TextAfter = "";
    this.CurrentMove.Move.TextBefore = "";
    this.CurrentMove.Move.Symbol = "";
    this.AddHistory();
  }

  SetTextBeforeOfCurrentMove(TextBefore) {
    if (typeof TextBefore != "string") {
      throw TypeError();
    }
    if (this.CurrentMove == this.MoveTree.RootNode) {
      return;
    }
    this.UpdateHistory();
    this.CurrentMove.Move.TextBefore = TextBefore;
    this.AddHistory();
  }

  SetTextAfterOfCurrentMove(TextAfter) {
    if (typeof TextAfter != "string") {
      throw TypeError();
    }
    if (this.CurrentMove == this.MoveTree.RootNode) {
      return;
    }
    this.UpdateHistory();
    this.CurrentMove.Move.TextAfter = TextAfter;
    this.AddHistory();
  }

  SetSymbolOfCurrentMove(MoveSymbol) {
    if (typeof MoveSymbol != "string") {
      throw TypeError();
    }
    if (this.CurrentMove == this.MoveTree.RootNode) {
      return;
    }
    this.UpdateHistory();
    this.CurrentMove.Move.Symbol = MoveSymbol;
    this.AddHistory();
  }

  ToString(Notation, AlwaysShowResult) {
    if (Notation == null || typeof AlwaysShowResult != "boolean") {
      throw TypeError();
    }
    let fenitems = this.OriginalFEN.split(this.BlankSplitter);
    let initialmoverround = fenitems[1] == "b" ? 1 : 0;
    let initialmovenumber = parseInt(fenitems.pop());
    this.MoveTree.SetInitialCondition(initialmovenumber, initialmoverround, 2);
    let tokens = this.MoveTree.ToPGNTokens(2);
    console.log(this.MoveTree);
    let i = 0;
    let tmpboard = new ffish.Board(this.Variant, this.OriginalFEN, this.Is960);
    let result = "";
    let stack = [];
    for (i = 0; i < tokens.length; i++) {
      if (tokens[i].IsSplitter) {
        if (tokens[i].Move.Move == "(") {
          stack.push(tmpboard.moveStack());
          tmpboard.pop();
          result += "( ";
        } else if (tokens[i].Move.Move == ")") {
          tmpboard.reset();
          tmpboard.setFen(this.OriginalFEN);
          tmpboard.pushMoves(stack.pop());
          result += ") ";
        }
      } else {
        if (tokens[i].Move.TextBefore) {
          result += "{" + tokens[i].Move.TextBefore + "} ";
        }
        if (i == 0 || (i > 0 && tokens[i - 1].Move.Move == "(")) {
          if (tokens[i].Move.MoverRound == 0) {
            result += Math.ceil(tokens[i].Move.HalfMoveNumber / 2) + ". ";
          } else {
            result += Math.ceil(tokens[i].Move.HalfMoveNumber / 2) + "... ";
          }
        } else if (tokens[i].Move.MoverRound == 0) {
          result += Math.ceil(tokens[i].Move.HalfMoveNumber / 2) + ". ";
        }
        result += tmpboard.sanMove(tokens[i].Move.Move, Notation);
        tmpboard.push(tokens[i].Move.Move);
        if (tokens[i].Move.Symbol) {
          result += tokens[i].Move.Symbol + " ";
        } else {
          result += " ";
        }
        if (tokens[i].Move.TextAfter) {
          result += "{" + tokens[i].Move.TextAfter + "} ";
        }
      }
    }
    let tmpboardresult = tmpboard.result();
    if (tmpboardresult == "*") {
      if (tmpboard.result(true) != "*") {
        tmpboardresult = tmpboard.result(true);
      } else if (tmpboard.result(false) != "*") {
        tmpboardresult = tmpboard.result(false);
      }
    }
    if (AlwaysShowResult || tmpboardresult != "*") {
      result += tmpboardresult;
    }
    try {
      tmpboard.delete();
    } catch (err) {
      console.error("Caught", err);
    }
    return result.trim();
  }

  ToPGNDiv(Notation) {
    if (Notation == null) {
      throw TypeError();
    }
    let fenitems = this.OriginalFEN.split(this.BlankSplitter);
    let initialmoverround = fenitems[1] == "b" ? 1 : 0;
    let initialmovenumber = parseInt(fenitems.pop());
    this.MoveTree.SetInitialCondition(initialmovenumber, initialmoverround, 2);
    let tokens = this.MoveTree.ToPGNTokens(2);
    let i = 0;
    let tmpboard = new ffish.Board(this.Variant, this.OriginalFEN, this.Is960);
    let stack = [];
    let element = null;
    let move = null;
    let gameresult = "";
    let index = 0,
      indexend = 0;
    let boardnotes = "";
    let hidesubsequentmovelevel = 0;
    let movesparagraph = document.createElement("div");
    movesparagraph.id = "pgndiv";
    movesparagraph.classList.add("board-display-san");

    for (i = 0; i < tokens.length; i++) {
      if (tokens[i].IsSplitter) {
        if (tokens[i].Move.Move == "(") {
          stack.push(tmpboard.moveStack());
          tmpboard.pop();
          if (hidesubsequentmovelevel > 0) {
            hidesubsequentmovelevel++;
          } else {
            element = document.createElement("p");
            element.innerText = "(";
            element.classList.add("splitter");
            movesparagraph.appendChild(element);
          }
        } else if (tokens[i].Move.Move == ")") {
          tmpboard.reset();
          tmpboard.setFen(this.OriginalFEN);
          tmpboard.pushMoves(stack.pop());
          if (hidesubsequentmovelevel > 0) {
            hidesubsequentmovelevel--;
          }
          if (hidesubsequentmovelevel == 0) {
            element = document.createElement("p");
            element.innerText = ")";
            element.classList.add("splitter");
            movesparagraph.appendChild(element);
          }
        }
      } else {
        if (hidesubsequentmovelevel > 0) {
          continue;
        }
        if (tokens[i].Move.TextBefore) {
          element = document.createElement("p");
          element.innerText = tokens[i].Move.TextBefore.replace(
            this.MoveTextActionPartsMatcher,
            "",
          );
          element.classList.add("text-before");
          movesparagraph.appendChild(element);
        }
        if (i == 0 || (i > 0 && tokens[i - 1].Move.Move == "(")) {
          if (tokens[i].Move.MoverRound == 0) {
            element = document.createElement("p");
            element.innerText =
              Math.ceil(tokens[i].Move.HalfMoveNumber / 2) + ". ";
            element.classList.add("move-number");
            movesparagraph.appendChild(element);
          } else {
            element = document.createElement("p");
            element.innerText =
              Math.ceil(tokens[i].Move.HalfMoveNumber / 2) + "... ";
            element.classList.add("move-number");
            movesparagraph.appendChild(element);
          }
        } else if (tokens[i].Move.MoverRound == 0) {
          element = document.createElement("p");
          element.innerText =
            Math.ceil(tokens[i].Move.HalfMoveNumber / 2) + ". ";
          element.classList.add("move-number");
          movesparagraph.appendChild(element);
        }
        move = moveutil.ParseUCIMove(tokens[i].Move.Move);
        element = document.createElement("p");
        if (tokens[i].Move.Symbol) {
          element.innerText =
            tmpboard.sanMove(tokens[i].Move.Move, Notation) +
            tokens[i].Move.Symbol;
        } else {
          element.innerText = tmpboard.sanMove(tokens[i].Move.Move, Notation);
        }
        tmpboard.push(tokens[i].Move.Move);
        gameresult = tmpboard.result();
        if (gameresult == "*") {
          if (tmpboard.result(true) != "*") {
            gameresult = tmpboard.result(true);
          } else if (tmpboard.result(false) != "*") {
            gameresult = tmpboard.result(false);
          }
        }
        element.classList.add("position-display-label");
        element.fenstr = tmpboard.fen();
        if (move[0].includes("@")) {
          element.lastmove = [move[0], convertSquareToChessgroundXKey(move[1])];
        } else {
          element.lastmove = [
            convertSquareToChessgroundXKey(move[0]),
            convertSquareToChessgroundXKey(move[1]),
          ];
        }
        element.moveturn = tmpboard.turn() ? "white" : "black";
        element.checked = getCheckSquares(tmpboard);
        element.gameresult = gameresult;
        element.startingfen = this.OriginalFEN;
        element.moves = tmpboard.moveStack();
        if (tokens[i].Node == this.CurrentMove) {
          element.classList.add("current-move");
          element.title = "This is current move.";
        }
        element.onclick = onMoveElementClicked;
        movesparagraph.appendChild(element);
        if (tokens[i].Move.TextAfter) {
          boardnotes = "";
          index = tokens[i].Move.TextAfter.indexOf("[%cal ");
          if (index >= 0) {
            indexend = tokens[i].Move.TextAfter.indexOf("]", index + 6);
            if (indexend >= 0) {
              boardnotes += tokens[i].Move.TextAfter.substring(
                index + 6,
                indexend,
              );
            }
          }
          index = tokens[i].Move.TextAfter.indexOf("[%csl ");
          if (index >= 0) {
            indexend = tokens[i].Move.TextAfter.indexOf("]", index + 6);
            if (indexend >= 0) {
              boardnotes +=
                "," + tokens[i].Move.TextAfter.substring(index + 6, indexend);
            }
          }
          if (boardnotes) {
            element.boardnotes = boardnotes;
            element = document.createElement("img");
            element.src = "./assets/images/pgn/colorring.svg";
            element.width = "20";
            element.height = "20";
            element.title =
              "This position has additional notes on the board. Click this move to view it on the mini board.";
            element.classList.add("has-move-note-sign");
            movesparagraph.appendChild(element);
          }
          if (tokens[i].Move.TextAfter.includes("[#]")) {
            element = document.createElement("p");
            element.innerText = "◀◀ Needs Attention";
            element.title = "This position needs to be carefully examined.";
            element.classList.add("needs-attention-sign");
            movesparagraph.appendChild(element);
          }

          element = document.createElement("p");
          element.innerText = tokens[i].Move.TextAfter.replace(
            this.MoveTextActionPartsMatcher,
            "",
          );
          element.classList.add("text-after");
          movesparagraph.appendChild(element);
        }
        if (tokens[i].Move.HideSubsequentMoves) {
          hidesubsequentmovelevel = 1;
          element = document.createElement("p");
          element.innerText = "...";
          element.title =
            "Moves after this move are not displayed. Click here to show them.";
          element.classList.add("hide-subsequent-moves-sign");
          (function (elem, move) {
            elem.onclick = () => {
              move.HideSubsequentMoves = false;
              updatePGNDivision();
            };
          })(element, tokens[i].Move);
          movesparagraph.appendChild(element);
        }
      }
    }
    let tmpboardresult = tmpboard.result();
    if (tmpboardresult == "*") {
      if (tmpboard.result(true) != "*") {
        tmpboardresult = tmpboard.result(true);
      } else if (tmpboard.result(false) != "*") {
        tmpboardresult = tmpboard.result(false);
      }
    }
    if (tmpboardresult != "*") {
      element = document.createElement("p");
      element.innerText = tmpboardresult;
      element.classList.add("result");
      movesparagraph.appendChild(element);
    }
    try {
      tmpboard.delete();
    } catch (err) {
      console.error("Caught", err);
    }
    return movesparagraph;
  }
}

let multipvminiboardhandler = new MultiplePrincipalVariationMiniBoardHandler();
let gametree = new GameTree();
let themedetector = new themeutil.ChessgroundThemeDetector(
  chessgroundThemeDetector,
);

document.addEventListener("themechange", (event) => {
  if (event instanceof CustomEvent) {
    themedetector.SetThemes(event.detail.piece, event.detail.board);
  }
});

for (i = 0; i < maxmultipvcount; i++) {
  //multipvrecord: Array<Struct<IsMate:boolean, EvaluationNumber:number, BestMove:string, PonderMove:string, PrincipalVariationUCIMove:string, Depth:number, SelectiveDepth:number>>
  multipvrecord.push([null, null, null, null, null, null, null]);
  evaluationindex.push(0);
}

document.dispatchEvent(new Event("onpageload"));

function convertChessgroundXKeyToSquare(key) {
  const ranks = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ":",
    ";",
    "<",
    "=",
    ">",
    "?",
    "@",
  ];
  const files = [
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
  return key.charAt(0) + (ranks.indexOf(key.charAt(1)) + 1).toString();
}

function DownloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function convertSquareToChessgroundXKey(square) {
  const ranks = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ":",
    ";",
    "<",
    "=",
    ">",
    "?",
    "@",
  ];
  const files = [
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
  return square.charAt(0) + ranks[parseInt(square.substring(1)) - 1];
}

function getPieceRoles(pieceLetters) {
  const uniqueLetters = new Set(pieceLetters.toLowerCase().split(""));
  return [...uniqueLetters].map((char) => char + "-piece");
}

function generateMoveNotationSVG(text, backgroundcolor, textcolor, position) {
  if (
    typeof text != "string" ||
    typeof backgroundcolor != "string" ||
    typeof textcolor != "string" ||
    typeof position != "string"
  ) {
    return null;
  }
  if (position == "TopRight") {
    return `<svg xmlns='http://www.w3.org/2000/svg'version='1.1'width='100px'height='100px'><path style="fill:${backgroundcolor};stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"d="m 100,2 a 20,20 0 0 0 -20,19.999999 20,20 0 0 0 20,20 z"/><g transform="scale(1.5)"><text style="fill:${textcolor}"font-size="15"font-family="Arial"font-weight="bold"x="60"y="15"text-anchor="middle"dominant-baseline="central">${text.replace("-", "━").replace("+", "✚")}</text></g></svg>`;
  } else if (position == "TopLeft") {
    return `<svg xmlns='http://www.w3.org/2000/svg'version='1.1'width='100px'height='100px'><path style="fill:${backgroundcolor};stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"d="m 0,2 a 20,20 0 0 1 20,19.999999 20,20 0 0 1 -20,20 z"/><g transform="scale(1.5)"><text style="fill:${textcolor}"font-size="15"font-family="Arial"font-weight="bold"x="6"y="15"text-anchor="middle"dominant-baseline="central">${text.replace("-", "━").replace("+", "✚")}</text></g></svg>`;
  } else {
    return null;
  }
}

function generatePassTurnNotationSVG(backgroundcolor) {
  if (typeof backgroundcolor != "string") {
    return null;
  }
  let bgcolor = "#0078d7";
  if (backgroundcolor != "") {
    bgcolor = backgroundcolor;
  }
  return `<svg width="100"height="100"viewBox="0 0 26.458333 26.458333"version="1.1"xmlns="http://www.w3.org/2000/svg"xmlns:svg="http://www.w3.org/2000/svg"><g><ellipse style="fill:${bgcolor};stroke:#000000;stroke-width:1.05833333;stroke-linecap:square;stroke-dasharray:none;stroke-opacity:1;fill-opacity:1"id="background"cx="13.229165"cy="13.229164"rx="11.906248"ry="11.906247"/><path id="foreground"style="fill:#ffffff;fill-opacity:1;stroke:#ffffff;stroke-width:0;stroke-linecap:butt;stroke-linejoin:round;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;image-rendering:auto"d="m 13.229166,3.9687505 -2.778125,2.7781249 2.778125,2.7781248 V 7.672917 a 5.5562497,5.5562497 0 0 1 5.55625,5.556251 5.5562497,5.5562497 0 0 1 -3.271893,5.06248 l 1.377486,1.377487 a 7.4083326,7.4083326 0 0 0 3.74649,-6.439967 7.4083326,7.4083326 0 0 0 -7.408333,-7.4083344 z m -3.6607575,2.821533 a 7.4083326,7.4083326 0 0 0 -3.7475747,6.4388845 7.4083326,7.4083326 0 0 0 7.4083322,7.408331 v 1.852084 l 2.778125,-2.778125 -2.778125,-2.778125 v 1.852083 A 5.5562497,5.5562497 0 0 1 7.672917,13.229168 5.5562497,5.5562497 0 0 1 10.945171,8.1670469 Z"/></g></svg>`;
}

function initBoard(variant) {
  if (board !== null) board.delete();
  board = new ffish.Board(
    variant,
    ffish.startingFen(variant),
    checkboxFischerRandom.checked,
  );
  console.log(
    "Variant:",
    board.variant(),
    "; Is fischer random: ",
    board.is960(),
  ); // Figuring out pocket roles from initial FEN

  const fenBoard = board.fen().split(" ")[0];
  var pocketRoles = undefined;
  resetTimer();
  clearMovesList();
  recordedmultipv = 1;
  if (fenBoard.includes("[")) {
    const wpocket = board.pocket(WHITE);
    const bpocket = board.pocket(BLACK); // Variants with empty hands at start (zh, shogi, etc.)

    if (ffish.capturesToHand(variant)) {
      const pieceLetters = fenBoard.replace(/[0-9kK\/\[\]]/g, "");
      const pieceRoles = getPieceRoles(pieceLetters);
      console.log(pieceRoles);
      pocketRoles = {
        white: pieceRoles,
        black: pieceRoles,
      }; // Variants having pieces in hand at start (placement, sittuyin, etc.)
    } else {
      pocketRoles = {
        white: getPieceRoles(wpocket),
        black: getPieceRoles(bpocket),
      };
    }
  }

  const config = {
    autoCastle: false,
    dimensions: getDimensions(),
    fen: fenBoard,
    movable: {
      free: true,
      showDests: checkboxDests.checked,
      events: {
        after: afterChessgroundMove,
        afterNewPiece: afterChessgroundDrop,
      },
    },
    draggable: {
      showGhost: true,
    },
    selectable: {
      enabled: clickClickMove.checked,
    },
    pocketRoles: pocketRoles,
    events: {
      select: onSelectSquare,
    },
    notation: dropdownBoardCoordinate.selectedIndex,
  };

  const configmini = {
    dimensions: getDimensions(),
    fen: fenBoard,
    movable: {
      color: undefined,
      dests: EmptyMap,
    },
    premovable: {
      enabled: false,
    },
    draggable: {
      enabled: false,
    },
    selectable: {
      enabled: false,
    },
    drawable: {
      enabled: false,
    },
    pocketRoles: pocketRoles,
    viewOnly: true,
    notation: dropdownBoardCoordinate.selectedIndex,
  };
  chessground = Chessground(chessgroundEl, config, pocketTopEl, pocketBottomEl);
  chessground_mini = Chessground(
    chessgroundMiniEl,
    configmini,
    pocketTopMiniEl,
    pocketBottomMiniEl,
  );
  chessgroundMini.startingfen = undefined;
  chessgroundMini.moves = undefined;
  chessground.state.drawable.brushes.black = {
    key: "black",
    color: "#000000",
    opacity: 1,
    lineWidth: 10,
  };

  if (pocketRoles === undefined) {
    pocketTopEl.classList.add("no-inital-pocket-piece");
    pocketBottomEl.classList.add("no-inital-pocket-piece");
    pocketTopMiniEl.style.display = "none";
    pocketBottomMiniEl.style.display = "none";
  } else {
    pocketTopEl.classList.remove("no-inital-pocket-piece");
    pocketBottomEl.classList.remove("no-inital-pocket-piece");
  }
}

function forceCoordinateRecalculation() {
  // Force a layout reflow to ensure chessground coordinates are properly mapped
  // This addresses the coordinate mapping issue that occurs after clicking "Start game"
  const container = chessgroundContainerEl;
  if (container) {
    // Force layout recalculation by accessing layout properties
    container.offsetHeight;
    container.getBoundingClientRect();

    // Trigger a small scroll to force coordinate recalculation
    // This mimics the user scroll/zoom that fixes the issue manually
    const currentScrollTop = window.pageYOffset;
    window.scrollTo(0, currentScrollTop + 1);
    window.scrollTo(0, currentScrollTop);
  }
}

function rerenderChessgroundPockets(falsefen) {
  let mainboard = chessgroundContainerEl.getElementsByTagName("cg-board")[0];
  let mainboardcontainer =
    chessgroundContainerEl.getElementsByTagName("cg-container")[0];
  let css_height = mainboardcontainer.style.height;
  let css_width = mainboardcontainer.style.width;
  let state = chessground.state;
  let pockettoplength = 0;
  let pocketbottomlength = 0;
  let dimensions = getDimensions();
  let elements = {
    board: mainboard,
    pocketTop: pocketTopEl,
    pocketBottom: pocketBottomEl,
    wrap: chessgroundEl,
    container: chessgroundContainerEl,
  };
  if (chessground.state.orientation == "white") {
    pocketbottomlength = chessground.state.pocketRoles.white.length;
    pockettoplength = chessground.state.pocketRoles.black.length;
  } else {
    pocketbottomlength = chessground.state.pocketRoles.black.length;
    pockettoplength = chessground.state.pocketRoles.white.length;
  }
  let pocketlength = Math.max(pockettoplength, pocketbottomlength);
  pocketTopEl.setAttribute(
    "style",
    `--pocketLength: ${pocketlength}; --files: ${dimensions.width}; --ranks: ${dimensions.height}; --cg-width: ${css_width}; --cg-height: ${css_height}`,
  );
  pocketBottomEl.setAttribute(
    "style",
    `--pocketLength: ${pocketlength}; --files: ${dimensions.width}; --ranks: ${dimensions.height}; --cg-width: ${css_width}; --cg-height: ${css_height}`,
  );
  pocketutil.renderPocketsInitial(state, elements, pocketTopEl, pocketBottomEl);
  pocketutil.renderPockets(state);
  pocketTopEl.setAttribute(
    "style",
    `--pocketLength: ${pocketlength}; --files: ${dimensions.width}; --ranks: ${dimensions.height}; --cg-width: ${css_width}; --cg-height: ${css_height}`,
  );
  pocketBottomEl.setAttribute(
    "style",
    `--pocketLength: ${pocketlength}; --files: ${dimensions.width}; --ranks: ${dimensions.height}; --cg-width: ${css_width}; --cg-height: ${css_height}`,
  );
  if (falsefen) {
    chessground.set({
      fen: falsefen,
    });
  }
}

function redrawChessground(customFEN) {
  let fenBoard = "";
  if (customFEN) {
    fenBoard = customFEN;
    console.log("CustomFEN:", customFEN);
  } else {
    fenBoard = chessground.state.fen;
  }
  const config = {
    autoCastle: false,
    dimensions: getDimensions(),
    orientation: chessground.state.orientation,
    fen: fenBoard,
    check: chessground.state.check,
    lastMove: chessground.state.lastMove,
    movable: {
      free: true,
      color: chessground.state.movable.color,
      dests: chessground.state.movable.dests,
      showDests: checkboxDests.checked,
      events: {
        after: afterChessgroundMove,
        afterNewPiece: afterChessgroundDrop,
      },
    },
    draggable: {
      showGhost: true,
    },
    selectable: {
      enabled: clickClickMove.checked,
    },
    pocketRoles: chessground.state.pocketRoles,
    events: {
      select: onSelectSquare,
    },
    notation: dropdownBoardCoordinate.selectedIndex,
    turnColor: chessground.state.turnColor,
  };
  chessground = Chessground(chessgroundEl, config, pocketTopEl, pocketBottomEl);
  chessground.state.drawable.brushes.black = {
    key: "black",
    color: "#000000",
    opacity: 1,
    lineWidth: 10,
  };
  if (chessground.state.pocketRoles === undefined) {
    pocketTopEl.classList.add("no-inital-pocket-piece");
    pocketBottomEl.classList.add("no-inital-pocket-piece");
  } else {
    pocketTopEl.classList.remove("no-inital-pocket-piece");
    pocketBottomEl.classList.remove("no-inital-pocket-piece");
  }
  updateInnerCoordinateColor(chessground);
}

function updateInnerCoordinateColor(chessground) {
  const coordinateobj =
    chessground.state.dom.elements.container.getElementsByTagName("coords");
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
  if (!checkBoxInnerCoordinate.checked) {
    return;
  }
  const size = getCurrentBoardSize();
  let classes, styles, isblack;
  //If the parity of rank number and the parity of file number are the same, it's a dark square. Otherwise it's a light square.
  for (i = 0; i < coordinateobj.length; i++) {
    elem = coordinateobj[i];
    if (elem instanceof HTMLElement) {
      classes = elem.classList;
      styles = window.getComputedStyle(elem);
      isblack = classes.contains("black");
      if (classes.contains("bottom")) {
        childs = elem.childNodes;
        let startsdark = false;
        if (styles.flexDirection == "row") {
          if (isblack) {
            //If the start square is a light square, the coordinate should start with dark color.
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

function onSelectSquare(key) {
  console.log("key:", key);
  console.log(chessground.state);
  if (isBoardSetup.checked) {
    let piece = { role: "", color: "" };
    let pieceid = "";
    console.log("pieceid selected: ", dropdownSetPiece.value);
    if (
      dropdownSetPiece.value == null ||
      dropdownSetPiece.value == "<delete>"
    ) {
      if (chessground.state.boardState.pieces.has(key)) {
        chessground.state.boardState.pieces.delete(key);
      }
    } else if (dropdownSetPiece.value == "<move>") {
    } else {
      pieceid = dropdownSetPiece.value;
      if (pieceid.charAt(0) == "+") {
        piece.role = "p";
        pieceid = pieceid.substring(1);
      }
      if (
        ("a" <= pieceid.charAt(0) && pieceid.charAt(0) <= "z") ||
        pieceid.charAt(0) == "*"
      ) {
        piece.color = "black";
      } else {
        piece.color = "white";
      }
      if (pieceid.charAt(0) == "*") {
        piece.role = "_-piece";
      } else {
        piece.role = piece.role + pieceid.charAt(0).toLowerCase() + "-piece";
      }
      console.log("final piece id:", piece.role);
      chessground.state.boardState.pieces.set(key, piece);
    }
    chessground.set({
      lastMove: undefined,
    });
    hasdoubleclicked = false;
  } else {
    if (
      Date.now() - previousclicktime < 1000 &&
      key == previousclicksquare &&
      !hasdoubleclicked
    ) {
      let square = convertChessgroundXKeyToSquare(key);
      afterChessgroundMove(square, square, {
        premove: false,
        ctrlKey: false,
        holdTime: 0,
        captured: {
          role: null,
          color: null,
          promoted: false,
        },
        predrop: false,
      });
      chessground.cancelMove();
      hasdoubleclicked = true;
    } else {
      hasdoubleclicked = false;
    }
    previousclicktime = Date.now();
    previousclicksquare = key;
  }
}

function getWallSquarePosition() {
  let FEN = board.fen().split(" ")[0];
  let ranks = FEN.split("/");
  let wall_square_list = [];
  let file = [];
  let i = 0;
  let j = 0;
  let current_file = 0;
  let tmp_num = 0;
  for (i = 0; i < ranks.length; i++) {
    file = ranks[i].split("");
    current_file = 0;
    tmp_num = 0;
    for (j = 0; j < file.length; j++) {
      if (/^[0-9]{1}$/.test(file[j])) {
        tmp_num = tmp_num * 10 + +parseInt(file[j]);
        continue;
      } else {
        current_file = +current_file + +tmp_num;
        tmp_num = 0;
      }
      if (file[j] == "*") {
        wall_square_list.push(`${files[current_file]}${ranks.length - i}`);
      }
      current_file++;
    }
  }
  console.log(wall_square_list);
  return wall_square_list;
}

//This function must be called as onclick() function of a HTMLElement
function onMoveElementClicked() {
  chessground_mini.set({
    fen: this.fenstr,
    orientation: chessground.state.orientation,
    turnColor: this.moveturn,
    check: this.checked,
    lastMove: this.lastmove,
    notation: chessground.state.notation,
  });
  chessground_mini.setAutoShapes([]);
  if (this.boardnotes) {
    let notes = this.boardnotes.split(",");
    let i = 0;
    let color = "";
    let note = "";
    let moveturns = [];
    let moves = [];
    let colors = [];
    let notepositions = [];
    let moveturn = this.moveturn == "white";
    for (i = 0; i < notes.length; i++) {
      note = notes[i].trim();
      if (note == "") {
        continue;
      }
      if (note[0] == "Y") {
        color = "yellow";
      } else if (note[0] == "G") {
        color = "green";
      } else if (note[0] == "R") {
        color = "red";
      } else if (note[0] == "B") {
        color = "blue";
      } else {
        continue;
      }
      note = note.substring(1);
      moveturns.push(moveturn);
      colors.push(color);
      notepositions.push("TopRight");
      if (note.match(/[a-z][0-9]+/g).length == 1) {
        moves.push("@" + note);
      } else {
        moves.push(note);
      }
    }
    //The arrows can be drawed correctly only when the board is visible, so we have to wait for the browser rendering the board.
    window.setTimeout(() => {
      highlightMoveOnBoard(
        moveturns,
        chessground_mini,
        moves,
        colors,
        notepositions,
      );
    }, 100);
  }
  chessgroundMini.startingfen = this.startingfen;
  chessgroundMini.moves = this.moves;
  //console.log(this.fenstr, this.moveturn, this.checked, this.lastmove);
  if (chessgroundMini.style.display == "none") {
    const rect = this.getBoundingClientRect();
    const mainrect = divMain.getBoundingClientRect();
    let chessgroundminirect = chessgroundMini.getBoundingClientRect();
    while (chessgroundminirect.width == 0) {
      chessgroundMini.style.display = "";
      chessgroundminirect = chessgroundMini.getBoundingClientRect();
    }
    const padding = 10;
    let offsetX = 0;
    let offsetY = 0;
    if (chessgroundMini.pinned) {
      offsetX = rect.left;
      offsetY = rect.top;
    } else {
      offsetX = rect.left - mainrect.left;
      offsetY = rect.top - mainrect.top;
    }
    let finalX = offsetX;
    let finalY = offsetY + 40;
    if (chessgroundMini.pinned) {
      if (finalX + chessgroundminirect.width > window.innerWidth - padding) {
        finalX -= chessgroundminirect.width;
      }
      if (finalY + chessgroundminirect.height > window.innerHeight - padding) {
        finalY = window.innerHeight - chessgroundminirect.height - padding;
      }
    } else {
      if (offsetX + chessgroundminirect.width > mainrect.right - padding) {
        finalX -= chessgroundminirect.width;
      }
    }
    chessgroundMini.style.left = `${finalX}px`;
    chessgroundMini.style.top = `${finalY}px`;
    setTimeout(() => {
      chessgroundMini.style.display = "";
    }, 25);
  }
  if (this.gameresult != "*") {
    let elem = document.getElementById("gameresultcontainermini");
    while (elem) {
      chessgroundMiniBoardWrapper.removeChild(elem);
      elem = document.getElementById("gameresultcontainermini");
    }
    let operationrect = chessgroundMiniBoardOperations.getBoundingClientRect();
    let div = document.createElement("div");
    div.id = "gameresultcontainermini";
    div.classList.add("inaccessble");
    div.style.position = "absolute";
    div.style.display = "flex";
    div.style.overflow = "hidden";
    div.style.top = "0";
    div.style.left = `${operationrect.width}px`;
    div.style.bottom = "0";
    div.style.right = "0";
    div.style.justifyContent = "center";
    div.style.alignItems = "center";
    div.style.zIndex = "1000";
    div.style.background = "rgba(0,0,0,0)";
    div.style.pointerEvents = "none";
    let spangameresultmini = document.createElement("spangameresultmini");
    //let wrapperrect = chessgroundMiniBoardWrapper.getBoundingClientRect();

    //let chessgroundminirect = chessgroundMini.getBoundingClientRect();
    spangameresultmini.innerText = this.gameresult;
    //spangameresultmini.style.left = `${(operationrect.width / chessgroundminirect.width + wrapperrect.width / 2 / chessgroundminirect.width) * 100}%`;
    //spangameresultmini.style.top = "50%";
    div.appendChild(spangameresultmini);
    setTimeout(() => {
      spangameresultmini.style.opacity = "1";
      spangameresultmini.style.fontSize = "90px";
    }, 100);
    setTimeout(() => {
      spangameresultmini.style.opacity = "0";
      spangameresultmini.style.fontSize = "1px";
    }, 2600);
    setTimeout(() => {
      chessgroundMiniBoardWrapper.removeChild(div);
    }, 3200);
    chessgroundMiniBoardWrapper.appendChild(div);
  }
}

//Only supposed to be called in analysis PV display
function parseUCIMovesToPreviewElements(
  variant,
  fen,
  is960,
  ucimoves,
  elementid,
  sannotation,
  originalfen,
  originalmoves,
) {
  let moves = ucimoves.trim().split(" ");
  let i = 0;
  let movesparagraph = document.createElement("div");
  movesparagraph.id = elementid;
  movesparagraph.classList.add("board-display-san");
  let movesan = "";
  for (i = 0; i < moves.length; i++) {
    if (moves[i] == "") {
      moves.splice(i, 1);
      i--;
    }
  }
  let tmpboard = new ffish.Board(variant, fen, is960);
  let gameresult = "";
  for (i = 0; i < moves.length; i++) {
    if (i == 0) {
      if (tmpboard.turn()) {
        let fullmovenum = document.createElement("p");
        fullmovenum.innerText = `${tmpboard.fullmoveNumber()}.`;
        movesparagraph.appendChild(fullmovenum);
      } else {
        let fullmovenum = document.createElement("p");
        fullmovenum.innerText = `${tmpboard.fullmoveNumber()}...`;
        movesparagraph.appendChild(fullmovenum);
      }
    } else if (tmpboard.turn()) {
      let fullmovenum = document.createElement("p");
      fullmovenum.innerText = `${tmpboard.fullmoveNumber()}.`;
      movesparagraph.appendChild(fullmovenum);
    }
    movesan = tmpboard.sanMove(moves[i], sannotation);
    if (!tmpboard.push(moves[i])) {
      tmpboard.delete();
      return null;
    }
    gameresult = tmpboard.result();
    if (gameresult == "*") {
      if (tmpboard.result(true) != "*") {
        gameresult = tmpboard.result(true);
      } else if (tmpboard.result(false) != "*") {
        gameresult = tmpboard.result(false);
      }
    }
    let moveelement = document.createElement("p");
    let move = moveutil.ParseUCIMove(moves[i]);
    moveelement.innerText = movesan;
    moveelement.classList.add("position-display-label");
    moveelement.fenstr = tmpboard.fen();
    moveelement.lastmove = [
      convertSquareToChessgroundXKey(move[0]),
      convertSquareToChessgroundXKey(move[1]),
    ];
    moveelement.moveturn = tmpboard.turn() ? "white" : "black";
    moveelement.checked = getCheckSquares(tmpboard);
    moveelement.gameresult = gameresult;
    moveelement.startingfen = originalfen;
    moveelement.moves = (
      originalmoves.trim() +
      " " +
      moves.slice(0, i + 1).join(" ")
    ).trim();
    /*
        
        TODO: Due to dynamic element removing and adding, sometimes clicking the element has no effect, especially when it's frequently updated.
              The shorter the intervals of deleting previous div and creating a new one using this function is, the more frequent it happens.
              For example, let 2 random movers play against each other and this happens frequently.

              This is likely to be caused by clicking during the initialization period of these elements, so probably use static allocation which does not delete and create DOM objects, but modifies its content instead.
        
        */
    moveelement.onclick = onMoveElementClicked;
    movesparagraph.appendChild(moveelement);
    if (gameresult != "*") {
      break;
    }
  }
  if (gameresult != "*") {
    let pgameresult = document.createElement("p");
    pgameresult.innerText = gameresult;
    movesparagraph.appendChild(pgameresult);
  }
  tmpboard.delete();
  movesparagraph.movecount = moves.length;
  return movesparagraph;
}

/*function generateStaticPreviewDiv(maxfullmovenumber) {
    let i = 0;
    let j = 0;
    let movesparagraph = document.createElement("div");
    movesparagraph.maxfullmovenumber = maxfullmovenumber;
    movesparagraph.classList.add("board-display-san");
    for (i = 0; i < maxfullmovenumber; i++) {
        let fullmovenum = document.createElement("p");
        movesparagraph.appendChild(fullmovenum);
        for (i = 0; i < 2; j++) {
            let moveelement = document.createElement("p");
            moveelement.classList.add("position-display-label");
            moveelement.fenstr = "";
            moveelement.lastmove = [];
            moveelement.moveturn = "";
            moveelement.isincheck = false;
            moveelement.gameresult = "";
            moveelement.style.display = "none";
            moveelement.onclick = function () {
                chessground_mini.set({
                    fen: this.fenstr,
                    orientation: chessground.state.orientation,
                    turnColor: this.moveturn,
                    check: this.isincheck,
                    lastMove: this.lastmove,
                    notation: chessground.state.notation,
                });
                if (chessgroundMini.style.display == "none") {
                    const rect = this.getBoundingClientRect();
                    const mainrect = divMain.getBoundingClientRect();
                    let chessgroundminirect = chessgroundMini.getBoundingClientRect();
                    while (chessgroundminirect.width == 0) {
                        chessgroundMini.style.display = "";
                        chessgroundminirect = chessgroundMini.getBoundingClientRect();
                    }
                    const padding = 10;
                    let offsetX = 0;
                    let offsetY = 0;
                    if (chessgroundMini.pinned) {
                        offsetX = rect.left;
                        offsetY = rect.top;
                    }
                    else {
                        offsetX = rect.left - mainrect.left;
                        offsetY = rect.top - mainrect.top;
                    }
                    let finalX = offsetX;
                    let finalY = offsetY + 40;
                    if (chessgroundMini.pinned) {
                        if (offsetX + chessgroundminirect.width > window.innerWidth - padding) {
                            finalX -= chessgroundminirect.width;
                        }
                        if (offsetY + chessgroundminirect.height > window.innerHeight - padding) {
                            finalY = window.innerHeight - chessgroundminirect.height - padding;
                        }
                    }
                    else {
                        if (offsetX + chessgroundminirect.width > mainrect.right - padding) {
                            finalX -= chessgroundminirect.width;
                        }
                    }
                    chessgroundMini.style.left = `${finalX}px`;
                    chessgroundMini.style.top = `${finalY}px`;
                    setTimeout(() => {
                        chessgroundMini.style.display = "";
                    }, 25);
                }
                if (this.gameresult != "*") {
                    let elem = document.getElementById("gameresultcontainermini");
                    while (elem) {
                        chessgroundMiniBoardWrapper.removeChild(elem);
                        elem = document.getElementById("gameresultcontainermini");
                    }
                    let operationrect = chessgroundMiniBoardOperations.getBoundingClientRect();
                    let div = document.createElement("div");
                    div.id = "gameresultcontainermini";
                    div.classList.add("inaccessble");
                    div.style.position = "absolute";
                    div.style.display = "flex";
                    div.style.overflow = "hidden";
                    div.style.top = "0";
                    div.style.left = `${operationrect.width}px`;
                    div.style.bottom = "0";
                    div.style.right = "0";
                    div.style.justifyContent = "center";
                    div.style.alignItems = "center";
                    div.style.zIndex = "1000";
                    div.style.background = "rgba(0,0,0,0)";
                    div.style.pointerEvents = "none";
                    let spangameresultmini = document.createElement("spangameresultmini");
                    spangameresultmini.innerText = this.gameresult;
                    div.appendChild(spangameresultmini);
                    setTimeout(() => {
                        spangameresultmini.style.opacity = "1";
                        spangameresultmini.style.fontSize = "80px";
                    }, 100);
                    setTimeout(() => {
                        spangameresultmini.style.opacity = "0";
                        spangameresultmini.style.fontSize = "1px";
                    }, 2600);
                    setTimeout(() => {
                        chessgroundMiniBoardWrapper.removeChild(div);
                    }, 3200);
                    chessgroundMiniBoardWrapper.appendChild(div);
                }
            };
            movesparagraph.appendChild(moveelement);
        }
    }
    return movesparagraph;
}

function parseUCIMovesToPreviewElementsStatic(movesparagraph, variant, fen, is960, ucimoves, sannotation) {
    if (movesparagraph == null || movesparagraph.maxfullmovenumber == undefined) {
        return null;
    }
    let moves = ucimoves.trim().split(' ');
    let i = 0;
    let j = 0;
    let tmpboard = new ffish.Board(variant, fen, is960);
    let movesan = "";
    for (i = 0; i < moves.length; i++) {
        if (moves[i] == "") {
            moves.splice(i, 1);
            i--;
        }
    }
    let childnodes = movesparagraph.childNodes;
    for (i = 0, j = 0; true; i += 3) {
        if (moves[j] == undefined) {
            break;
        }
        if (i == 0) {
            if (tmpboard.turn()) {
                childnodes.item(0).innerText = `${tmpboard.fullmoveNumber()}.`;
            }
            else {
                childnodes.item(0).innerText = `${tmpboard.fullmoveNumber()}...`;
            }
            childnodes.item(0).style.display = "";
            childnodes.item(1).style.display = "none";
            childnodes.item(2).style.display = "none";
        }
        else {
            childnodes.item(i).innerText = `${tmpboard.fullmoveNumber()}.`;
            childnodes.item(i).style.display = "";
        }
        movesan = tmpboard.sanMove(moves[j], sannotation);
        if (!tmpboard.push(moves[j])) {
            break;
        }
        let move = parseUCIMove(moves[j]);
        if (!tmpboard.turn()) {
            childnodes.item(i + 1).innerText = movesan;
            childnodes.item(i + 1).fenstr = tmpboard.fen();
            childnodes.item(i + 1).lastmove = [move[0].replace("10", ":"), move[1].replace("10", ":")];
            childnodes.item(i + 1).moveturn = "black";
            childnodes.item(i + 1).isincheck = tmpboard.isCheck();
            childnodes.item(i + 1).gameresult = tmpboard.result();
            childnodes.item(i + 1).style.display = "";
            if (moves[j + 1] == undefined) {
                break;
            }
            movesan = tmpboard.sanMove(moves[j + 1], sannotation);
            if (!tmpboard.push(moves[j + 1])) {
                break;
            }
            move = parseUCIMove(moves[j + 1]);
            childnodes.item(i + 2).innerText = movesan;
            childnodes.item(i + 2).fenstr = tmpboard.fen();
            childnodes.item(i + 2).lastmove = [move[0].replace("10", ":"), move[1].replace("10", ":")];
            childnodes.item(i + 2).moveturn = "white";
            childnodes.item(i + 2).isincheck = tmpboard.isCheck();
            childnodes.item(i + 2).gameresult = tmpboard.result();
            childnodes.item(i + 2).style.display = "";
            j += 2;
        }
        else {
            childnodes.item(i + 1).style.display = "none";
            childnodes.item(i + 2).innerText = movesan;
            childnodes.item(i + 2).fenstr = tmpboard.fen();
            childnodes.item(i + 2).lastmove = [move[0].replace("10", ":"), move[1].replace("10", ":")];
            childnodes.item(i + 2).moveturn = "white";
            childnodes.item(i + 2).isincheck = tmpboard.isCheck();
            childnodes.item(i + 2).gameresult = tmpboard.result();
            childnodes.item(i + 2).style.display = "";
            j++;
        }
    }
    if (tmpboard.result() != "*") {
        childnodes.item(i).innerText = tmpboard.result();
        childnodes.item(i).style.display = "";
        i++;
    }
    for (i = i; i < 3 * movesparagraph.maxfullmovenumber; i++) {
        childnodes.item(i).style.display = "none";
    }
    tmpboard.delete();
    return movesparagraph;
}*/

function GenerateBoardImage(
  GenerationMode,
  ImageWidth,
  ImageHeight,
  KeepAspectRatio,
  OnFinishedCallback,
) {
  if (
    typeof GenerationMode != "string" ||
    typeof ImageWidth != "number" ||
    typeof ImageHeight != "number" ||
    typeof KeepAspectRatio != "boolean" ||
    typeof OnFinishedCallback != "function"
  ) {
    throw TypeError();
  }
  let dimensions = getDimensions();
  let asseturl = themedetector.GetThemes();
  let moves = gametree.GetMoveListOfMove(gametree.CurrentMove);
  let tmpboard = new ffish.Board(
    gametree.Variant,
    gametree.OriginalFEN,
    gametree.Is960,
  );
  let imagewidth = ImageWidth;
  let imageheight = ImageHeight;
  let notation = dropdownBoardCoordinate.selectedIndex;
  if (GenerationMode == "current") {
    tmpboard.pushMoves(moves);
    let hiddenpieces = getHiddenDroppablePiece(tmpboard);
    let fen = tmpboard.fen().split(" ")[0];
    let checkedpieces = tmpboard.checkedPieces();
    let checkedsquares = [];
    if (checkedpieces) {
      checkedsquares = checkedpieces.split(" ");
    }
    if (hiddenpieces.length > 0) {
      let index = fen.indexOf("[");
      if (index < 0) {
        fen = fen + `[${hiddenpieces}]`;
      } else {
        fen =
          fen.substring(0, index + 1) + hiddenpieces + fen.substring(index + 1);
      }
    }
    if (KeepAspectRatio) {
      if (fen.includes("[")) {
        imageheight = (imagewidth / dimensions.width) * (dimensions.height + 2);
      } else {
        imageheight = (imagewidth / dimensions.width) * dimensions.height;
      }
    }
    imageutil.GenerateBoardImage(
      fen,
      gametree.CurrentMove.Move.Move,
      checkedsquares,
      fen.includes("["),
      chessground.state.orientation,
      dimensions.width,
      dimensions.height,
      notation,
      asseturl.pieces,
      asseturl.board,
      imagewidth,
      imageheight,
      (canvas) => {
        if (canvas instanceof HTMLCanvasElement) {
          OnFinishedCallback([canvas]);
        }
      },
    );
  } else if (GenerationMode == "all") {
    let i = 0;
    let movelist = moves.split(" ").filter((val) => val != "");
    let haspocket = false;
    let hiddenpieces;
    let fen, checkedpieces;
    let fens = [];
    let checkedsquarelist = [];
    let drawncanvascount = 0;
    let totalcanvascount = movelist.length + 1;
    let canvaslist = [];
    for (i = -1; i < movelist.length; i++) {
      if (i >= 0) {
        tmpboard.push(movelist[i]);
      }
      hiddenpieces = getHiddenDroppablePiece(tmpboard);
      fen = tmpboard.fen().split(" ")[0];
      checkedpieces = tmpboard.checkedPieces();
      if (checkedpieces) {
        checkedsquarelist.push(checkedpieces.split(" "));
      } else {
        checkedsquarelist.push([]);
      }
      if (hiddenpieces.length > 0) {
        let index = fen.indexOf("[");
        if (index < 0) {
          fen = fen + `[${hiddenpieces}]`;
        } else {
          fen =
            fen.substring(0, index + 1) +
            hiddenpieces +
            fen.substring(index + 1);
        }
      }
      haspocket = haspocket || fen.includes("[");
      fens.push(fen);
      canvaslist.push(null);
    }
    if (KeepAspectRatio) {
      if (haspocket) {
        imageheight = (imagewidth / dimensions.width) * (dimensions.height + 2);
      } else {
        imageheight = (imagewidth / dimensions.width) * dimensions.height;
      }
    }
    for (i = 0; i < fens.length; i++) {
      (function (index) {
        imageutil.GenerateBoardImage(
          fens[index],
          index == 0 ? "" : movelist[index - 1],
          checkedsquarelist[index],
          haspocket,
          chessground.state.orientation,
          dimensions.width,
          dimensions.height,
          notation,
          asseturl.pieces,
          asseturl.board,
          imagewidth,
          imageheight,
          (canvas) => {
            drawncanvascount++;
            if (canvas instanceof HTMLCanvasElement) {
              canvaslist[index] = canvas;
            }
            if (drawncanvascount >= totalcanvascount) {
              OnFinishedCallback(canvaslist);
            }
          },
        );
      })(i);
    }
  }
  tmpboard.delete();
}

function showWallSquares() {
  let wall_square_list = getWallSquarePosition();
  let i = 0;
  let DrawShapeClass = {
    orig: "a1",
    brush: "red",
    customSvg: "./assets/images/wallsquare/barrier.svg",
  };
  let DrawShapeList = [];
  for (i = 0; i < wall_square_list.length; i++) {
    DrawShapeClass.orig = wall_square_list[i];
    DrawShapeList.push(DrawShapeClass);
  }
  chessground.setAutoShapes(DrawShapeList);
}

function getUsedPieceID(variant, isfischerrandom) {
  console.log("Now testing piece set! You may see a lot of warnings here.");
  let validPieceID = pieces.filter((element) => {
    return ffish.validateFen(element, variant, isfischerrandom) != -10;
  });
  return validPieceID;
}

function setPieceList(used_piece_list) {
  while (dropdownSetPiece.length > 2) {
    dropdownSetPiece.remove(2);
  }
  let option = null;
  let i = 0;
  for (i = 0; i < used_piece_list.length; i++) {
    option = document.createElement("option");
    option.text = used_piece_list[i];
    option.value = used_piece_list[i];
    dropdownSetPiece.add(option);
  }
}

function addPieceToPocket(pieceid, color) {
  if (pieceid.charAt(0) == "+") {
    pieceid = "p" + pieceid.substring(1);
  }
  let piecerole = pieceid + "-piece";
  if (!chessground.state.boardState.pockets.white.has(piecerole)) {
    chessground.state.boardState.pockets.white.set(piecerole, 0);
  }
  if (!chessground.state.boardState.pockets.black.has(piecerole)) {
    chessground.state.boardState.pockets.black.set(piecerole, 0);
  }
  if (!chessground.state.pocketRoles.white.includes(piecerole)) {
    chessground.state.pocketRoles.white.push(piecerole);
  }
  if (!chessground.state.pocketRoles.black.includes(piecerole)) {
    chessground.state.pocketRoles.black.push(piecerole);
  }
  if (color == "white") {
    chessground.state.boardState.pockets.white.set(
      piecerole,
      chessground.state.boardState.pockets.white.get(piecerole) + 1,
    );
  } else if (color == "black") {
    chessground.state.boardState.pockets.black.set(
      piecerole,
      chessground.state.boardState.pockets.black.get(piecerole) + 1,
    );
  }
  chessground.set({
    lastMove: undefined,
    pocketRoles: {
      white: chessground.state.pocketRoles.white,
      black: chessground.state.pocketRoles.black,
    },
  });
  redrawChessground(getFEN(false));
}

function clearMovesList() {
  while (availablemovelist.length > 1) {
    availablemovelist.removeChild(availablemovelist[1]);
  }
  searchresultinfo.innerText = "Click <Search Moves> to search!";
}

function generateRegExp(expstr) {
  if (typeof expstr != "string") {
    return null;
  }
  if (expstr.trim().charAt(0) == "/") {
    let i = 0;
    let str = expstr.trim().slice(1);
    let index = 0;
    for (i = 0; i < str.length; i++) {
      if (str.charAt(i) == "\\") {
        i++;
        continue;
      }
      if (str.charAt(i) == "/") {
        if (i == 0) {
          window.alert(
            'There is a syntax error in the regular expression. The syntax is /<search items...>/<flags...>. You can google "regular expression" to get more informaion.',
          );
          return null;
        } else {
          index = i;
          break;
        }
      }
    }
    let params = [str.slice(0, index), str.slice(index + 1)];
    try {
      let regexp = new RegExp(params[0], params[1]);
      return regexp;
    } catch {
      window.alert(
        'There is a syntax error in the regular expression. The syntax is /<search items...>/<flags...>. You can google "regular expression" to get more information.',
      );
      return null;
    }
  } else {
    window.alert(
      "There is a syntax error in the regular expression. It must start with '/'. E.G. /[a-z]+/g",
    );
    return null;
  }
}

function filterMoves(
  moveslist,
  searchstr,
  isregexp,
  orig,
  dest,
  isdrop,
  haswallgating,
  haspiecechange,
) {
  if (
    typeof moveslist != typeof [""] ||
    typeof searchstr != "string" ||
    typeof isregexp != "boolean" ||
    typeof orig != "string" ||
    typeof dest != "string" ||
    typeof isdrop != "boolean" ||
    typeof haswallgating != "boolean" ||
    typeof haspiecechange != "boolean"
  ) {
    return null;
  }
  let result = [];
  if (isregexp) {
    let regexp = generateRegExp(searchstr);
    if (regexp == null) {
      return null;
    }
    moveslist.forEach((val) => {
      if (regexp.test(val)) {
        let res = moveutil.ParseUCIMove(val);
        if (!isdrop && res[0].includes("@")) {
          return;
        }
        if (!haspiecechange && res[2] != "") {
          return;
        }
        if (!haswallgating && res[3] != "") {
          return;
        }
        if (orig != "" && !res[0].includes("@") && orig != res[0]) {
          return;
        }
        if (dest != "" && res[1] != dest) {
          return;
        }
        result.push(val);
      }
    });
  } else {
    let str = searchstr.trim();
    moveslist.forEach((val) => {
      if (val.includes(str)) {
        let res = moveutil.ParseUCIMove(val);
        if (!isdrop && res[0].includes("@")) {
          return;
        }
        if (!haspiecechange && res[2] != "") {
          return;
        }
        if (!haswallgating && res[3] != "") {
          return;
        }
        if (orig != "" && !res[0].includes("@") && orig != res[0]) {
          return;
        }
        if (dest != "" && res[1] != dest) {
          return;
        }
        result.push(val);
      }
    });
  }
  return result;
}

function highlightMoveOnBoard(
  moveturns,
  chessground,
  moves,
  colors,
  notepositions,
) {
  if (
    !Array.isArray(moveturns) ||
    !Array.isArray(moves) ||
    !Array.isArray(colors) ||
    !Array.isArray(notepositions) ||
    chessground == null
  ) {
    return;
  }
  let i = 0;
  let bestmove = null;
  let autoshapes = [];
  let color = "";
  let notecolor = "";
  let moveturn = true;
  let noteposition = "";
  for (i = 0; i < moves.length; i++) {
    bestmove = moveutil.ParseUCIMove(moves[i]);
    if (
      bestmove[0] == null ||
      bestmove[1] == null ||
      bestmove[2] == null ||
      bestmove[3] == null
    ) {
      continue;
    }
    color = colors[i];
    moveturn = moveturns[i];
    noteposition = notepositions[i];
    if (color == "blue") {
      notecolor = "#003088";
    } else if (color == "red") {
      notecolor = "#882020";
    } else if (color == "yellow") {
      notecolor = "#e68f00";
    } else if (color == "green") {
      notecolor = "#15781b";
    } else {
      notecolor = "#000000";
    }
    if (bestmove[0].startsWith("@")) {
      autoshapes.push({
        brush: color,
        orig: convertSquareToChessgroundXKey(bestmove[1]),
      });
    } else if (bestmove[0].includes("@")) {
      autoshapes.push({
        brush: color,
        orig: convertSquareToChessgroundXKey(bestmove[1]),
      });
      if (moveturn) {
        if (bestmove[0].charAt(0) == "+") {
          autoshapes.push({
            brush: color,
            dest: "a0",
            orig: convertSquareToChessgroundXKey(bestmove[1]),
            piece: {
              color: "white",
              role: "p" + bestmove[0].toLowerCase().charAt(1) + "-piece",
              scale: 0.7,
            },
            modifiers: { hilite: true },
          });
        } else {
          autoshapes.push({
            brush: color,
            dest: "a0",
            orig: convertSquareToChessgroundXKey(bestmove[1]),
            piece: {
              color: "white",
              role: bestmove[0].toLowerCase().charAt(0) + "-piece",
              scale: 0.7,
            },
            modifiers: { hilite: true },
          });
        }
      } else {
        if (bestmove[0].charAt(0) == "+") {
          autoshapes.push({
            brush: color,
            dest: "a0",
            orig: convertSquareToChessgroundXKey(bestmove[1]),
            piece: {
              color: "black",
              role: "p" + bestmove[0].toLowerCase().charAt(1) + "-piece",
              scale: 0.7,
            },
            modifiers: { hilite: true },
          });
        } else {
          autoshapes.push({
            brush: color,
            dest: "a0",
            orig: convertSquareToChessgroundXKey(bestmove[1]),
            piece: {
              color: "black",
              role: bestmove[0].toLowerCase().charAt(0) + "-piece",
              scale: 0.7,
            },
            modifiers: { hilite: true },
          });
        }
      }
    } else {
      if (bestmove[0] == bestmove[1]) {
        autoshapes.push({
          brush: "black",
          orig: convertSquareToChessgroundXKey(bestmove[0]),
          customSvg: generatePassTurnNotationSVG(notecolor),
        });
      } else {
        autoshapes.push({
          brush: color,
          dest: convertSquareToChessgroundXKey(bestmove[1]),
          orig: convertSquareToChessgroundXKey(bestmove[0]),
        });
      }
      if (bestmove[2] != "") {
        let piecerole = chessground.state.boardState.pieces.get(
          convertSquareToChessgroundXKey(bestmove[0]),
        ).role;
        autoshapes.push({
          brush: "black",
          orig: convertSquareToChessgroundXKey(bestmove[1]),
          customSvg: generateMoveNotationSVG(
            bestmove[2],
            notecolor,
            "#ffffff",
            noteposition,
          ),
        });
        if (bestmove[2] == "+") {
          if (moveturn) {
            autoshapes.push({
              brush: color,
              orig: convertSquareToChessgroundXKey(bestmove[1]),
              dest: convertSquareToChessgroundXKey(bestmove[0]),
              piece: { color: "white", role: "p" + piecerole },
            });
          } else {
            autoshapes.push({
              brush: color,
              orig: convertSquareToChessgroundXKey(bestmove[1]),
              dest: convertSquareToChessgroundXKey(bestmove[0]),
              piece: { color: "black", role: "p" + piecerole },
            });
          }
        } else if (bestmove[2] == "-") {
          if (moveturn) {
            autoshapes.push({
              brush: color,
              orig: convertSquareToChessgroundXKey(bestmove[1]),
              dest: convertSquareToChessgroundXKey(bestmove[0]),
              piece: { color: "white", role: piecerole.slice(1) },
            });
          } else {
            autoshapes.push({
              brush: color,
              orig: convertSquareToChessgroundXKey(bestmove[1]),
              dest: convertSquareToChessgroundXKey(bestmove[0]),
              piece: { color: "black", role: piecerole.slice(1) },
            });
          }
        } else {
          if (moveturn) {
            autoshapes.push({
              brush: color,
              orig: convertSquareToChessgroundXKey(bestmove[1]),
              dest: convertSquareToChessgroundXKey(bestmove[0]),
              piece: { color: "white", role: bestmove[2] + "-piece" },
            });
          } else {
            autoshapes.push({
              brush: color,
              orig: convertSquareToChessgroundXKey(bestmove[1]),
              dest: convertSquareToChessgroundXKey(bestmove[0]),
              piece: { color: "black", role: bestmove[2] + "-piece" },
            });
          }
        }
      }
    }
    if (bestmove[3] != "") {
      autoshapes.push({
        brush: color,
        orig: convertSquareToChessgroundXKey(bestmove[3]),
      });
      autoshapes.push({
        brush: color,
        dest: "a0",
        orig: convertSquareToChessgroundXKey(bestmove[3]),
        piece: {
          color: "black",
          role: "_-piece",
          scale: 0.7,
        },
        modifiers: { hilite: true },
      });
    }
  }
  chessground.setAutoShapes(autoshapes);
}

function getNotation(
  notation,
  variant,
  startfen,
  is960,
  ucimovestr,
  usemovetree,
) {
  if (
    typeof notation != "string" ||
    typeof variant != "string" ||
    typeof startfen != "string" ||
    typeof is960 != "boolean" ||
    typeof ucimovestr != "string" ||
    typeof usemovetree != "boolean"
  ) {
    throw TypeError();
  }
  if (notation == "") {
    return "(Missing notation system, please select one in the dropdown...)";
  }
  if (ffish) {
    if (window.fairyground) {
      if (window.fairyground.BinaryEngineFeature) {
        const fge = window.fairyground.BinaryEngineFeature;
        const variants = ffish.variants().split(" ");
        let ucimoves = ucimovestr.trim();
        if (variants.includes(variant)) {
          if (ffish.validateFen(startfen, variant, is960) >= 0) {
            let tmpboard = new ffish.Board(variant, startfen, is960);
            let moveslist = ucimoves.split(/[ ]+/).reverse();
            let result = "";
            let tmpboardresult = "";
            let notationindex = simplenotations.indexOf(notation);
            if (moveslist.length == 1 && moveslist[0] == "") {
            } else {
              while (moveslist.length > 0) {
                if (!tmpboard.push(moveslist.pop())) {
                  return null;
                }
              }
            }
            tmpboardresult = tmpboard.result();
            if (tmpboardresult == "*") {
              if (tmpboard.result(true) != "*") {
                tmpboardresult = tmpboard.result(true);
              } else if (tmpboard.result(false) != "*") {
                tmpboardresult = tmpboard.result(false);
              }
            }
            if (notationindex >= 0) {
              if (usemovetree) {
                result = gametree.ToString(
                  ffishnotationobjects[notationindex],
                  false,
                );
              } else {
                tmpboard.setFen(startfen);
                result =
                  tmpboard.variationSan(
                    ucimoves,
                    ffishnotationobjects[notationindex],
                  ) + (tmpboardresult !== "*" ? " " + tmpboardresult : "");
              }
            } else if (notation == "FEN") {
              result = tmpboard.fen();
            } else if (notation == "PGN") {
              const gameresult = tmpboardresult;
              tmpboard.setFen(startfen);
              const today = new Date();
              const year = today.getFullYear();
              const month = today.getMonth() + 1;
              const day = today.getDate();
              //const hours = today.getHours();
              //const minutes = today.getMinutes();
              //const seconds = today.getSeconds();
              let whitename = "";
              let blackname = "";
              if (playWhite.checked) {
                if (fge.first_engine) {
                  whitename = fge.first_engine.Name;
                } else {
                  whitename = "In browser Fairy-Stockfish";
                }
              } else {
                whitename = "Human Player";
              }
              if (playBlack.checked) {
                if (fge.second_engine) {
                  blackname = fge.second_engine.Name;
                } else {
                  blackname = "In browser Fairy-Stockfish";
                }
              } else {
                blackname = "Human Player";
              }
              result = `[Event "Fairy-Stockfish Playground Match"]\n[Site "${window.location.host}"]\n[Date "${year.toString() + "." + month.toString() + "." + day.toString()}"]\n`;
              result += `[Round "1"]\n[White "${whitename}"]\n[Black "${blackname}"]\n`;
              result += `[FEN "${startfen}"]\n[Result "${gameresult}"]\n[Variant "${tmpboard.variant()}"]\n\n`;
              result += tmpboard.variationSan(ucimoves, ffish.Notation.SAN);
            } else if (notation == "EPD") {
              const today = new Date();
              const year = today.getFullYear();
              const month = today.getMonth() + 1;
              const day = today.getDate();
              //const hours = today.getHours();
              //const minutes = today.getMinutes();
              //const seconds = today.getSeconds();
              let whitename = "";
              let blackname = "";
              if (playWhite.checked) {
                if (fge.first_engine) {
                  whitename = fge.first_engine.Name;
                } else {
                  whitename = "In browser Fairy-Stockfish";
                }
              } else {
                whitename = "Human Player";
              }
              if (playBlack.checked) {
                if (fge.second_engine) {
                  blackname = fge.second_engine.Name;
                } else {
                  blackname = "In browser Fairy-Stockfish";
                }
              } else {
                blackname = "Human Player";
              }
              result = `${tmpboard.fen()};`;
              result += ` acd 0;`;
              result += ` acn 0;`;
              result += ` acs 0;`;
              result += ` am 0000;`;
              result += ` bm 0000;`;
              result += ` ce 0.0;`;
              result += ` dm 0;`;
              result += ` draw_accept "null";`;
              result += ` draw_claim "null";`;
              result += ` draw_reject "null";`;
              result += ` eco "null";`;
              result += ` fmvn 0;`;
              result += ` hmvc 0;`;
              result += ` id "Fairy-Stockfish Playground Match";`;
              result += ` nic "null";`;
              result += ` pm 0000;`;
              result += ` pv 0;`;
              result += ` rc 0;`;
              result += ` resign "null";`;
              result += ` sm 0000;`;
              result += ` tcgs "null";`;
              result += ` tcri "null";`;
              result += ` tcsi "null";`;
              result += ` v0 "null";`;
              result += ` variant "${tmpboard.variant()}";`;
              result += ` site "${window.location.host}";`;
              result += ` date "${year.toString() + "." + month.toString() + "." + day.toString()}";`;
              result += ` result "${tmpboardresult}";`;
              result += ` first_player "${whitename}";`;
              result += ` second_player "${blackname}";`;
            } else if (notation == "FEN+UCIMOVE") {
              tmpboard.setFen(startfen);
              result = tmpboard.fen() + "|" + ucimoves;
            } else if (notation == "FEN+USIMOVE") {
              tmpboard.setFen(startfen);
              let dimensions = getDimensions();
              const convertedmoves = fge.convertUCImovestoUSImoves(
                ucimoves,
                dimensions.width,
                dimensions.height,
              );
              if (convertedmoves != null) {
                result = tmpboard.fen() + "|" + convertedmoves;
              } else {
                result =
                  tmpboard.fen() +
                  "|(There are moves that cannot be displayed in USI moves, such as pawn promotion or seirawan gating)";
              }
            } else if (notation == "FEN+UCCIMOVE") {
              tmpboard.setFen(startfen);
              let dimensions = getDimensions();
              const convertedmoves = fge.convertUCImovestoUCCImoves(
                ucimoves,
                dimensions.width,
                dimensions.height,
              );
              if (convertedmoves != null) {
                result = tmpboard.fen() + "|" + convertedmoves;
              } else {
                result =
                  tmpboard.fen() +
                  "|(There are moves that cannot be displayed in UCCI moves, such as pawn promotion or seirawan gating)";
              }
            } else if (notation == "SFEN+USIMOVE") {
              tmpboard.setFen(startfen);
              let dimensions = getDimensions();
              const convertedmoves = fge.convertUCImovestoUSImoves(
                ucimoves,
                dimensions.width,
                dimensions.height,
              );
              if (convertedmoves != null) {
                result =
                  fge.ConvertFENtoSFEN(tmpboard.fen()) +
                  "|" +
                  fge.convertUCImovestoUSImoves(
                    ucimoves,
                    dimensions.width,
                    dimensions.height,
                  );
              } else {
                result =
                  fge.ConvertFENtoSFEN(tmpboard.fen()) +
                  "|(There are moves that cannot be displayed in USI moves, such as pawn promotion or seirawan gating)";
              }
            }
            tmpboard.delete();
            return result;
          } else {
            return "Illegal FEN";
          }
        } else {
          return null;
        }
      } else {
        throw Error(
          "Namespace window.fairyground.BinaryEngineFeature does not exist",
        );
      }
    } else {
      throw Error("Namespace window.fairyground does not exist");
    }
  } else {
    throw Error("ffish.js is not initialized!!!");
  }
}

function onPositionSet() {
  const fen = textFen.value.trim();
  const WhiteSpaceMatcher = new RegExp("[ ]+", "");

  if (!fen || validateFEN(fen, false)) {
    if (fen) board.setFen(fen);
    else board.reset();
    const moves = textMoves.value.trim().split(WhiteSpaceMatcher);
    let move = "";
    let i = 0;

    for (i = 0; i < moves.length; i++) {
      move = moves[i];
      if (move == "") {
        continue;
      }
      if (!board.push(move)) {
        buttonStop.click();
        moves.splice(i, 1);
        i--;
        window.alert(`Illegal move: ${move}`);
      }
    }
    textMoves.value = moves.join(" ");

    updateChessground(true);

    if (
      board.isGameOver() ||
      board.isGameOver(true) ||
      board.isGameOver(false)
    ) {
      if (board.result() != "*") {
        document.dispatchEvent(
          new CustomEvent("gameend", { detail: { result: board.result() } }),
        );
      } else if (board.result(true) != "*") {
        document.dispatchEvent(
          new CustomEvent("gameend", {
            detail: { result: board.result(true) },
          }),
        );
      } else if (board.result(false) != "*") {
        document.dispatchEvent(
          new CustomEvent("gameend", {
            detail: { result: board.result(false) },
          }),
        );
      }
    }
  } else {
    const moves = gametree.GetMoveListOfMove(gametree.CurrentMove);
    board.setFen(gametree.OriginalFEN);
    board.pushMoves(moves);
    textFen.value = gametree.OriginalFEN;
    textMoves.value = moves;
    updateChessground(true);
  }
  recordedmultipv = 1;
}

function getDimensions() {
  if (!board) {
    return {
      width: 8,
      height: 8,
    };
  }
  const fenBoard = board.fen().split(" ")[0];
  const ranks = fenBoard.split("/").length;
  const lastRank = fenBoard.split("/")[0].replace(/[^0-9a-z*]/gi, "");
  let files = lastRank.length;

  for (const match of lastRank.matchAll(/\d+/g)) {
    files += parseInt(match[0]) - match[0].length;
  }

  //console.log("Board: %dx%d", files, ranks);
  return {
    width: files,
    height: ranks,
  };
}

import Module from "ffish-es6";
new Module().then((loadedModule) => {
  ffish = loadedModule;
  console.log("ffish.js initialized!");
  window.ffishlib = loadedModule; //Used in dev tools for debugging purposes and transfer to <script>
  initBoard(dropdownVariant.value);
  soundMove.volume = rangeVolume.value;
  soundCapture.volume = rangeVolume.value;
  soundCheck.volume = rangeVolume.value;
  soundTerminal.volume = rangeVolume.value;
  loadThemes.click();
  LoadPositionVariant("server", null);
  ffishnotationobjects = [
    ffish.Notation.DEFAULT,
    ffish.Notation.SAN,
    ffish.Notation.LAN,
    ffish.Notation.SHOGI_HOSKING,
    ffish.Notation.SHOGI_HODGES,
    ffish.Notation.SHOGI_HODGES_NUMBER,
    ffish.Notation.JANGGI,
    ffish.Notation.XIANGQI_WXF,
    ffish.Notation.THAI_SAN,
    ffish.Notation.THAI_LAN,
  ];
  const singleblankmatcher = new RegExp("[ ]+");

  variantsIni.onchange = function (e) {
    const selected = e.currentTarget.files[0];
    resetTimer();
    recordedmultipv = 1;
    if (selected) {
      selected.text().then(function (ini) {
        console.log(ini);
        ffish.loadVariantConfig(ini);
      });
    }
  };

  dropdownVariant.onchange = function () {
    if (!ffish.variants().includes(dropdownVariant.value)) return;
    const oldDimensions = getDimensions();
    initBoard(dropdownVariant.value);
    const newDimensions = getDimensions();
    chessgroundContainerEl.setAttribute(
      "style",
      `--files:${newDimensions.width};--ranks:${newDimensions.height}`,
    );
    chessgroundMiniContainerEl.setAttribute(
      "style",
      `--files:${newDimensions.width};--ranks:${newDimensions.height}`,
    );
    chessgroundContainerEl.classList.toggle(
      `board${oldDimensions["width"]}x${oldDimensions["height"]}`,
    );
    chessgroundContainerEl.classList.toggle(
      `board${newDimensions["width"]}x${newDimensions["height"]}`,
    );

    chessgroundMiniContainerEl.classList.toggle(
      `board${oldDimensions["width"]}x${oldDimensions["height"]}`,
    );
    chessgroundMiniContainerEl.classList.toggle(
      `board${newDimensions["width"]}x${newDimensions["height"]}`,
    );

    themedetector.SetBoardDimensions(newDimensions.width, newDimensions.height);

    if (ffish.capturesToHand(dropdownVariant.value)) {
      console.log("pockets");
      chessgroundContainerEl.classList.add("pockets");
      chessgroundMiniContainerEl.classList.add("pockets");
    } else {
      chessgroundContainerEl.classList.remove("pockets");
      chessgroundMiniContainerEl.classList.remove("pockets");
    }
    resetTimer();
    clearMovesList();

    initializeThemes.click();
    setPieceList(
      getUsedPieceID(dropdownVariant.value, checkboxFischerRandom.checked),
    );
    positionInformation.innerHTML = "";
    UpdateVariantsPositionTypeDropdown();
    UpdateVariantsPositionNameDropdown();
    pvinfo.innerHTML = "";

    updateInnerCoordinateColor(chessground);

    window.setTimeout(() => {
      buttonReset.click();
    }, 10);
  };

  buttonFlip.onclick = function () {
    chessground.toggleOrientation();
    chessground_mini.toggleOrientation();
    updateInnerCoordinateColor(chessground);
  };

  buttonUndo.onclick = function () {
    if (board.moveStack().length === 0) return;
    board.pop();
    const moves = textMoves.value;
    textMoves.value = moves.substring(0, moves.lastIndexOf(" ")).trim();
    chessground.cancelPremove();
    buttonSetFen.click();
  };

  buttonMoveTreeClear.onclick = function () {
    if (!buttonMoveTreeClear.disabled) {
      gametree.ClearMoves();
      textFen.value = gametree.OriginalFEN;
      textMoves.value = "";
      buttonSetFen.click();
    }
  };

  buttonMoveTreeCrop.onclick = function () {
    if (!buttonMoveTreeCrop.disabled) {
      gametree.CropCurrentMove();
      textFen.value = gametree.OriginalFEN;
      textMoves.value = gametree.GetMoveListOfMove(gametree.CurrentMove);
      buttonSetFen.click();
    }
  };

  buttonMoveTreeCut.onclick = function () {
    if (!buttonMoveTreeCut.disabled) {
      gametree.CutCurrentMove();
      textFen.value = gametree.OriginalFEN;
      textMoves.value = gametree.GetMoveListOfMove(gametree.CurrentMove);
      buttonSetFen.click();
    }
  };

  buttonMoveTreeHideShow.onclick = function () {
    if (!buttonMoveTreeHideShow.disabled) {
      gametree.ShowOrHideCurrentMove();
      updatePGNDivision();
    }
  };

  buttonMoveTreeRemoveVariations.onclick = function () {
    if (!buttonMoveTreeRemoveVariations.disabled) {
      gametree.RemoveVariationsOfCurrentMove();
      updatePGNDivision();
    }
  };

  buttonMoveTreeRedo.onclick = function () {
    if (!buttonMoveTreeRedo.disabled) {
      gametree.Redo();
      textFen.value = gametree.OriginalFEN;
      textMoves.value = gametree.GetMoveListOfMove(gametree.CurrentMove);
      buttonSetFen.click();
    }
  };

  buttonMoveTreeCutBranch.onclick = function () {
    if (!buttonMoveTreeCutBranch.disabled) {
      gametree.RemoveCurrentMoveBranch();
      textFen.value = gametree.OriginalFEN;
      textMoves.value = gametree.GetMoveListOfMove(gametree.CurrentMove);
      buttonSetFen.click();
    }
  };

  buttonMoveTreeCropBranch.onclick = function () {
    if (!buttonMoveTreeCropBranch.disabled) {
      gametree.RemoveNonCurrentMoveBranch();
      updatePGNDivision();
    }
  };

  buttonMoveTreeSave.onclick = function () {
    let result = "";
    let tmpboard = new ffish.Board(
      gametree.Variant,
      gametree.OriginalFEN,
      gametree.Is960,
    );
    let tmpboardresult = "";
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    let whitename = "";
    let blackname = "";
    tmpboard.pushMoves(gametree.GetMainLineMoveList());
    tmpboardresult = tmpboard.result();
    if (tmpboardresult == "*") {
      if (tmpboard.result(true) != "*") {
        tmpboardresult = tmpboard.result(true);
      } else if (tmpboard.result(false) != "*") {
        tmpboardresult = tmpboard.result(false);
      }
    }
    if (playWhite.checked) {
      if (fge.first_engine) {
        whitename = fge.first_engine.Name;
      } else {
        whitename = "In browser Fairy-Stockfish";
      }
    } else {
      whitename = "Human Player";
    }
    if (playBlack.checked) {
      if (fge.second_engine) {
        blackname = fge.second_engine.Name;
      } else {
        blackname = "In browser Fairy-Stockfish";
      }
    } else {
      blackname = "Human Player";
    }
    result = `[Event "Fairy-Stockfish Playground Game"]\n[Site "${window.location.host}"]\n[Date "${year.toString() + "." + month.toString() + "." + day.toString()}"]\n`;
    result += `[Round "1"]\n[White "${whitename}"]\n[Black "${blackname}"]\n`;
    result += `[FEN "${gametree.OriginalFEN}"]\n[Result "${tmpboardresult}"]\n[Variant "${gametree.Variant}"]\n\n`;
    result += gametree.ToString(ffish.Notation.SAN, true) + "\n";
    DownloadFile(result, "game.pgn", "text/plain");
  };

  buttonMoveTreeSaveImage.onclick = function () {
    imageGenerator.classList.remove("hidden");
    themedetector.SetOrientation(chessground.state.orientation);
    inputFrameDuration.disabled =
      dropdownImageFileType[dropdownImageFileType.selectedIndex].value != "GIF";
    inputImageQuality.disabled =
      dropdownImageFileType[dropdownImageFileType.selectedIndex].value == "PNG";
  };

  buttonMoveTreeSetAsMainLine.onclick = function () {
    if (!buttonMoveTreeSetAsMainLine.disabled) {
      gametree.SetCurrentMoveBranchAsMainLine();
      updatePGNDivision();
    }
  };

  buttonMoveTreeSetToMainBranch.onclick = function () {
    if (!buttonMoveTreeSetToMainBranch.disabled) {
      gametree.SetCurrentMoveToMainBranch();
      updatePGNDivision();
    }
  };

  buttonMoveTreeSymbol.onclick = function () {
    if (!buttonMoveTreeSymbol.disabled) {
      let symbol = window.prompt(
        "Please enter the symbol of current move to set:",
        gametree.CurrentMove.Move.Symbol,
      );
      if (symbol != null) {
        if (symbol == "" || moveutil.Symbols.includes(symbol)) {
          gametree.SetSymbolOfCurrentMove(symbol);
          updatePGNDivision();
        } else {
          window.alert(
            "Invalid symbol: " +
              symbol +
              ".\nValid symbols are: " +
              moveutil.Symbols.join(", "),
          );
        }
      }
    }
  };

  buttonMoveTreeTextAfter.onclick = function () {
    if (!buttonMoveTreeTextAfter.disabled) {
      let text = window.prompt(
        "Please enter the text after current move:",
        gametree.CurrentMove.Move.TextAfter,
      );
      if (text != null) {
        if (text.includes("{") || text.includes("}")) {
          window.alert('Text must not contain "{" or "}".');
        } else {
          gametree.SetTextAfterOfCurrentMove(text);
          updatePGNDivision();
        }
      }
    }
  };

  buttonMoveTreeTextBefore.onclick = function () {
    if (!buttonMoveTreeTextBefore.disabled) {
      let text = window.prompt(
        "Please enter the text before current move:",
        gametree.CurrentMove.Move.TextBefore,
      );
      if (text != null) {
        if (text.includes("{") || text.includes("}")) {
          window.alert('Text must not contain "{" or "}".');
        } else {
          gametree.SetTextBeforeOfCurrentMove(text);
          updatePGNDivision();
        }
      }
    }
  };

  buttonMoveTreeUncomment.onclick = function () {
    if (!buttonMoveTreeUncomment.disabled) {
      gametree.UncommentCurrentMove();
      updatePGNDivision();
    }
  };

  buttonMoveTreeUndo.onclick = function () {
    if (!buttonMoveTreeUndo.disabled) {
      gametree.Undo();
      textFen.value = gametree.OriginalFEN;
      textMoves.value = gametree.GetMoveListOfMove(gametree.CurrentMove);
      buttonSetFen.click();
    }
  };

  rangeVolume.oninput = function () {
    soundMove.volume = rangeVolume.value;
    soundCapture.volume = rangeVolume.value;
    soundCheck.volume = rangeVolume.value;
    soundTerminal.volume = rangeVolume.value;
  };

  checkboxDests.oninput = function () {
    chessground.set({
      movable: {
        showDests: checkboxDests.checked,
      },
    });
  };

  pSetFen.onclick = onPositionSet;

  buttonSetFen.onclick = onPositionSet;

  buttonNextPosition.onclick = function () {
    if (gametree.CurrentMove.NextNodes[0]) {
      textMoves.value = gametree.GetMoveListOfMove(
        gametree.CurrentMove.NextNodes[0],
      );
      buttonSetFen.click();
    }
  };

  buttonPreviousPosition.onclick = function () {
    if (gametree.CurrentMove.PreviousNode) {
      textMoves.value = gametree.GetMoveListOfMove(
        gametree.CurrentMove.PreviousNode,
      );
      buttonSetFen.click();
    }
  };

  buttonInitialPosition.onclick = function () {
    textMoves.value = "";
    buttonSetFen.click();
  };

  buttonFinalPosition.onclick = function () {
    textMoves.value = gametree.GetCompleteMainLineMoveListOfMove(
      gametree.CurrentMove,
    );
    buttonSetFen.click();
  };

  buttonCurrentPosition.onclick = function () {
    textMoves.value = gametree.GetMainLineMoveList();
    buttonSetFen.click();
  };

  buttonSpecifiedPosition.onclick = function () {
    let level = 0;
    let pointer = gametree.CurrentMove;
    let targetlevel = parseInt(inputHalfMoveNumber.value);
    if (isNaN(targetlevel) || targetlevel < 0) {
      targetlevel = 0;
    }
    while (pointer != gametree.MoveTree.RootNode) {
      pointer = pointer.PreviousNode;
      level++;
    }
    pointer = gametree.CurrentMove;
    if (level > targetlevel) {
      while (level != targetlevel) {
        pointer = pointer.PreviousNode;
        level--;
      }
      textMoves.value = gametree.GetMoveListOfMove(pointer);
      buttonSetFen.click();
    } else if (level < targetlevel) {
      while (level != targetlevel) {
        if (pointer.NextNodes[0]) {
          pointer = pointer.NextNodes[0];
          level++;
        } else {
          break;
        }
      }
      textMoves.value = gametree.GetMoveListOfMove(pointer);
      buttonSetFen.click();
    }
  };

  gameStatus.onclick = function () {
    gameStatus.innerText = getGameStatus(false);
  };

  setPgnString.onclick = function () {
    let tokens = setPgnString.value.split("\x01");
    let result = pgnutil.ParsePGNMovesToMoveTree(
      tokens[2],
      board.variant(),
      board.is960(),
      tokens[0],
      ffish.Notation.SAN,
      ffish,
    );
    if (result) {
      gametree.MoveTree = result;
      gametree.ClearHistory();
      gametree.OriginalFEN = tokens[0];
      gametree.GoToMoveList(tokens[1]);
      textFen.value = tokens[0];
      textMoves.value = tokens[1];
      buttonSetFen.click();
    } else {
      window.alert(
        "There is a problem when parsing the PGN. Press Ctrl+Shift+I to see what's going on.",
      );
    }
  };

  buttonGameStart.onclick = function () {
    if (
      (playWhite.checked == true || randomMoverWhite.checked == true) &&
      playBlack.checked == false &&
      randomMoverBlack.checked == false
    ) {
      chessground.set({
        orientation: "black",
      });
      updateInnerCoordinateColor(chessground);
    }
    if (
      playWhite.checked == false &&
      randomMoverWhite.checked == false &&
      (playBlack.checked == true || randomMoverBlack.checked == true)
    ) {
      chessground.set({
        orientation: "white",
      });
      updateInnerCoordinateColor(chessground);
    }

    // Force coordinate recalculation to fix coordinate mapping issues
    // This addresses the bug where coordinates get messed up after game start
    setTimeout(() => {
      forceCoordinateRecalculation();
    }, 100);
  };

  isBoardSetup.onchange = function () {
    if (isBoardSetup.checked) {
      updateChessground(false);
      chessground.set({
        check: [],
        movable: {
          color: "both",
          dests: EmptyMap,
        },
        draggable: {
          deleteOnDropOff: true,
        },
      });
    } else {
      buttonSetFen.click();
    }
  };

  isAdvPGNMode.onchange = function () {
    dropdownNotationSystem.dispatchEvent(new Event("change"));
  };

  buttonClearBoard.onclick = function () {
    chessground.state.boardState.pieces.clear();
    chessground.set({
      lastMove: undefined,
    });
  };

  buttonInitialBoardPosition.onclick = function () {
    chessground.set({
      fen: ffish.startingFen(dropdownVariant.value),
      lastMove: undefined,
    });
  };

  buttonAddToPocket.onclick = function () {
    if (
      ffish.capturesToHand(dropdownVariant.value) ||
      ffish.startingFen(dropdownVariant.value).includes("[")
    ) {
      if (dropdownSetPiece.value.includes("+")) {
        window.alert(
          "Promoted pieces cannot go into pockets. If you have dropLoop = true, Please directly add the target piece. For example, if you have a:c, then instead of adding +a, you need to add c.",
        );
      } else if (
        "a" <= dropdownSetPiece.value &&
        dropdownSetPiece.value <= "z"
      ) {
        addPieceToPocket(dropdownSetPiece.value.toLowerCase(), "black");
      } else if (
        "A" <= dropdownSetPiece.value &&
        dropdownSetPiece.value <= "Z"
      ) {
        addPieceToPocket(dropdownSetPiece.value.toLowerCase(), "white");
      } else if (dropdownSetPiece.value == "*") {
        window.alert("Error: Cannot add wall squares to pocket.");
      } else {
        window.alert(
          "Please select a piece (in a letter with or without promotion mark, such as 'a' or '+a') in order to add to pocket.",
        );
      }
    } else {
      window.alert("This variant does not have a pocket.");
    }
  };

  buttonBoardSetupCopyFEN.onclick = function () {
    let FEN = getFEN(true);
    if (FEN == null) {
      return;
    }
    if (validateFEN(FEN, false)) {
      textFen.value = FEN;
      textMoves.value = "";
      copySetFEN.click();
    } else {
      window.alert("Failed to apply the position. There are errors in it.");
    }
  };

  buttonValidatePosition.onclick = function () {
    validateFEN(getFEN(true), true);
  };

  dropdownSetPiece.onchange = function () {
    if (dropdownSetPiece.value == "<move>") {
      chessground.set({
        movable: {
          color: "both",
          dests: EmptyMap,
        },
        draggable: {
          deleteOnDropOff: true,
        },
      });
    } else {
      disableBoardMove();
    }
  };

  dropdownPositionVariantType.onchange = function () {
    if (dropdownPositionVariantType.value == "(default)") {
      textFen.value = "";
      textMoves.value = "";
      buttonSetFen.click();
    }
    UpdateVariantsPositionNameDropdown();
    positionInformation.innerHTML = "";
  };

  dropdownPositionVariantName.onchange = function () {
    let VariantTypeDirectory = null;
    let VariantNameDirectory = null;
    if (PositionVariantsDirectory.has(dropdownVariant.value)) {
      VariantTypeDirectory = PositionVariantsDirectory.get(
        dropdownVariant.value,
      );
      if (VariantTypeDirectory.has(dropdownPositionVariantType.value)) {
        VariantNameDirectory = VariantTypeDirectory.get(
          dropdownPositionVariantType.value,
        );
        if (VariantNameDirectory.has(dropdownPositionVariantName.value)) {
          let game = VariantNameDirectory.get(
            dropdownPositionVariantName.value,
          );
          textFen.value = game.FEN;
          positionInformation.innerHTML = game.Description;
          textMoves.value = game.Moves;
          pSetFen.click();
        } else {
          dropdownPositionVariantName.selectedIndex = -1;
          positionInformation.innerHTML = "";
        }
      } else {
        dropdownPositionVariantName.selectedIndex = -1;
        positionInformation.innerHTML = "";
      }
    } else {
      dropdownPositionVariantName.selectedIndex = -1;
      positionInformation.innerHTML = "";
    }
    recordedmultipv = 1;
  };

  buttonAboutPosition.onclick = function () {
    if (dropdownPositionVariantName.selectedIndex == -1) {
      window.alert(
        'Please select a position in "Position Variant Name"!\nIf there is nothing, it means that this chess variant does not have any position variant!',
      );
      return;
    }
    window.alert(
      dropdownVariant.value +
        "\\" +
        dropdownPositionVariantType.value +
        "\\" +
        dropdownPositionVariantName.value +
        ":\n" +
        positionInformation.innerHTML,
    );
  };

  positionVariantTxt.onchange = onSelectPositionVariantsFile;

  clickClickMove.onchange = function () {
    if (clickClickMove.checked == true) {
      chessground.set({
        selectable: {
          enabled: true,
        },
      });
    } else {
      chessground.set({
        selectable: {
          enabled: false,
        },
      });
    }
  };

  buttonReset.onclick = function () {
    textFen.value = "";
    textMoves.value = "";
    dropdownPositionVariantType.selectedIndex = 0;
    dropdownPositionVariantType.onchange();
    clearMovesList();
  };

  buttonPassMove.onclick = function () {
    if (
      chessground.state.movable.color == "both" ||
      chessground.state.movable.color == undefined
    ) {
      return;
    }
    const moves = board
      .legalMoves()
      .trim()
      .split(" ")
      .filter((element) => {
        if (typeof element != "string" || element.length < 4) {
          return false;
        }
        const files = element.split(/[0-9]+/).filter((elem1) => {
          return elem1 != "";
        });
        const ranks = element.split(/[a-z]+/).filter((elem1) => {
          return elem1 != "";
        });
        return files[0] == files[1] && ranks[0] == ranks[1];
      });
    if (moves == null || moves.length == 0) {
      alert(
        "Cannot pass your turn currently. This variant does not allow passing or there are restrictions on passing your turn.",
      );
      return;
    }
    const passmove = {
      orig: moves[0].match(/[a-z]+[0-9]+/g)[0],
      dest: moves[0].match(/[a-z]+[0-9]+/g)[1],
    };
    if (passmove.orig == null || passmove.dest == null) {
      return;
    }
    afterChessgroundMove(passmove.orig, passmove.dest, {
      premove: false,
      ctrlKey: false,
      holdTime: 0,
      captured: {
        role: null,
        color: null,
        promoted: false,
      },
      predrop: false,
    });
  };

  buttonPlaceWall.onclick = function () {
    if (
      chessground.state.movable.color == "both" ||
      chessground.state.movable.color == undefined
    ) {
      return;
    }
    const moves = board
      .legalMoves()
      .trim()
      .split(" ")
      .filter((element) => {
        if (
          typeof element != "string" ||
          element.length < 4 ||
          !element.includes(",")
        ) {
          return false;
        }
        let elem = element.substring(0, element.indexOf(","));
        const files = elem.split(/[0-9]+/).filter((elem1) => {
          return elem1 != "";
        });
        const ranks = elem.split(/[a-z]+/).filter((elem1) => {
          return elem1 != "";
        });
        return files[0] == files[1] && ranks[0] == ranks[1];
      });
    if (moves == null || moves.length == 0) {
      alert(
        "Cannot place a wall without moving currently. This variant does not allow walling or there are restrictions on walling without moving.",
      );
      return;
    }
    const wallmove = {
      orig: moves[0].match(/[a-z]+[0-9]+/g)[0],
      dest: moves[0].match(/[a-z]+[0-9]+/g)[1],
    };
    if (wallmove.orig == null || wallmove.dest == null) {
      return;
    }
    afterChessgroundMove(wallmove.orig, wallmove.dest, {
      premove: false,
      ctrlKey: false,
      holdTime: 0,
      captured: {
        role: null,
        color: null,
        promoted: false,
      },
      predrop: false,
    });
  };

  engineOutput.onclick = function () {
    if (isAnalysis.checked == false) {
      return;
    }
    let text = engineOutput.value;
    let multipvid = 0;
    let bestpv = 0;
    let index = 0;
    if (/( upperbound )|( lowerbound )/.test(text)) {
      return;
    }
    if (text.includes(" multipv ")) {
      let textparselist = text.split(singleblankmatcher);
      let pvindex = textparselist.indexOf("pv");
      if (pvindex < 0) {
        return;
      }
      let pvmove = textparselist[pvindex + 1];
      let tmpboard = new ffish.Board(
        board.variant(),
        board.fen(),
        board.is960(),
      );
      if (!tmpboard.push(pvmove)) {
        tmpboard.delete();
        return;
      }
      tmpboard.delete();
      multipvid =
        parseInt(textparselist[textparselist.indexOf("multipv") + 1]) - 1;
      if (multipvid + 1 > recordedmultipv) {
        recordedmultipv = multipvid + 1;
      }
    }
    let bestmove = "";
    let ponder = "";
    if (text.includes(" score ") && text.includes(" pv ")) {
      let textparselist = text.split(singleblankmatcher);
      let scoreindex = textparselist.indexOf("score");
      let pvindex = textparselist.indexOf("pv");
      let evaltext = textparselist.at(scoreindex + 1);
      if (evaltext == "mate") {
        let matenum = parseInt(textparselist.at(scoreindex + 2));
        if (!board.turn()) {
          matenum = matenum * -1;
        }
        multipvrecord[multipvid][0] = true;
        multipvrecord[multipvid][1] = matenum;
        evaluationindex[multipvid] = mateevalfactor / matenum;
        evaluation = evaluationindex[multipvid];
      } else if (evaltext == "cp") {
        let evalval = parseInt(textparselist.at(scoreindex + 2)) / 100;
        if (!board.turn()) {
          evalval = evalval * -1;
        }
        multipvrecord[multipvid][0] = false;
        multipvrecord[multipvid][1] = evalval;
        evaluationindex[multipvid] = evalval;
        evaluation = evaluationindex[multipvid];
      } else {
        multipvrecord[multipvid][0] = false;
        multipvrecord[multipvid][1] = 0;
        evaluationindex[multipvid] = 0;
        console.log("Detected bad evaluation");
      }
      let moves = textparselist.slice(pvindex + 1);
      if (moves.length == 0) {
        return;
      } else if (moves.length == 1) {
        bestmove = moves[0];
      } else {
        bestmove = moves[0];
        ponder = moves[1];
      }
      multipvrecord[multipvid][2] = bestmove;
      multipvrecord[multipvid][3] = ponder;
      multipvrecord[multipvid][4] = moves.join(" ");
      index = textparselist.indexOf("depth");
      if (index > 0) {
        multipvrecord[multipvid][5] = parseInt(textparselist[index + 1]);
      } else {
        multipvrecord[multipvid][5] = -1;
      }
      index = textparselist.indexOf("seldepth");
      if (index > 0) {
        multipvrecord[multipvid][6] = parseInt(textparselist[index + 1]);
      } else {
        multipvrecord[multipvid][6] = -1;
      }
      //Update Evaluation Section
      let k = 0;
      let seldepthlist = [];
      let depthlist = [];
      if (isAdvPGNMode.checked) {
        if (multipvminiboardtimer == null) {
          multipvminiboardtimer = setTimeout(() => {
            pvinfo.innerHTML = "";
            pvinfo.appendChild(multipvminiboardhandler.GetMovesDivElement());
            multipvminiboardtimer = null;
          }, 1000);
        }
        multipvminiboardhandler.SetValidPrincipalVariationCount(
          recordedmultipv,
        );
        for (k = 0; k < recordedmultipv; k++) {
          multipvminiboardhandler.SetPrincipalVariation(
            k + 1,
            board.variant(),
            board.is960(),
            board.fen(),
            multipvrecord[k][4],
            multipvrecord[k][0],
            multipvrecord[k][1],
            multipvrecord[k][5],
            multipvrecord[k][6],
          );
          depthlist.push(multipvrecord[k][5]);
          seldepthlist.push(multipvrecord[k][6]);
        }
      } else {
        let pvinfostr = "";
        let showevalnum = "";
        for (k = 0; k < recordedmultipv; k++) {
          if (multipvrecord[k][0]) {
            if (multipvrecord[k][1] > 0) {
              showevalnum = `#+${parseInt(multipvrecord[k][1])}`;
            } else {
              showevalnum = `#${parseInt(multipvrecord[k][1])}`;
            }
          } else {
            if (multipvrecord[k][1] > 0) {
              showevalnum = `+${multipvrecord[k][1].toFixed(2)}`;
            } else {
              showevalnum = multipvrecord[k][1].toFixed(2).toString();
            }
          }
          pvinfostr += `${k > 0 ? "<hr />" : ""}Principal Variation ${k + 1}: (Depth: Average ${multipvrecord[k][5] > -1 ? multipvrecord[k][5] : "❓"} Max ${multipvrecord[k][6] > -1 ? multipvrecord[k][6] : "❓"}) <evalnum>${showevalnum}</evalnum> ${getNotation(
            dropdownNotationSystem[dropdownNotationSystem.selectedIndex].value,
            board.variant(),
            board.fen(),
            board.is960(),
            multipvrecord[k][4],
            false,
          )}\n`;
          depthlist.push(multipvrecord[k][5]);
          seldepthlist.push(multipvrecord[k][6]);
        }
        pvinfo.innerHTML = pvinfostr;
      }
      let nodeinfo = "❓";
      index = textparselist.indexOf("nodes");
      if (index > 0) {
        nodeinfo = textparselist[index + 1];
      }
      let npsinfo = "❓";
      index = textparselist.indexOf("nps");
      if (index > 0) {
        npsinfo = textparselist[index + 1];
      }
      let timeinfo = "❓";
      index = textparselist.indexOf("time");
      if (index > 0) {
        timeinfo = textparselist[index + 1];
      }
      let maxdepth = Math.max(...depthlist);
      let maxseldepth = Math.max(...seldepthlist);
      evalinfo.innerText = `Depth (Average): ${maxdepth > 0 ? maxdepth : "❓"}\nSelective Depth (Max): ${maxseldepth > 0 ? maxseldepth : "❓"}\nNodes: ${nodeinfo}\nNodes Per Second: ${npsinfo}\nTime: ${timeinfo}`;
    } else if (text.includes("bestmove")) {
      let textparselist = text.split(" ");
      if (board.turn()) {
        bestpv = evaluationindex.indexOf(
          Math.max(...evaluationindex.slice(0, recordedmultipv)),
        );
      } else {
        bestpv = evaluationindex.indexOf(
          Math.min(...evaluationindex.slice(0, recordedmultipv)),
        );
      }
      if (bestpv < 0) {
        bestpv = 0;
      }
      bestmove = textparselist[1];
      if (textparselist[3] != undefined && textparselist[3] != "0000") {
        ponder = textparselist[3];
      }
      multipvrecord[bestpv][2] = bestmove;
      multipvrecord[bestpv][3] = ponder;
    } else if (text.includes("score mate 0")) {
      if (board.turn()) {
        evaluationBar.style.width = "0%";
        evalscore.innerText = "Checkmate";
      } else {
        evaluationBar.style.width = "100%";
        evalscore.innerText = "Checkmate";
      }
      return;
    } else {
      return;
    }
    if (board.turn()) {
      bestpv = evaluationindex.indexOf(
        Math.max(...evaluationindex.slice(0, recordedmultipv)),
      );
    } else {
      bestpv = evaluationindex.indexOf(
        Math.min(...evaluationindex.slice(0, recordedmultipv)),
      );
    }
    if (bestpv < 0) {
      bestpv = 0;
    }
    console.log("Best PV:", bestpv + 1);
    if (multipvrecord[bestpv][0]) {
      let matemoves = multipvrecord[bestpv][1];
      if (isNaN(matemoves) || matemoves == null) {
        evaluationBar.style.width = "50%";
        evalscore.innerText = "Mate in ❓";
      } else if (matemoves > 0) {
        evaluationBar.style.width = "100%";
        evalscore.innerText = "Mate in " + matemoves.toString();
      } else if (matemoves < 0) {
        evaluationBar.style.width = "0%";
        evalscore.innerText = "Mate in " + (-1 * matemoves).toString();
      } else {
        if (board.turn()) {
          evaluationBar.style.width = "0%";
          evalscore.innerText = "Checkmate";
        } else {
          evaluationBar.style.width = "100%";
          evalscore.innerText = "Checkmate";
        }
      }
    } else {
      evaluation = multipvrecord[bestpv][1];
      if (isNaN(evaluation) || evaluation == null) {
        evalscore.innerText = "❓";
        evaluationBar.style.width = "50%";
      } else {
        if (evaluation > 0) {
          evalscore.innerText = "+" + evaluation.toFixed(2).toString();
        } else {
          evalscore.innerText = evaluation.toFixed(2);
        }
        if (evaluation <= -9.8) {
          evaluationBar.style.width = "1%";
        } else if (evaluation >= 9.8) {
          evaluationBar.style.width = "99%";
        } else {
          evaluationBar.style.width =
            parseInt((evaluation * 100 + 1000) / 20).toString() + "%";
        }
      }
    }
    bestmove = multipvrecord[bestpv][2];
    ponder = multipvrecord[bestpv][3];
    if (bestmove) {
      if (ponder) {
        highlightMoveOnBoard(
          [board.turn(), !board.turn()],
          chessground,
          [bestmove, ponder],
          ["blue", "red"],
          ["TopRight", "TopLeft"],
        );
      } else {
        highlightMoveOnBoard(
          [board.turn()],
          chessground,
          [bestmove],
          ["blue"],
          ["TopRight"],
        );
      }
    }
  };

  isAnalysis.onchange = function () {
    recordedmultipv = 1;
    if (isAnalysis.checked) {
      //console.log("Observing.");
    } else {
      //console.log("Clear auto shapes.");
      chessground.setAutoShapes([]);
    }
    dropdownVisualEffect.dispatchEvent(new Event("change"));
  };

  dropdownBoardCoordinate.onchange = function () {
    let index = dropdownBoardCoordinate.selectedIndex;
    chessground.set({ notation: index });
    chessground_mini.set({ notation: index });
    let containerdiv = document.getElementById("chessground-container-div");
    if (index >= 1 && index <= 3) {
      containerdiv.classList.add("shogi");
      containerdiv.classList.remove("xiangqi");
    } else if (index == 5 || index == 6) {
      containerdiv.classList.add("xiangqi");
      containerdiv.classList.remove("shogi");
    } else {
      containerdiv.classList.remove("xiangqi");
      containerdiv.classList.remove("shogi");
    }
    redrawChessground();
  };

  buttonsearchmove.onclick = function () {
    const legalmovesstr = board.legalMoves();
    if (legalmovesstr == "") {
      window.alert("There is no legal move in this position.");
      return;
    }
    const legalmoves = legalmovesstr.trim().split(" ");
    const moves = filterMoves(
      legalmoves,
      movesearchfilter.value,
      issearchregexp.checked,
      origfilter.value,
      destfilter.value,
      isdrop.checked,
      haswallgating.checked,
      haspiecechange.checked,
    );
    console.log(moves);
    if (moves == null || moves == undefined) {
      return;
    }
    while (availablemovelist.length > 1) {
      availablemovelist.removeChild(availablemovelist[1]);
    }
    moves.forEach((val) => {
      let opt = document.createElement("option");
      opt.value = val;
      opt.text = `${val} (${board.sanMove(val)})`;
      availablemovelist.appendChild(opt);
    });
    if (moves.length < 1) {
      window.alert("No matches found with given search restriction.");
    }
    searchresultinfo.innerText = `Found ${moves.length} result(s).`;
  };

  buttonmakemove.onclick = function () {
    const move = availablemovelist[availablemovelist.selectedIndex].value;
    if (move == null || move == undefined || move == "") {
      window.alert(
        "Select a move in the drop down list first. If there are no moves listed, search for a move first. You can read the note to know how to make a search.",
      );
      return;
    }
    if (!board.push(move)) {
      window.alert("Cannot make the selected move as it's illegal.");
      return;
    }

    afterMove(move, isCapture(board, move));
  };

  buttonhighlightmove.onclick = function () {
    const move = availablemovelist[availablemovelist.selectedIndex].value;
    if (move == null || move == undefined || move == "") {
      window.alert(
        "Select a move in the drop down list first. If there are no moves listed, search for a move first. You can read the note to know how to make a search.",
      );
      return;
    }
    highlightMoveOnBoard(
      [board.turn()],
      chessground,
      [move],
      ["yellow"],
      ["TopRight"],
    );
  };

  dropdownNotationSystem.onchange = function () {
    updatePGNDivision();
  };

  pRandomMoverGo.onclick = function () {
    let movelist = textMoves.value.trim().split(/[ ]+/);
    let legalmoves = board.legalMoves().trim().split(/[ ]+/);
    movelist.push(legalmoves[Math.floor(Math.random() * legalmoves.length)]);
    textMoves.value = movelist.join(" ");
    pSetFen.click();
  };

  dropdownVisualEffect.onchange = dropdownVisualEffectPerspective.onchange =
    function () {
      updateChessground(false);
      setTimeout(() => {
        let elem = document.getElementById("gameresultcontainermini");
        while (elem) {
          chessgroundMiniBoardWrapper.removeChild(elem);
          elem = document.getElementById("gameresultcontainermini");
        }
      }, 20);
    };

  checkBoxInnerCoordinate.onchange = function () {
    updateInnerCoordinateColor(chessground);
  };

  buttonGenerateImage.onclick = function () {
    if (buttonGenerateImage.disabled) {
      return;
    }
    buttonGenerateImage.disabled = true;
    textImageGenerationProgress.textContent = "Busy.";
    let width = parseInt(inputImageWidth.value);
    let height = parseInt(inputImageHeight.value);
    let quality = parseFloat(inputImageQuality.value);
    let framedelay = parseInt(inputFrameDuration.value);
    let mode =
      dropdownGenerationMode[dropdownGenerationMode.selectedIndex].value;
    if (isNaN(width) || width <= 0) {
      width = 640;
    }
    if (isNaN(height) || height <= 0) {
      height = 640;
    }
    if (isNaN(quality) || quality < 0 || quality > 1) {
      quality = 1;
    }
    if (isNaN(framedelay) || framedelay <= 0) {
      framedelay = 1000;
    }
    GenerateBoardImage(
      mode,
      width,
      height,
      checkboxKeepAspectRatio.checked,
      (canvaslist) => {
        if (canvaslist instanceof Array) {
          let list = canvaslist.filter(
            (val) => val instanceof HTMLCanvasElement,
          );
          let i = 0;
          const filetype =
            dropdownImageFileType[dropdownImageFileType.selectedIndex].value;
          if (filetype == "JPEG" || filetype == "PNG") {
            const mimetype = filetype == "PNG" ? "image/png" : "image/jpeg";
            if (mode == "all") {
              let storedfilecount = 0;
              let totalfilecount = list.length;
              const zipfile = new ZIP();
              for (i = 0; i < list.length; i++) {
                (function (index) {
                  list[index].toBlob(
                    (blob) => {
                      blob.arrayBuffer().then((buf) => {
                        zipfile.file(
                          `board-frame-${index}.${filetype.toLowerCase()}`,
                          buf,
                          { binary: true, compression: "DEFLATE" },
                        );
                        storedfilecount++;
                        textImageGenerationProgress.textContent = `Generating images... (Progress: ${storedfilecount}/${totalfilecount})`;
                        if (storedfilecount >= totalfilecount) {
                          zipfile
                            .generateAsync({ type: "blob" })
                            .then((blob) => {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "board.zip";
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              buttonGenerateImage.disabled = false;
                              textImageGenerationProgress.textContent =
                                "Ready.";
                              setTimeout(() => {
                                URL.revokeObjectURL(url);
                              }, 100);
                            });
                        }
                      });
                    },
                    mimetype,
                    quality,
                  );
                })(i);
              }
            } else {
              list[0].toBlob(
                (blob) => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `board.${filetype.toLowerCase()}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  buttonGenerateImage.disabled = false;
                  textImageGenerationProgress.textContent = "Ready.";
                  setTimeout(() => {
                    URL.revokeObjectURL(url);
                  }, 100);
                },
                mimetype,
                quality,
              );
            }
          } else if (filetype == "GIF") {
            const gif = new GIF({
              workers: 2,
              quality: 101 - Math.round(quality * 100),
            });
            for (i = 0; i < list.length; i++) {
              gif.addFrame(list[i], { delay: framedelay });
            }
            gif.on("finished", function (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "board.gif";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              buttonGenerateImage.disabled = false;
              textImageGenerationProgress.textContent = "Ready.";
              setTimeout(() => {
                URL.revokeObjectURL(url);
              }, 100);
            });
            gif.on("progress", function (percentage) {
              textImageGenerationProgress.textContent = `Generating GIF... (Progress: ${(percentage * 100).toFixed(2)}%)`;
            });
            gif.render();
          }
        }
      },
    );
  };

  buttonExitImageGenerator.onclick = function () {
    imageGenerator.classList.add("hidden");
  };

  updateInnerCoordinateColor(chessground);

  updateChessground(true);
}); // Chessground helper functions

const onSelectPositionVariantsFile = async (e) => {
  const selected = e.currentTarget.files[0];
  if (selected) {
    const reader = new FileReader();
    reader.onload = function () {
      console.log(reader.result);
      if (LoadPositionVariant("client", reader.result)) {
        UpdateVariantsPositionTypeDropdown();
      }
    };
    reader.readAsText(selected);
  }
};

function getFEN(deleteinvalidpocket) {
  let FEN = chessground.getFen();
  let width = chessground.state.dimensions.width;
  let height = chessground.state.dimensions.height;
  if (
    deleteinvalidpocket &&
    !ffish.capturesToHand(dropdownVariant.value) &&
    !ffish.startingFen(dropdownVariant.value).includes("[")
  ) {
    FEN = FEN.replace(/\[[A-Za-z]*\]/, "");
  }
  if (dropdownSideToMove.value == "First Mover") {
    FEN += " w";
  } else if (dropdownSideToMove.value == "Second Mover") {
    FEN += " b";
  }
  let castling = " ";
  if (whiteOO.checked) {
    castling += "K";
  }
  if (whiteOOO.checked) {
    castling += "Q";
  }
  if (blackOO.checked) {
    castling += "k";
  }
  if (blackOOO.checked) {
    castling += "q";
  }
  if (seirawanGatingFiles.value.length > 0) {
    if (/^[A-Za-z]*$/.test(seirawanGatingFiles.value)) {
      let matcher = new RegExp(
        "[^A-" +
          files[width - 1].toUpperCase() +
          "a-" +
          files[width - 1].toLowerCase() +
          "]",
      );
      if (!matcher.test(seirawanGatingFiles.value)) {
        castling += seirawanGatingFiles.value;
      } else {
        window.alert(
          `Bad Seirawan gating files: File out of range. File range is A-${files[
            width - 1
          ].toUpperCase()}`,
        );
        return null;
      }
    } else {
      window.alert(
        "Bad Seirawan gating files: All files should be given in letters. (e.g. ABCDabcd)",
      );
      return null;
    }
  }
  if (castling == " ") {
    castling = " -";
  }
  FEN += castling;
  if (enPassantFile.value.length < 1 || enPassantRank.value.length < 1) {
    FEN += " -";
  } else if (
    enPassantFile.value > 0 &&
    enPassantFile.value <= width &&
    enPassantRank.value > 0 &&
    enPassantRank.value <= height
  ) {
    FEN += " " + files[enPassantFile.value - 1] + enPassantRank.value;
  } else {
    window.alert("Bad en passant file or rank number.");
    return null;
  }
  if (
    whiteRemainingChecks.value.length > 0 &&
    blackRemainingChecks.value.length > 0
  ) {
    if (ffish.startingFen(dropdownVariant.value).split(" ").length != 7) {
      window.alert("This variant does not have check number limits.");
      return null;
    }
    if (whiteRemainingChecks.value > 0 && blackRemainingChecks.value > 0) {
      FEN += ` ${whiteRemainingChecks.value}+${blackRemainingChecks.value}`;
    } else {
      window.alert(
        "Bad remaining checks. Remaining checks should be larger than 0.",
      );
      return null;
    }
  }
  if (halfMoveClock.value.length > 0) {
    if (halfMoveClock.value >= 0) {
      FEN += ` ${halfMoveClock.value}`;
    } else {
      window.alert(
        "Bad half move clock. Half move clock should be larger than or equal to 0.",
      );
      return null;
    }
  } else {
    FEN += " 0";
  }
  if (currentMoveNumber.value.length > 0) {
    if (currentMoveNumber.value > 0) {
      FEN += ` ${currentMoveNumber.value}`;
    } else {
      window.alert(
        "Bad current move number. Current move number should be larger than 0.",
      );
      return null;
    }
  } else {
    FEN += " 1";
  }
  console.log(FEN);
  return FEN;
}

function validateFEN(FEN, showNoErrorMessage) {
  if (FEN == null) {
    return false;
  }
  let result = ffish.validateFen(FEN, board.variant(), board.is960());
  if (result >= 0) {
    if (showNoErrorMessage) {
      window.alert("No errors found.");
    }
    return true;
  }
  if (result == -14) {
    window.alert("Error: Invalid counting rule specification.");
    return false;
  }
  if (result == -13) {
    window.alert("Error: Invalid check count specification.");
    return false;
  }
  if (result == -12) {
    window.alert("Error: Pieces without promoted type are in promoted form.");
    return false;
  }
  if (result == -11) {
    window.alert("Error: Syntax error in FEN string.");
    return false;
  }
  if (result == -10) {
    window.alert("Error: Contains invalid piece characters or syntax error.");
    return false;
  }
  if (result == -9) {
    window.alert("Error: King pieces are next to each other.");
    return false;
  }
  if (result == -8) {
    window.alert("Error: Invalid row or column count.");
    return false;
  }
  if (result == -7) {
    window.alert("Error: Invalid piece character in pocket.");
    return false;
  }
  if (result == -6) {
    window.alert("Error: Invalid side to move specification.");
    return false;
  }
  if (result == -5) {
    window.alert("Error: Invalid castling specification.");
    return false;
  }
  if (result == -4) {
    window.alert("Error: Invalid en passant square.");
    return false;
  }
  if (result == -3) {
    window.alert("Error: Inavlid king piece count.");
    return false;
  }
  if (result == -2) {
    window.alert("Error: Invalid half move clock.");
    return false;
  }
  if (result == -1) {
    window.alert("Error: Invalid move counter.");
    return false;
  }
}

function LoadPositionVariant(side, file) {
  function StartLoad(data, dispatchevent) {
    let VariantTypeDirectory = new Map();
    let VariantNameDirectory = new Map();
    //This creates a tree structure to store position variants
    //it looks like this:
    //<Root dir: PositionVariantsDirectory>  //Items are classified by chess variant names
    //    <Sub dir1: VariantTypeDirectory>  //Items are classified by position variant types, e.g. Mate in X, Handicaps, etc.
    //        <Sub Sub dir1: VariantNameDirectory>  //Items are classified by the position variant name provided in the file.
    //            <File: VariantPositionItem>  //This contains the FEN and the description
    //        <Sub Sub dir2: VariantNameDirectory>
    //            <File: VariantPositionItem>
    //            ...
    //    <Sub dir2: VariantTypeDirectory>
    //        <Sub Sub dir: VariantNameDirectory>
    //            ...
    //Syntax for each line: <chess variant name>|<position variant type>|<position variant name>|<FEN>|<description>
    data = data.replace(/\r\n/g, "\n");
    data = data.replace(/\r/g, "\n");
    let rawText = data.split("\n");
    let variantsettings = "";
    let i = 0;
    for (i = 0; i < rawText.length; i++) {
      if (rawText[i].length < 1 || rawText[i].charAt(0) == "#") {
        continue;
      }
      variantsettings = rawText[i].trim().split("||");
      if (variantsettings.length != 5 && variantsettings.length != 6) {
        console.warn(
          `At line ${i} in paragraph of <position variant file>: Bad syntax\n`,
        );
        continue;
      }
      if (PositionVariantsDirectory.has(variantsettings[0])) {
        VariantTypeDirectory = PositionVariantsDirectory.get(
          variantsettings[0],
        );
      } else {
        VariantTypeDirectory = new Map();
      }
      if (VariantTypeDirectory.has(variantsettings[1])) {
        VariantNameDirectory = VariantTypeDirectory.get(variantsettings[1]);
      } else {
        VariantNameDirectory = new Map();
      }
      if (VariantNameDirectory.has(variantsettings[2])) {
        console.warn(
          `Variant "<ROOT>\\${variantsettings[0]}\\${variantsettings[1]}\\${variantsettings[2]}" already exists. This position variant will not get loaded.\n`,
        );
        continue;
      }
      if (variantsettings.length == 5) {
        VariantNameDirectory.set(variantsettings[2], {
          FEN: variantsettings[3],
          Moves: "",
          Description: variantsettings[4].replace("\\n", "\n"),
        });
      } else if (variantsettings.length == 6) {
        VariantNameDirectory.set(variantsettings[2], {
          FEN: variantsettings[3],
          Moves: variantsettings[4],
          Description: variantsettings[5].replace("\\n", "\n"),
        });
      }

      VariantTypeDirectory.set(variantsettings[1], VariantNameDirectory);
      PositionVariantsDirectory.set(variantsettings[0], VariantTypeDirectory);
    }
    console.log("PositionVariants:", PositionVariantsDirectory);
    if (dispatchevent) {
      document.dispatchEvent(new Event("positionvariantsloaded"));
    }
    return true;
  }
  if (side == "server") {
    return window.getFileFromServer("./positionvariants.txt", (res) => {
      console.log("res:", res);
      StartLoad(res, true);
    });
  } else if (side == "client") {
    if (file == null || file == undefined) {
      console.warn("Empty files provided.");
      return false;
    }
    StartLoad(file, false);
    return true;
  }
  return false;
}

function UpdateVariantsPositionTypeDropdown() {
  while (dropdownPositionVariantType.length > 1) {
    dropdownPositionVariantType.remove(1);
  }
  let VariantTypeDirectory = null;
  let VariantTypeList = [];
  let i = 0;
  let option = null;
  let VariantName = checkboxFischerRandom.checked
    ? dropdownVariant.value + "960"
    : dropdownVariant.value;
  if (PositionVariantsDirectory.has(VariantName)) {
    VariantTypeDirectory = PositionVariantsDirectory.get(VariantName);
    VariantTypeList = [...VariantTypeDirectory];
    for (i = 0; i < VariantTypeList.length; i++) {
      option = document.createElement("option");
      option.text = VariantTypeList[i][0];
      option.value = VariantTypeList[i][0];
      dropdownPositionVariantType.add(option);
    }
  }
  dropdownPositionVariantType.selectedIndex = 0;
}

function UpdateVariantsPositionNameDropdown() {
  while (dropdownPositionVariantName.length > 0) {
    dropdownPositionVariantName.remove(0);
  }
  let VariantTypeDirectory = null;
  let VariantNameDirectory = null;
  let i = 0;
  let option = null;
  let VariantName = checkboxFischerRandom.checked
    ? dropdownVariant.value + "960"
    : dropdownVariant.value;
  let VariantNameList = [];
  if (PositionVariantsDirectory.has(VariantName)) {
    VariantTypeDirectory = PositionVariantsDirectory.get(VariantName);
    if (VariantTypeDirectory.has(dropdownPositionVariantType.value)) {
      VariantNameDirectory = VariantTypeDirectory.get(
        dropdownPositionVariantType.value,
      );
      VariantNameList = [...VariantNameDirectory];
      for (i = 0; i < VariantNameList.length; i++) {
        option = document.createElement("option");
        option.text = VariantNameList[i][0];
        option.value = VariantNameList[i][0];
        dropdownPositionVariantName.add(option);
      }
    }
  }
  dropdownPositionVariantName.selectedIndex = -1;
}

function getGameStatus(showresult) {
  let result = "null";
  if (board.isGameOver() || board.isGameOver(true) || board.isGameOver(false)) {
    if (board.result() != "*") {
      gameResult.value = board.result();
      result = "END";
    } else if (board.result(true) != "*") {
      gameResult.value = board.result(true);
      result = "END";
    } else if (board.result(false) != "*") {
      gameResult.value = board.result(false);
      result = "END";
    } else {
      gameResult.value = "Unterminated";
      result = "UNFINISHED";
    }
    if (showresult) {
      gameResult.click();
    }
  } else if (timeOutSide.value == 1) {
    //console.log("White time out");
    gameResult.value = "0-1";
    result = "END";
    if (showresult) {
      gameResult.click();
    }
  } else if (timeOutSide.value == 2) {
    //console.log("Black time out");
    gameResult.value = "1-0";
    result = "END";
    if (showresult) {
      gameResult.click();
    }
  } else {
    //console.log("continue");
    if (board.turn() == WHITE) {
      result = "PLAYING_WHITE";
    } else if (board.turn() == BLACK) {
      result = "PLAYING_BLACK";
    }
  }
  return result;
}

function resetTimer() {
  console.log("Timer reset!");
  whiteTime.innerHTML = "--";
  blackTime.innerHTML = "--";
  timeOutSide.value = 0;
}

function getDests(board) {
  const dests = new Map();
  const moves = board
    .legalMoves()
    .split(" ")
    .filter((m) => m !== "");

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const match = move.match(/(\D\d+)(\D\d+)/);
    if (match) {
      const from = convertSquareToChessgroundXKey(match[1]);
      const to = convertSquareToChessgroundXKey(match[2]);
      if (dests.get(from) === undefined) dests.set(from, []);
      dests.get(from).push(to);
    }

    const dropmatch = move.match(/([A-Z]+@)([a-z]+[0-9]+)/);
    if (dropmatch) {
      const dropfrom = dropmatch[1];
      const dropto = convertSquareToChessgroundXKey(dropmatch[2]);
      if (dests.get(dropfrom) === undefined) dests.set(dropfrom, []);
      dests.get(dropfrom).push(dropto);
    }
  }

  return dests;
}

function getColorOrUndefined(board) {
  if (getGameStatus(false) == "END") return undefined;
  return getColor(board);
}

function getColor(board) {
  return board.turn() ? "white" : "black";
}

function getPiecesAsArray(board) {
  // Is board.toString really the best way to get the pieces?
  const pieces = [];
  const piecesLines = board.toString().split(/\r?\n/);

  for (let i = 0; i < piecesLines.length; i++) {
    pieces[piecesLines.length - i - 1] = piecesLines[i].split(" ");
  }

  return pieces;
}

function squareGetCoords(square) {
  if (square.length < 2) return [-1, -1];
  const coords = [-1, -1];
  coords[0] = parseInt(square.substring(1)) - 1;
  if (coords[0] === NaN || coords[0] < 0 || coords[0] >= 1000) return [-1, -1];
  coords[1] = square.charCodeAt(0) - "a".charCodeAt(0);
  if (coords[1] === NaN || coords[1] < 0 || coords[1] >= 26) return [-1, -1];
  return coords;
}

function isCapture(board, move) {
  if (move.includes("@")) {
    return false;
  }
  const pieces = getPiecesAsArray(board);
  const moveFromStr = move.charAt(0) + parseInt(move.substring(1));
  const moveToStr =
    move.charAt(moveFromStr.length) +
    parseInt(move.substring(moveFromStr.length + 1));
  const moveFrom = squareGetCoords(moveFromStr);
  const moveTo = squareGetCoords(moveToStr);
  if (pieces[moveTo[0]][moveTo[1]] !== ".") return true; // En passant

  if (pieces[moveFrom[0]][moveFrom[1]].toLowerCase() === "p")
    return moveFrom[1] !== moveTo[1];
  return false;
}

function afterChessgroundMove(orig, dest, metadata) {
  // Auto promote to queen for now
  let promotion = quickPromotionPiece.value;
  let gating = "";
  let i = 0;

  if (isBoardSetup.checked) {
    chessground.set({
      movable: {
        color: "both",
        dests: EmptyMap,
      },
    });
    return;
  }

  //console.log("move:", orig, dest, metadata);

  const move =
    convertChessgroundXKeyToSquare(orig) + convertChessgroundXKeyToSquare(dest);
  console.log(`${move}`);
  const capture = isCapture(board, move);

  //UCI notation syntax (piece move): <begin_file><begin_rank><end_file><end_rank>[[+ | -] | piece_id ][,<gating_move>]
  //"[+ | -]" is the promotion/demotion mark for this move. If missing, it means that the piece keeps its current status. This type is used for piece advance (shogi type promotion, can be demoted)
  //"[piece_id]" is the character to refer to the piece type, e.g. q=queen, r=rook. This type is used for pawn promotion (chess type promotion, cannot be demoted)
  //[,<gating_move>] is used in games which have arrowGating = true, duckGating = true, staticGating = true or pastGating = true. They all require pieceDrop = false

  const legalmoves = board.legalMoves().trim().split(" "); //This will set all possible moves (with promotion marks and gating moves) at current in uci format into array

  let possiblepromotions = [];
  let possiblegatings = [];
  let legalmove = "";
  let legalgate = "";
  console.log(`${legalmoves}`);
  for (i = 0; i < legalmoves.length; i++) {
    //Now look at each possible moves
    if (legalmoves[i].trim().length == 0) {
      continue;
    }
    legalmove = legalmoves[i].trim().split(",")[0];
    legalgate = legalmoves[i].trim().split(",")[1]; //this can be undefined
    //if it is a legal promotion/demotion move that matches the move player has made (see the syntax of uci notation, which is given above)
    if (
      move.trim() == legalmove.substring(0, move.trim().length) &&
      legalmove.length == move.trim().length + 1
    ) {
      if (/^[a-z+-]+$/.test(legalmove.charAt(move.trim().length))) {
        if (
          !possiblepromotions.includes(legalmove.charAt(move.trim().length))
        ) {
          possiblepromotions.push(legalmove.charAt(move.trim().length));
        }
      }
      if (legalgate == undefined) {
        //now check the gating move
        if (!possiblegatings.includes("=")) {
          possiblegatings.push("="); //we use = to represent that not gating is legal
        }
      } else {
        if (!possiblegatings.includes(legalgate)) {
          possiblegatings.push(legalgate);
        }
      }
      //if it is legal to not promote/demote
    } else if (move.trim() == legalmove) {
      if (!possiblepromotions.includes("=")) {
        possiblepromotions.push("="); //we use = to represent that not promoting/demoting is legal
      }
      if (legalgate == undefined) {
        //now check the gating move
        if (!possiblegatings.includes("=")) {
          possiblegatings.push("="); //we use = to represent that not gating is legal
        }
      } else {
        if (!possiblegatings.includes(legalgate)) {
          possiblegatings.push(legalgate);
        }
      }
    }
  }
  console.log(`possible promotion choices: ${possiblepromotions}`);
  console.log(`possible gating choices: ${possiblegatings}`);
  let choice = null;
  if (
    quickPromotionPiece.value != "" &&
    !metadata.ctrlKey &&
    possiblepromotions.includes(promotion)
  ) {
    choice = promotion;
    console.log(`Using quick promotion: ${promotion}`);
  } else if (possiblepromotions.length > 1) {
    //if there are more than one option
    while (true) {
      choice = prompt(
        `There are multiple chioces that you can keep/promote/demote your moved piece. They are\n${possiblepromotions}\n, where + means promote, - means demote, = means keep, letters mean target pawn promotion piece (e.g. q means pawn can promote to q piece which means queen in most times). Now please enter your choice: `,
        "",
      );
      if (choice == null) {
        afterMove(null, false);
        return;
      }
      if (choice.length == 0 || choice.length > 1) {
        alert(
          `Bad input: ${choice} . You should enter exactly one character among ${possiblepromotions}.`,
        );
        continue;
      }
      if (possiblepromotions.includes(choice)) {
        break;
      } else {
        alert(
          `Bad input: ${choice} . You should enter exactly one character among ${possiblepromotions}.`,
        );
        continue;
      }
    }
  } else if (possiblepromotions.length == 1) {
    //if there is only one option
    choice = possiblepromotions[0];
  } else {
    console.log("Did you make an illegal move? Why is there no legal action?");
  }
  console.log(`final move choice: ${choice}`);

  if (choice == null || choice == undefined) {
    promotion = "";
  } else if (choice == "=") {
    promotion = "";
  } else {
    promotion = choice;
  }

  choice = null;

  if (possiblegatings.length > 1) {
    //if there are more than one option
    let i = 0;
    let gatesquares = [];
    for (i = 0; i < possiblegatings.length; i++) {
      gatesquares.push(possiblegatings[i].match(/[a-z]+[0-9]+/g)[1]);
    }
    while (true) {
      choice = prompt(
        `There are multiple chioces that you can gate a wall square. They are\n${gatesquares}\n, where = means do not gate, letters with numbers mean destination square (e.g. e5 means you gate a wall square to e5). Now please enter your choice: `,
        "",
      );
      if (choice == null) {
        afterMove(null, false);
        return;
      }
      if (gatesquares.includes(choice)) {
        break;
      } else {
        alert(
          `Bad input: ${choice} . You should enter one option among ${gatesquares}.`,
        );
        continue;
      }
    }
    choice = possiblegatings[gatesquares.indexOf(choice)];
  } else if (possiblegatings.length == 1) {
    //if there is only one option
    choice = possiblegatings[0];
  } else {
    console.log("Did you make an illegal move? Why is there no legal action?");
  }
  console.log(`final gating choice: ${choice}`);

  if (choice == null || choice == undefined) {
    gating = "";
  } else if (choice == "=") {
    gating = "";
  } else {
    gating = "," + choice;
  }

  let finalmove = move + promotion + gating;

  if (!board.push(finalmove)) {
    const foundmove = board.legalMoves().match(new RegExp(`${move}[^ ]+`));
    if (foundmove) {
      finalmove = foundmove[0];
    } else {
      finalmove = null;
    }
  }

  afterMove(finalmove, capture);
}

function afterChessgroundDrop(piece, dest, metadata) {
  let promotion = quickPromotionPiece.value;
  let i = 0;

  if (isBoardSetup.checked) {
    chessground.set({
      movable: {
        color: "both",
        dests: EmptyMap,
      },
    });
    return;
  }

  //When dropPromoted = true in variant.ini, FairyStockfish allows an unpromoted piece to be dropped in promoted form (not compulsory)
  //Therefore, you need to consider about adding drop promoted piece function support.

  //Moreover, if capturesToHand = true && dropLoop = true && pieceDemotion = true, then promoted piece will become advanced, not promoted form*.
  //Lets give an example, suppose a rook can be promoted to chancellor (RN), when promoted it will be +R, which can be demoted.
  //However, once captured, the opponent will get a true chancellor(C) piece, not the promoted rook(+R). The new piece(C) cannot be demoted.
  //So, dropping piece does not have demotion features. pieceDemotion option does not affect drop promotion function.
  //Pawns cannot be dropped in promoted status which they get it by reaching the promotion zone

  //Piece drop notation are the same for uci and san. They are all [+]<piece id>@<file><rank>, e.g. Q@d2, +R@c4
  //This means that the format is different from moving, as the promotion mark is at the beginning. Just making some small changes will solve this.
  //The program logic is the same as moving.

  const role = piece.role;
  const move = util.dropOrigOf(role) + convertChessgroundXKeyToSquare(dest);
  console.log(`${move}`);

  const legalmoves = board.legalMoves().trim().split(" ");
  let possiblepromotions = [];
  console.log(`${legalmoves}`);
  for (i = 0; i < legalmoves.length; i++) {
    if (legalmoves[i].trim().length == 0) {
      continue;
    }
    //if it is a legal promotion drop that matches the drop player has made
    if (
      move.trim() ==
        legalmoves[i].trim().substring(1, move.trim().length + 1) &&
      legalmoves[i].trim().length == move.trim().length + 1
    ) {
      if (/^[+-]+$/.test(legalmoves[i].trim().charAt(0))) {
        possiblepromotions.push(legalmoves[i].trim().charAt(0));
      }
      //if it is legal to not promote/demote
    } else if (move.trim() == legalmoves[i].trim()) {
      possiblepromotions.push("="); //we use = to represent that not promoting is legal
    }
  }
  console.log(`possible choice: ${possiblepromotions}`);
  let choice = null;
  if (
    quickPromotionPiece.value != "" &&
    !metadata.ctrlKey &&
    possiblepromotions.includes(promotion)
  ) {
    choice = promotion;
    console.log(`Using quick promotion: ${promotion}`);
  } else if (possiblepromotions.length > 1) {
    //if there are more than one option
    while (true) {
      choice = prompt(
        `There are multiple chioces that you can keep/promote your dropped piece. They are\n${possiblepromotions}\n, where + means promote, = means keep. Now please enter your choice: `,
        "",
      );
      if (choice == null) {
        afterMove(null, false);
        return;
      }
      if (choice.length == 0 || choice.length > 1) {
        alert(
          `Bad input: ${choice} . You should enter exactly one character among ${possiblepromotions}.`,
        );
        continue;
      }
      if (possiblepromotions.includes(choice)) {
        break;
      } else {
        alert(
          `Bad input: ${choice} . You should enter exactly one character among ${possiblepromotions}.`,
        );
        continue;
      }
    }
  } else if (possiblepromotions.length == 1) {
    //if there is only one option
    choice = possiblepromotions[0];
  } else {
    console.log("Did you make an illegal drop? Why is there no legal action?");
  }
  console.log(`final choice: ${choice}`);

  if (choice == null) {
    promotion = "";
  } else if (choice == "=") {
    promotion = "";
  } else {
    promotion = choice;
  }

  board.push(promotion + move);
  afterMove(promotion + move, false);
}

function afterMove(move, capture) {
  if (move) {
    textMoves.value = (textMoves.value + " " + move).trim();
  }

  pSetFen.click();

  if (move) {
    if (capture) {
      soundCapture.currentTime = 0.0;
      soundCapture.play();
    } else {
      soundMove.currentTime = 0.0;
      soundMove.play();
    }
  }

  if (getGameStatus(false) == "END") {
    soundTerminal.currentTime = 0.0;
    soundTerminal.play();
  } else if (board.isCheck()) {
    soundCheck.currentTime = 0.0;
    soundCheck.play();
  }
  recordedmultipv = 1;
}

function getPgn(board) {
  if (
    dropdownNotationSystem[dropdownNotationSystem.selectedIndex].value == ""
  ) {
    /*let pgn = "";
    const reversedMoves = [];
    let moveStack = board.moveStack();

    while (moveStack.length > 0) {
      // TODO: improve this :/
      reversedMoves.push(moveStack.split(" ").pop());
      board.pop();
      moveStack = board.moveStack();
    }

    if (!board.turn() && reversedMoves.length > 0) {
      pgn += board.fullmoveNumber() + "... ";
    }

    while (reversedMoves.length > 0) {
      const move = reversedMoves.pop();

      if (board.turn()) {
        pgn += board.fullmoveNumber() + ". ";
      }

      pgn += board.sanMove(move) + " ";
      board.push(move);
    }

    const result = board.result(checkboxAdjudicate.checked);
    if (result !== "*") pgn += result;
    return pgn.trim();*/
    return "Please select a notation system in the dropdown...";
  } else {
    return getNotation(
      dropdownNotationSystem[dropdownNotationSystem.selectedIndex].value,
      board.variant(),
      textFen.value == "" ? ffish.startingFen(board.variant()) : textFen.value,
      board.is960(),
      textMoves.value,
      true,
    );
  }
}

function getPgnDiv(board) {
  let notationindex = simplenotations.indexOf(
    dropdownNotationSystem[dropdownNotationSystem.selectedIndex].value,
  );
  if (notationindex < 0) {
    let note = document.createElement("div");
    note.innerText = getPgn(board);
    buttonMoveTreeUndo.disabled =
      buttonMoveTreeRedo.disabled =
      buttonMoveTreeHideShow.disabled =
      buttonMoveTreeRemoveVariations.disabled =
      buttonMoveTreeSymbol.disabled =
      buttonMoveTreeTextAfter.disabled =
      buttonMoveTreeTextBefore.disabled =
      buttonMoveTreeCrop.disabled =
      buttonMoveTreeHideShow.disabled =
      buttonMoveTreeSetToMainBranch.disabled =
      buttonMoveTreeSetAsMainLine.disabled =
      buttonMoveTreeUncomment.disabled =
      buttonMoveTreeCut.disabled =
      buttonMoveTreeCutBranch.disabled =
      buttonMoveTreeCropBranch.disabled =
      buttonMoveTreeClear.disabled =
        true;
    return note;
  } else {
    // let result = parseUCIMovesToPreviewElements(
    //   board.variant(),
    //   textFen.value == "" ? ffish.startingFen(board.variant()) : textFen.value,
    //   board.is960(),
    //   textMoves.value,
    //   "pgndiv",
    //   ffishnotationobjects[notationindex],
    // );
    let result = gametree.ToPGNDiv(ffishnotationobjects[notationindex]);
    buttonMoveTreeUndo.disabled = gametree.CurrentHistory <= 0;
    buttonMoveTreeRedo.disabled =
      gametree.CurrentHistory >= gametree.HistoryStack.length - 1;
    buttonMoveTreeHideShow.disabled =
      buttonMoveTreeSymbol.disabled =
      buttonMoveTreeTextAfter.disabled =
      buttonMoveTreeTextBefore.disabled =
      buttonMoveTreeCrop.disabled =
      buttonMoveTreeHideShow.disabled =
      buttonMoveTreeSetAsMainLine.disabled =
      buttonMoveTreeUncomment.disabled =
      buttonMoveTreeCut.disabled =
      buttonMoveTreeCutBranch.disabled =
      buttonMoveTreeCropBranch.disabled =
        gametree.CurrentMove == gametree.MoveTree.RootNode;
    buttonMoveTreeSetToMainBranch.disabled =
      gametree.CurrentMove == gametree.MoveTree.RootNode ||
      gametree.CurrentMove.RelativePositionInParentNode == 0;
    buttonMoveTreeRemoveVariations.disabled =
      gametree.CurrentMove.NextNodes.length <= 1;
    buttonMoveTreeClear.disabled = false;
    return result;
  }
}

function disableBoardMove() {
  chessground.set({
    movable: {
      color: undefined,
    },
    draggable: {
      deleteOnDropOff: false,
    },
  });
}

function enableBoardMove() {
  chessground.set({
    movable: {
      color: getColorOrUndefined(board),
      dests: getDests(board),
    },
    draggable: {
      deleteOnDropOff: isBoardSetup.checked,
    },
  });
}

function getCurrentBoardSize() {
  let boardsize = [];
  let i = 0;
  const ClassList = document.getElementById(
    "chessground-container-div",
  ).classList;
  const matcherobj = new RegExp("board[0-9]+x[0-9]+");
  for (i = 0; i < ClassList.length; i++) {
    if (matcherobj.test(ClassList[i])) {
      boardsize = ClassList[i].replace("board", "").split("x"); //[width, height]
      break;
    }
  }
  return { width: parseInt(boardsize[0]), height: parseInt(boardsize[1]) };
}

function getKnownAndUnknownSquares(board) {
  let moves = board.legalMoves().split(" ");
  let unknownsquares = new Set();
  let knownsquares = new Set();
  let i = 0;
  let j = 0;
  let boardsize = getCurrentBoardSize();
  let square = "";
  let parseresult = [];
  let orig = "";
  let dest = "";
  for (i = 0; i < moves.length; i++) {
    parseresult = moveutil.ParseUCIMove(moves[i]);
    orig = parseresult[0];
    dest = parseresult[1];
    if (!orig.includes("@")) {
      knownsquares.add(orig);
    }
    knownsquares.add(dest);
  }
  for (i = 0; i < boardsize.width; i++) {
    for (j = 0; j < boardsize.height; j++) {
      square = `${files[i]}${j + 1}`;
      if (!knownsquares.has(square)) {
        unknownsquares.add(square);
      }
    }
  }
  return { KnownSquares: knownsquares, UnknownSquares: unknownsquares };
}

function getHiddenDroppablePiece(board) {
  let legalmoves = board.legalMoves();
  if (legalmoves == "") {
    return "";
  }
  let originalfen = board.fen();
  let moves = legalmoves.split(" ");
  let i = 0;
  let movepart = [];
  let hiddenpieces = [];
  for (i = 0; i < moves.length; i++) {
    if (moves[i] == "") {
      continue;
    }
    movepart = moveutil.ParseUCIMove(moves[i]);
    if (movepart[0].endsWith("@")) {
      if (movepart[0].charAt(0) == "+") {
        let pieceid = board.turn()
          ? movepart[0].charAt(1)
          : movepart[0].charAt(1).toLowerCase();
        if (!pieceDisplayedInPocketOfFEN(originalfen, pieceid)) {
          if (hiddenpieces.indexOf(pieceid) < 0) {
            hiddenpieces.push(pieceid);
          }
        }
      } else {
        let pieceid = board.turn()
          ? movepart[0].charAt(0)
          : movepart[0].charAt(0).toLowerCase();
        if (!pieceDisplayedInPocketOfFEN(originalfen, pieceid)) {
          if (hiddenpieces.indexOf(pieceid) < 0) {
            hiddenpieces.push(pieceid);
          }
        }
      }
    }
  }
  return hiddenpieces.join("");
}

function displayHiddenDroppablePiece(board) {
  let legalmoves = board.legalMoves();
  if (legalmoves == "") {
    return;
  }
  let originalfen = board.fen();
  let moves = legalmoves.split(" ");
  let i = 0;
  let movepart = [];
  let hiddenpieces = [];
  let whitehiddenpieces = "";
  let blackhiddenpieces = "";
  for (i = 0; i < moves.length; i++) {
    if (moves[i] == "") {
      continue;
    }
    movepart = moveutil.ParseUCIMove(moves[i]);
    if (movepart[0].endsWith("@")) {
      if (movepart[0].charAt(0) == "+") {
        let pieceid = board.turn()
          ? movepart[0].charAt(1)
          : movepart[0].charAt(1).toLowerCase();
        if (!pieceDisplayedInPocketOfFEN(originalfen, pieceid)) {
          if (board.turn()) {
            whitehiddenpieces += pieceid;
          } else {
            blackhiddenpieces += pieceid;
          }
          if (hiddenpieces.indexOf(pieceid) < 0) {
            hiddenpieces.push(pieceid);
          }
        }
      } else {
        let pieceid = board.turn()
          ? movepart[0].charAt(0)
          : movepart[0].charAt(0).toLowerCase();
        if (!pieceDisplayedInPocketOfFEN(originalfen, pieceid)) {
          if (board.turn()) {
            whitehiddenpieces += pieceid;
          } else {
            blackhiddenpieces += pieceid;
          }
          if (hiddenpieces.indexOf(pieceid) < 0) {
            hiddenpieces.push(pieceid);
          }
        }
      }
    }
  }
  if (hiddenpieces.length) {
    if (chessground.state.pocketRoles == undefined) {
      chessground.state.pocketRoles = { white: [], black: [] };
    }
    let whitehiddenpieceroles = getPieceRoles(whitehiddenpieces);
    let blackhiddenpieceroles = getPieceRoles(blackhiddenpieces);
    if (chessground.state.boardState.pockets == undefined) {
      chessground.state.boardState.pockets = {
        white: new Map(),
        black: new Map(),
      };
    }
    for (i = 0; i < whitehiddenpieceroles.length; i++) {
      if (
        chessground.state.pocketRoles.white.indexOf(whitehiddenpieceroles[i]) <
        0
      ) {
        chessground.state.pocketRoles.white.push(whitehiddenpieceroles[i]);
      }
      chessground.state.boardState.pockets.white.set(
        whitehiddenpieceroles[i],
        1,
      );
    }
    for (i = 0; i < blackhiddenpieceroles.length; i++) {
      if (
        chessground.state.pocketRoles.black.indexOf(blackhiddenpieceroles[i]) <
        0
      ) {
        chessground.state.pocketRoles.black.push(blackhiddenpieceroles[i]);
      }
      chessground.state.boardState.pockets.black.set(
        blackhiddenpieceroles[i],
        1,
      );
    }
    let fen = board.fen();
    if (fen.includes("[")) {
      let endoffenpocket = fen.indexOf("]");
      fen =
        fen.substring(0, endoffenpocket) +
        hiddenpieces.join("") +
        fen.substring(endoffenpocket);
    } else {
      let fenlist = fen.split(" ");
      fenlist[0] += `[${hiddenpieces.join("")}]`;
      fen = fenlist.join(" ");
    }
    chessgroundContainerEl.classList.add("pockets");
    console.log("Hidden pieces:", hiddenpieces);
    console.log("Fake FEN:", fen);
    rerenderChessgroundPockets(fen);
    pocketTopEl.classList.add("has-hidden-pocket-piece");
    pocketBottomEl.classList.add("has-hidden-pocket-piece");
  } else {
    pocketTopEl.classList.remove("has-hidden-pocket-piece");
    pocketBottomEl.classList.remove("has-hidden-pocket-piece");
  }
}

function pieceDisplayedInPocketOfFEN(fen, pieceid) {
  if (fen.includes("[")) {
    let pieces = fen.substring(fen.indexOf("[") + 1, fen.indexOf("]"));
    return pieces.includes(pieceid);
  } else {
    return false;
  }
}

function getCheckSquares(board) {
  let checks = board.checkedPieces();
  if (checks == "") {
    return [];
  }
  let checklist = checks.split(" ");
  let i = 0;
  for (i = 0; i < checklist.length; i++) {
    checklist[i] = convertSquareToChessgroundXKey(checklist[i]);
  }
  return checklist;
}

function ApplyVisualEffectToBoard(effect, perspective, chessground, board) {
  if (effect == "fogofwar") {
    if (perspective == "white") {
      if (board.turn()) {
        const fogofwarsquarevisibility = getKnownAndUnknownSquares(board);
        const unknownsquares = Array.from(
          fogofwarsquarevisibility.UnknownSquares,
        );
        let i = 0;
        let val1;
        for (i = 0; i < unknownsquares.length; i++) {
          val1 = convertSquareToChessgroundXKey(unknownsquares[i]);
          if (chessground.state.boardState.pieces.has(val1)) {
            let piece = chessground.state.boardState.pieces.get(val1);
            if (piece.role == "_-piece" || piece.color == "white") {
              continue;
            }
            piece.role = "unknown";
          } else {
            chessground.state.boardState.pieces.set(val1, {
              color: "black",
              role: "unknown",
            });
          }
        }
      } else {
        let i = 0;
        let j = 0;
        let boardsize = getCurrentBoardSize();
        let square = "";
        chessground.set({
          movable: {
            color: undefined,
            dests: EmptyMap,
          },
        });
        for (i = 0; i < boardsize.width; i++) {
          for (j = 0; j < boardsize.height; j++) {
            square = convertSquareToChessgroundXKey(`${files[i]}${j + 1}`);
            if (
              chessground.state.boardState.pieces.has(square) &&
              (chessground.state.boardState.pieces.get(square).color ==
                "white" ||
                chessground.state.boardState.pieces.get(square).role ==
                  "_-piece")
            ) {
              continue;
            } else {
              chessground.state.boardState.pieces.set(square, {
                color: "black",
                role: "unknown",
              });
            }
          }
        }
      }
    } else if (perspective == "black") {
      if (board.turn()) {
        let i = 0;
        let j = 0;
        let boardsize = getCurrentBoardSize();
        let square = "";
        chessground.set({
          movable: {
            color: undefined,
            dests: EmptyMap,
          },
        });
        for (i = 0; i < boardsize.width; i++) {
          for (j = 0; j < boardsize.height; j++) {
            square = convertSquareToChessgroundXKey(`${files[i]}${j + 1}`);
            if (
              chessground.state.boardState.pieces.has(square) &&
              (chessground.state.boardState.pieces.get(square).color ==
                "black" ||
                chessground.state.boardState.pieces.get(square).role ==
                  "_-piece")
            ) {
              continue;
            } else {
              chessground.state.boardState.pieces.set(square, {
                color: "white",
                role: "unknown",
              });
            }
          }
        }
      } else {
        const fogofwarsquarevisibility = getKnownAndUnknownSquares(board);
        const unknownsquares = Array.from(
          fogofwarsquarevisibility.UnknownSquares,
        );
        let i = 0;
        let val1;
        for (i = 0; i < unknownsquares.length; i++) {
          val1 = convertSquareToChessgroundXKey(unknownsquares[i]);
          if (chessground.state.boardState.pieces.has(val1)) {
            let piece = chessground.state.boardState.pieces.get(val1);
            if (piece.role == "_-piece" || piece.color == "black") {
              continue;
            }
            piece.role = "unknown";
          } else {
            chessground.state.boardState.pieces.set(val1, {
              color: "white",
              role: "unknown",
            });
          }
        }
      }
    } else if (perspective == "alternate") {
      const fogofwarsquarevisibility = getKnownAndUnknownSquares(board);
      const unknownsquares = Array.from(
        fogofwarsquarevisibility.UnknownSquares,
      );
      let i = 0;
      let val1;
      const movercolor = getColor(board);
      for (i = 0; i < unknownsquares.length; i++) {
        val1 = convertSquareToChessgroundXKey(unknownsquares[i]);
        if (chessground.state.boardState.pieces.has(val1)) {
          let piece = chessground.state.boardState.pieces.get(val1);
          if (piece.role == "_-piece" || piece.color == movercolor) {
            continue;
          }
          piece.role = "unknown";
        } else {
          chessground.state.boardState.pieces.set(val1, {
            color: board.turn() ? "black" : "white",
            role: "unknown",
          });
        }
      }
    }
  } else if (effect == "wargame") {
    if (perspective == "white") {
      let i = 0;
      let j = 0;
      let boardsize = getCurrentBoardSize();
      let square = "";
      if (!board.turn()) {
        chessground.set({
          movable: {
            color: undefined,
            dests: EmptyMap,
          },
        });
      }
      for (i = 0; i < boardsize.width; i++) {
        for (j = 0; j < boardsize.height; j++) {
          square = convertSquareToChessgroundXKey(`${files[i]}${j + 1}`);
          if (
            chessground.state.boardState.pieces.has(square) &&
            chessground.state.boardState.pieces.get(square).color == "black" &&
            chessground.state.boardState.pieces.get(square).role != "_-piece"
          ) {
            chessground.state.boardState.pieces.delete(square);
          }
        }
      }
    } else if (perspective == "black") {
      let i = 0;
      let j = 0;
      let boardsize = getCurrentBoardSize();
      let square = "";
      if (board.turn()) {
        chessground.set({
          movable: {
            color: undefined,
            dests: EmptyMap,
          },
        });
      }
      for (i = 0; i < boardsize.width; i++) {
        for (j = 0; j < boardsize.height; j++) {
          square = convertSquareToChessgroundXKey(`${files[i]}${j + 1}`);
          if (
            chessground.state.boardState.pieces.has(square) &&
            chessground.state.boardState.pieces.get(square).color == "white" &&
            chessground.state.boardState.pieces.get(square).role != "_-piece"
          ) {
            chessground.state.boardState.pieces.delete(square);
          }
        }
      }
    } else if (perspective == "alternate") {
      let i = 0;
      let j = 0;
      let boardsize = getCurrentBoardSize();
      let square = "";
      if (board.turn()) {
        for (i = 0; i < boardsize.width; i++) {
          for (j = 0; j < boardsize.height; j++) {
            square = convertSquareToChessgroundXKey(`${files[i]}${j + 1}`);
            if (
              chessground.state.boardState.pieces.has(square) &&
              chessground.state.boardState.pieces.get(square).color ==
                "black" &&
              chessground.state.boardState.pieces.get(square).role != "_-piece"
            ) {
              chessground.state.boardState.pieces.delete(square);
            }
          }
        }
      } else {
        for (i = 0; i < boardsize.width; i++) {
          for (j = 0; j < boardsize.height; j++) {
            square = convertSquareToChessgroundXKey(`${files[i]}${j + 1}`);
            if (
              chessground.state.boardState.pieces.has(square) &&
              chessground.state.boardState.pieces.get(square).color ==
                "white" &&
              chessground.state.boardState.pieces.get(square).role != "_-piece"
            ) {
              chessground.state.boardState.pieces.delete(square);
            }
          }
        }
      }
    }
  }
}

function DisplayLastMoveWithVisualEffect(
  effect,
  chessground,
  lastMoveFrom,
  lastMoveTo,
) {
  if (effect == "fogofwar") {
    if (
      chessground.state.boardState.pieces.has(lastMoveFrom) &&
      chessground.state.boardState.pieces.get(lastMoveFrom).role == "unknown"
    ) {
      if (
        chessground.state.boardState.pieces.get(lastMoveTo) == undefined ||
        chessground.state.boardState.pieces.get(lastMoveTo).role != "unknown"
      ) {
        chessground.set({
          lastMove: [lastMoveTo, lastMoveTo],
        });
      } else {
        chessground.set({
          lastMove: undefined,
        });
      }
    } else if (
      chessground.state.boardState.pieces.has(lastMoveTo) &&
      chessground.state.boardState.pieces.get(lastMoveTo).role == "unknown"
    ) {
      if (
        chessground.state.boardState.pieces.get(lastMoveFrom) == undefined ||
        chessground.state.boardState.pieces.get(lastMoveFrom).role != "unknown"
      ) {
        chessground.set({
          lastMove: [lastMoveFrom, lastMoveFrom],
        });
      } else {
        chessground.set({
          lastMove: undefined,
        });
      }
    } else {
      chessground.set({
        lastMove: [lastMoveFrom, lastMoveTo],
      });
    }
  } else if (effect == "wargame") {
    if (chessground.state.boardState.pieces.has(lastMoveTo)) {
      chessground.set({
        lastMove: [lastMoveFrom, lastMoveTo],
      });
    } else {
      chessground.set({
        lastMove: undefined,
      });
    }
  }
}

function updatePGNDivision() {
  let deletelater = [];
  while (labelPgn.childNodes[0]) {
    deletelater.push(labelPgn.removeChild(labelPgn.childNodes[0]));
  }
  if (isAdvPGNMode.checked) {
    labelPgn.appendChild(getPgnDiv(board));
  } else {
    labelPgn.innerText = getPgn(board);
  }
  setTimeout(() => {
    let tmp = deletelater;
    deletelater = null;
  }, 500);
}

function updateChessground(showresult) {
  const boardfenval = board.fen();
  const boardfenvallist = boardfenval.split(" ");
  currentBoardFen.textContent = `Current Board FEN:  ${boardfenval}`;

  if (boardfenvallist.length == 7) {
    const checknums = boardfenvallist[4].split("+");
    pcheckCounts.textContent = `White remaining checks: ${checknums[1]} - Black remaining checks: ${checknums[0]}`;
    pcheckCounts.hidden = false;
  } else {
    pcheckCounts.textContent = "";
    pcheckCounts.hidden = true;
  }

  if (showresult) {
    gametree.SetCurrentMoveList(
      board.variant(),
      board.is960(),
      textFen.value,
      textMoves.value,
    );
    updatePGNDivision();
  }

  //if (labelPgn) labelPgn.innerText = getPgn(board);

  if (labelStm) labelStm.innerText = getColorOrUndefined(board);

  if (
    dropdownVisualEffect.value == "<DISABLED>" ||
    isBoardSetup.checked ||
    isAnalysis.checked ||
    labelStm.innerText == "undefined"
  ) {
    chessground.set({
      fen: boardfenval,
      check: getCheckSquares(board),
      turnColor: getColor(board),
      movable: {
        color: getColorOrUndefined(board),
        dests: getDests(board),
      },
    });
    displayHiddenDroppablePiece(board);
  } else {
    if (dropdownVisualEffectPerspective.value == "alternate") {
      chessground.set({ animation: { enabled: false } });
    }
    chessground.set({
      fen: boardfenval,
      check: getCheckSquares(board),
      turnColor: getColor(board),
      movable: {
        color: getColorOrUndefined(board),
        dests: getDests(board),
      },
    });
    displayHiddenDroppablePiece(board);
    ApplyVisualEffectToBoard(
      dropdownVisualEffect.value,
      dropdownVisualEffectPerspective.value,
      chessground,
      board,
    );
    if (dropdownVisualEffectPerspective.value == "alternate") {
      chessground.set({ animation: { enabled: true } });
    }
  }

  const moveStack = board.moveStack();
  clearMovesList();

  if (moveStack.length === 0) {
    chessground.set({
      lastMove: undefined,
    });
    buttonUndo.disabled = true;
  } else {
    const lastMove = moveStack.split(" ").pop();
    const matchresult = lastMove.match(/[a-z]+[0-9]+/g);
    let lastMoveFrom = null;
    let lastMoveTo = null;
    if (lastMove.includes("@")) {
      lastMoveFrom = lastMove.match(/[A-Z]+@/g)[0];
      lastMoveTo = convertSquareToChessgroundXKey(matchresult[0]);
    } else {
      lastMoveFrom = convertSquareToChessgroundXKey(matchresult[0]);
      lastMoveTo = convertSquareToChessgroundXKey(matchresult[1]);
      if (lastMoveFrom == lastMoveTo && lastMove.includes(",")) {
        lastMoveFrom = lastMoveTo = convertSquareToChessgroundXKey(
          matchresult[3],
        );
      }
    }
    if (
      dropdownVisualEffect.value == "<DISABLED>" ||
      isBoardSetup.checked ||
      isAnalysis.checked ||
      labelStm.innerText == "undefined"
    ) {
      chessground.set({
        lastMove: [lastMoveFrom, lastMoveTo],
      });
    } else {
      DisplayLastMoveWithVisualEffect(
        dropdownVisualEffect.value,
        chessground,
        lastMoveFrom,
        lastMoveTo,
      );
    }
    buttonUndo.disabled = false;
  }

  chessground.setAutoShapes([]);

  getGameStatus(showresult);
}

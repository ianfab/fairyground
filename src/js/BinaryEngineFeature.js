function ConvertFENtoSFEN(fen) {
  if (typeof fen != "string") {
    return null;
  }
  let fen_list = fen.trim().split(" ");
  let sfen = ["", "", "", ""];
  if (fen_list.length != 6 && fen_list.length != 7) {
    return null;
  }
  if (!fen_list[0].includes("[") || !fen_list[0].includes("]")) {
    if (fen_list[0].indexOf("[") >= 0 || fen_list[0].indexOf("]") >= 0) {
      return null;
    }
    sfen[0] = fen_list[0];
    sfen[2] = "";
  } else {
    if (
      fen_list[0].indexOf("[") > fen_list[0].indexOf("]") ||
      fen_list[0].indexOf("]") < 0
    ) {
      return null;
    }
    sfen[0] = fen_list[0].substring(0, fen_list[0].indexOf("["));
    sfen[2] = fen_list[0].substring(
      fen_list[0].indexOf("[") + 1,
      fen_list[0].indexOf("]"),
    );
  }
  if (fen_list[1] == "w") {
    sfen[1] = "b";
  } else if (fen_list[1] == "b") {
    sfen[1] = "w";
  } else {
    return null;
  }
  if (sfen[2].length == 0) {
    sfen[2] = "-";
  } else {
    const charCount = sfen[2].split("").reduce((pre, cur) => {
      if (cur in pre) {
        pre[cur]++;
      } else {
        pre[cur] = 1;
      }
      return pre;
    }, {});
    sfen[2] = "";
    let ch;
    for (ch in charCount) {
      if (charCount[ch] > 1) {
        sfen[2] += ch.toString() + charCount[ch].toString();
      } else {
        sfen[2] += ch.toString();
      }
    }
  }
  if (parseInt(fen_list.at(-1)) != NaN) {
    sfen[3] = parseInt(fen_list.at(-1)).toString();
  } else {
    return null;
  }
  return sfen.join(" ");
}

function convertUCImovestoUSImoves(moves, board_width, board_height) {
  const chartoindex = [
    "z",
    "y",
    "x",
    "w",
    "v",
    "u",
    "t",
    "s",
    "r",
    "q",
    "p",
    "o",
    "n",
    "m",
    "l",
    "k",
    "j",
    "i",
    "h",
    "g",
    "f",
    "e",
    "d",
    "c",
    "b",
    "a",
  ];
  if (
    typeof moves != "string" ||
    typeof board_width != "number" ||
    typeof board_height != "number"
  ) {
    return null;
  }
  if (board_width < 1 || board_height < 1) {
    return null;
  }
  let movelist = moves.trim().split(" ");
  try {
    movelist.forEach((val, ind) => {
      if (val.length < 1) {
        return;
      }
      let newmovenotation = "";
      let move = val;
      let isPromotion = val.at(-1) == "+";
      let isDemotion = val.at(-1) == "-";
      let i = 0;
      if (
        !/^([+]?[A-Za-z]@)([a-z][0-9]+)[+-]?$/.test(val) &&
        !/^([a-z][0-9]+){2}[+-]?$/.test(val)
      ) {
        throw SyntaxError;
      }
      if (isDemotion || isPromotion) {
        move = move.substring(0, move.length - 1);
      }
      if (val.includes("@")) {
        let atind = val.indexOf("@");
        newmovenotation = val.replace("@", "*").substring(0, atind + 1);
        move = move.substring(atind + 1);
      }
      let files = move.split(/[0-9]+/).filter((str) => {
        return str != "";
      });
      let ranks = move.split(/[a-z]/).filter((str) => {
        return str != "";
      });
      if (ranks.length != files.length) {
        throw SyntaxError;
      }
      ranks.forEach((rval, rind) => {
        if (parseInt(rval) < 1 || parseInt(rval) > board_height) {
          throw RangeError;
        }
        ranks[rind] =
          chartoindex[chartoindex.length - board_height + parseInt(rval) - 1];
      });
      files.forEach((fval, find) => {
        if (fval < "a" || fval > chartoindex.at(-board_width)) {
          throw RangeError;
        }
        files[find] = (
          chartoindex.indexOf(fval) +
          board_width -
          chartoindex.length +
          1
        ).toString();
      });
      movelist[ind] = newmovenotation;
      for (i = 0; i < ranks.length; i++) {
        movelist[ind] += `${files[i]}${ranks[i]}`;
      }
      if (isDemotion) {
        movelist[ind] += "-";
      } else if (isPromotion) {
        movelist[ind] += "+";
      }
    });
  } catch {
    return null;
  }
  return movelist.join(" ");
}

function convertUCImovestoUCCImoves(moves, board_width, board_height) {
  const chartoindex = [
    "z",
    "y",
    "x",
    "w",
    "v",
    "u",
    "t",
    "s",
    "r",
    "q",
    "p",
    "o",
    "n",
    "m",
    "l",
    "k",
    "j",
    "i",
    "h",
    "g",
    "f",
    "e",
    "d",
    "c",
    "b",
    "a",
  ];
  if (
    typeof moves != "string" ||
    typeof board_width != "number" ||
    typeof board_height != "number"
  ) {
    return null;
  }
  if (board_width < 1 || board_height < 1) {
    return null;
  }
  let movelist = moves.trim().split(" ");
  try {
    movelist.forEach((val, ind) => {
      if (val.length < 1) {
        return;
      }
      let move = val;
      let i = 0;
      if (!/^([a-z][0-9]+){2}$/.test(val)) {
        throw SyntaxError;
      }
      let files = move.split(/[0-9]+/).filter((str) => {
        return str != "";
      });
      let ranks = move.split(/[a-z]/).filter((str) => {
        return str != "";
      });
      if (ranks.length != files.length) {
        throw SyntaxError;
      }
      ranks.forEach((rval, rind) => {
        if (parseInt(rval) < 1 || parseInt(rval) > board_height) {
          throw RangeError;
        }
        ranks[rind] = parseInt(rval) - 1;
      });
      files.forEach((fval, find) => {
        if (fval < "a" || fval > chartoindex.at(-board_width)) {
          throw RangeError;
        }
      });
      movelist[ind] = "";
      for (i = 0; i < ranks.length; i++) {
        movelist[ind] += `${files[i]}${ranks[i]}`;
      }
    });
  } catch {
    return null;
  }
  return movelist.join(" ");
}

function convertUSImovestoUCImoves(moves, board_width, board_height) {
  const chartoindex = [
    "z",
    "y",
    "x",
    "w",
    "v",
    "u",
    "t",
    "s",
    "r",
    "q",
    "p",
    "o",
    "n",
    "m",
    "l",
    "k",
    "j",
    "i",
    "h",
    "g",
    "f",
    "e",
    "d",
    "c",
    "b",
    "a",
  ];
  if (
    typeof moves != "string" ||
    typeof board_width != "number" ||
    typeof board_height != "number"
  ) {
    return null;
  }
  if (board_width < 1 || board_height < 1) {
    return null;
  }
  let movelist = moves.trim().split(" ");
  try {
    movelist.forEach((val, ind) => {
      if (val.length < 1) {
        return;
      }
      let newmovenotation = "";
      let move = val;
      let isPromotion = val.at(-1) == "+";
      let isDemotion = val.at(-1) == "-";
      let i = 0;
      if (
        !/^([+]?[A-Za-z]\*)([0-9]+[a-z])[+-]?$/.test(val) &&
        !/^([0-9]+[a-z]){2}[+-]?$/.test(val)
      ) {
        throw SyntaxError;
      }
      if (isDemotion || isPromotion) {
        move = move.substring(0, move.length - 1);
      }
      if (val.includes("*")) {
        let atind = val.indexOf("*");
        newmovenotation = val.replace("*", "@").substring(0, atind + 1);
        move = move.substring(atind + 1);
      }
      let files = move.split(/[a-z]/).filter((str) => {
        return str != "";
      });
      let ranks = move.split(/[0-9]+/).filter((str) => {
        return str != "";
      });
      if (ranks.length != files.length) {
        throw SyntaxError;
      }
      ranks.forEach((rval, rind) => {
        if (rval < "a" || rval > chartoindex.at(-board_width)) {
          throw RangeError;
        }
        ranks[rind] = (
          chartoindex.indexOf(rval) +
          board_width -
          chartoindex.length +
          1
        ).toString();
      });
      files.forEach((fval, find) => {
        if (parseInt(fval) < 1 || parseInt(fval) > board_height) {
          throw RangeError;
        }
        files[find] =
          chartoindex[chartoindex.length - board_height + parseInt(fval) - 1];
      });
      movelist[ind] = newmovenotation;
      for (i = 0; i < ranks.length; i++) {
        movelist[ind] += `${files[i]}${ranks[i]}`;
      }
      if (isDemotion) {
        movelist[ind] += "-";
      } else if (isPromotion) {
        movelist[ind] += "+";
      }
    });
  } catch {
    return null;
  }
  return movelist.join(" ");
}

function convertUCCImovestoUCImoves(moves, board_width, board_height) {
  const chartoindex = [
    "z",
    "y",
    "x",
    "w",
    "v",
    "u",
    "t",
    "s",
    "r",
    "q",
    "p",
    "o",
    "n",
    "m",
    "l",
    "k",
    "j",
    "i",
    "h",
    "g",
    "f",
    "e",
    "d",
    "c",
    "b",
    "a",
  ];
  if (
    typeof moves != "string" ||
    typeof board_width != "number" ||
    typeof board_height != "number"
  ) {
    return null;
  }
  if (board_width < 1 || board_height < 1) {
    return null;
  }
  let movelist = moves.trim().split(" ");
  try {
    movelist.forEach((val, ind) => {
      if (val.length < 1) {
        return;
      }
      let move = val;
      let i = 0;
      if (!/^([a-z][0-9]+){2}$/.test(val)) {
        throw SyntaxError;
      }
      let files = move.split(/[0-9]+/).filter((str) => {
        return str != "";
      });
      let ranks = move.split(/[a-z]/).filter((str) => {
        return str != "";
      });
      if (ranks.length != files.length) {
        throw SyntaxError;
      }
      ranks.forEach((rval, rind) => {
        if (parseInt(rval) < 0 || parseInt(rval) > board_height - 1) {
          throw RangeError;
        }
        ranks[rind] = parseInt(rval) + 1;
      });
      files.forEach((fval, find) => {
        if (fval < "a" || fval > chartoindex.at(-board_width)) {
          throw RangeError;
        }
      });
      movelist[ind] = "";
      for (i = 0; i < ranks.length; i++) {
        movelist[ind] += `${files[i]}${ranks[i]}`;
      }
    });
  } catch {
    return null;
  }
  return movelist.join(" ");
}

if (window.fairyground) {
} else {
  throw TypeError(
    'Namespace "fairyground" is not defined. Cannot transfer definitions to main page.',
  );
}

window.fairyground.BinaryEngineFeature = { super: window.fairyground };

window.fairyground.BinaryEngineFeature.ConvertFENtoSFEN = ConvertFENtoSFEN;
window.fairyground.BinaryEngineFeature.convertUCCImovestoUCImoves =
  convertUCCImovestoUCImoves;
window.fairyground.BinaryEngineFeature.convertUCImovestoUCCImoves =
  convertUCImovestoUCCImoves;
window.fairyground.BinaryEngineFeature.convertUCImovestoUSImoves =
  convertUCImovestoUSImoves;
window.fairyground.BinaryEngineFeature.convertUSImovestoUCImoves =
  convertUSImovestoUCImoves;

window.fairyground.BinaryEngineFeature.ws = null;
window.fairyground.BinaryEngineFeature.WebSocketStatus = "Unestablished";
window.fairyground.BinaryEngineFeature.WebSocketReconnectionTime = 3;

window.fairyground.BinaryEngineFeature.first_engine = null;
window.fairyground.BinaryEngineFeature.second_engine = null;
window.fairyground.BinaryEngineFeature.analysis_engine = null;

//let checkconnectionnumber = parseInt(Math.random() * 100000);
window.fairyground.BinaryEngineFeature.load_engine_timeout = 15000;

//let i = 0;

window.fairyground.BinaryEngineFeature.wsport = window.location.port;
if (window.fairyground.BinaryEngineFeature.wsport == "") {
  window.fairyground.BinaryEngineFeature.wsport = 5001;
} else {
  window.fairyground.BinaryEngineFeature.wsport =
    +window.fairyground.BinaryEngineFeature.wsport + 1;
}

window.fairyground.BinaryEngineFeature.changing_engine_settings = false;

const ProtocolSearchRegExp = new RegExp("(uciok)|(usiok)|(ucciok)", "i");
const VariantOptionSearchRegExp = new RegExp(
  "(Variant)|(UCI_Variant)|(USI_Variant)|(UCCI_Variant)",
  "i",
);
const PonderOptionSearchRegExp = new RegExp(
  "(Ponder)|(UCI_Ponder)|(USI_Ponder)|(UCCI_Ponder)",
  "i",
);
const MessageSplitter = new RegExp("\x10", "");
const AllBlankTestRegExp = new RegExp("^[ ]*$", "");
const WhiteSpaceMatcher = new RegExp("[ ]+", "");
const LineFeedCarriageReturnMatcher = new RegExp("(\r\n)|(\r)", "g");
const BoardDimensionMatcher = new RegExp("board[0-9]+x[0-9]+", "");

function GetCurrentVariantID() {
  return document.getElementById("dropdown-variant").value;
}

window.fairyground.BinaryEngineFeature.GetCurrentVariantID =
  GetCurrentVariantID;

function CurrentVariantFischerRandomEnabled() {
  return document.getElementById("isfischerrandommode").checked;
}

window.fairyground.BinaryEngineFeature.CurrentVariantFischerRandomEnabled =
  CurrentVariantFischerRandomEnabled;

function MakeMoveOnBoard(ucimove) {
  if (typeof ucimove != "string") {
    throw TypeError();
  }
  const moves = document.getElementById("move");
  const applypos = document.getElementById("set");
  moves.value = moves.value.trim() + " " + ucimove;
  applypos.click();
}

window.fairyground.BinaryEngineFeature.MakeMoveOnBoard = MakeMoveOnBoard;

function GetBoardWidth() {
  const ClassList = document.getElementById(
    "chessground-container-div",
  ).classList;
  let i = 0;
  for (i = 0; i < ClassList.length; i++) {
    if (ClassList[i].startsWith("board")) {
      if (BoardDimensionMatcher.test(ClassList[i])) {
        return parseInt(ClassList[i].slice(5, ClassList[i].indexOf("x", 5)));
      }
    }
  }
  return 8;
}

window.fairyground.BinaryEngineFeature.GetBoardWidth = GetBoardWidth;

function GetBoardHeight() {
  const ClassList = document.getElementById(
    "chessground-container-div",
  ).classList;
  let i = 0;
  for (i = 0; i < ClassList.length; i++) {
    if (ClassList[i].startsWith("board")) {
      if (BoardDimensionMatcher.test(ClassList[i])) {
        return parseInt(ClassList[i].slice(ClassList[i].indexOf("x", 5) + 1));
      }
    }
  }
  return 8;
}

window.fairyground.BinaryEngineFeature.GetBoardHeight = GetBoardHeight;

function GetBoardPosition() {
  const fen = document.getElementById("fen").value.trim();
  const moves = document.getElementById("move").value.trim();
  return { fen: fen, moves: moves };
}

window.fairyground.BinaryEngineFeature.GetBoardPosition = GetBoardPosition;

function UpdateOutputSection(color, msg) {
  if (typeof color != "string" || typeof msg != "string") {
    throw TypeError();
  }
  switch (color) {
    case "WHITE": {
      const output = document.getElementById("whiteengineoutput");
      output.innerText += msg + "\n";
      break;
    }
    case "BLACK": {
      const output = document.getElementById("blackengineoutput");
      output.innerText += msg + "\n";
      break;
    }
    case "ANALYSIS": {
      const output = document.getElementById("analysisengineoutput");
      output.innerText += msg + "\n";
      break;
    }
  }
}

window.fairyground.BinaryEngineFeature.UpdateOutputSection =
  UpdateOutputSection;

function GetCurrentPlayingEngine() {
  const playwhite = document.getElementById("playwhite");
  const playblack = document.getElementById("playblack");
  const isanalysis = document.getElementById("analysis");
  const stm = document.getElementById("label-stm");
  if (
    isanalysis.checked &&
    window.fairyground.BinaryEngineFeature.analysis_engine != null
  ) {
    return "ANALYSIS";
  }
  if (
    playwhite.checked &&
    stm.innerText == "white" &&
    window.fairyground.BinaryEngineFeature.first_engine != null
  ) {
    return "WHITE";
  }
  if (
    playblack.checked &&
    stm.innerText == "black" &&
    window.fairyground.BinaryEngineFeature.second_engine != null
  ) {
    return "BLACK";
  }
  return "DEFAULT";
}

window.fairyground.BinaryEngineFeature.GetCurrentPlayingEngine =
  GetCurrentPlayingEngine;

function EnginePlaysColor(color) {
  if (typeof color != "string") {
    throw TypeError();
  }
  const playwhite = document.getElementById("playwhite");
  const playblack = document.getElementById("playblack");
  const isanalysis = document.getElementById("analysis");
  const stm = document.getElementById("label-stm");
  switch (color) {
    case "WHITE": {
      return (
        playwhite.checked &&
        stm.innerText == "white" &&
        window.fairyground.BinaryEngineFeature.first_engine != null
      );
    }
    case "BLACK": {
      return (
        playblack.checked &&
        stm.innerText == "black" &&
        window.fairyground.BinaryEngineFeature.second_engine != null
      );
    }
    case "ANALYSIS": {
      return (
        isanalysis.checked &&
        window.fairyground.BinaryEngineFeature.analysis_engine != null
      );
    }
    case "DEFAULT": {
      return (
        (playwhite.checked &&
          stm.innerText == "white" &&
          window.fairyground.BinaryEngineFeature.first_engine == null) ||
        (playblack.checked &&
          stm.innerText == "black" &&
          window.fairyground.BinaryEngineFeature.second_engine == null) ||
        (isanalysis.checked &&
          window.fairyground.BinaryEngineFeature.analysis_engine == null)
      );
    }
    default: {
      return false;
    }
  }
}

window.fairyground.BinaryEngineFeature.EnginePlaysColor = EnginePlaysColor;

function IsUCIMoveSyntaxCorrect(ucimove) {
  if (typeof ucimove != "string") {
    return false;
  }
  let move = ucimove;
  if (ucimove.includes(",")) {
    let index = ucimove.indexOf(",");
    let gatingmove = move.slice(index + 1);
    move = ucimove.slice(0, index);
    if (!/^([a-z]{1}[0-9]+){2}$/.test(gatingmove)) {
      return false;
    }
  }
  if (ucimove.includes("@")) {
    let parts = move.split("@");
    if (parts.length > 2) {
      return false;
    }
    let piecetype = parts[0];
    let dest = parts[1];
    if (/^\+?[A-Z]{1}$/.test(piecetype) && /^[a-z]{1}[0-9]+$/.test(dest)) {
      if (piecetype.length == 2 && /[a-z+-]/.test(piecetype.charAt(0))) {
        return true;
      } else if (piecetype.length == 1) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  let numbers = move.split(/[a-z]{1}/).filter((val) => {
    return val != "";
  });
  let characters = move.split(/[0-9]+/).filter((val) => {
    return val != "";
  });
  if (numbers.length != 2) {
    return false;
  }
  if (characters.length < 2 || characters.length > 3) {
    return false;
  }
  if (characters.length == 3 && /^([a-z]{1}[0-9]+){2}[a-z+-]{1}$/.test(move)) {
    return true;
  } else if (characters.length == 2 && /^([a-z]{1}[0-9]+){2}$/.test(move)) {
    return true;
  }
  return false;
}

window.fairyground.BinaryEngineFeature.IsUCIMoveSyntaxCorrect =
  IsUCIMoveSyntaxCorrect;

function GetEngineID(color) {
  if (typeof color != "string") {
    throw TypeError();
  }
  switch (color) {
    case "WHITE": {
      return document.getElementById("whiteengineid").innerText;
    }
    case "BLACK": {
      return document.getElementById("blackengineid").innerText;
    }
    case "ANALYSIS": {
      return document.getElementById("analysisengineid").innerText;
    }
  }
  return "";
}

window.fairyground.BinaryEngineFeature.GetEngineID = GetEngineID;

function ParseSavedEngineListMessage(msg) {
  if (typeof msg != "string") {
    throw TypeError();
  }
  let list = [];
  let entries = msg.split("\x01");
  entries.forEach((val) => {
    let enginesettings = val.split(";");
    if (enginesettings.length != 5) {
      return;
    }
    let engineid = enginesettings[0];
    let enginepath = enginesettings[1];
    let enginewd = enginesettings[2];
    let engineprotocol = enginesettings[3];
    let engineoptionstxt = enginesettings[4].split(",");
    let options = [];
    engineoptionstxt.forEach((val2) => {
      let pair = val2.split("=");
      if (pair.length != 2) {
        return;
      }
      options.push({ name: pair[0], current: pair[1] });
    });
    list.push({
      id: engineid,
      path: enginepath,
      working_directory: enginewd,
      protocol: engineprotocol,
      options: options,
    });
  });
  return list;
}

window.fairyground.BinaryEngineFeature.ParseSavedEngineListMessage =
  ParseSavedEngineListMessage;

function ConvertEngineListToText(list) {
  if (!Array.isArray(list)) {
    throw TypeError();
  }
  let strlist = [];
  list.forEach((item) => {
    let id = item.id;
    let path = item.path;
    let protocol = item.protocol;
    let wd = item.working_directory;
    let options = item.options;
    let optionlist = [];
    options.forEach((item2) => {
      optionlist.push(`${item2.name}=${item2.current}`);
    });
    let optiontxt = optionlist.join(",");
    strlist.push(`${id};${path};${wd};${protocol};${optiontxt}`);
  });
  return strlist.join("\x01");
}

window.fairyground.BinaryEngineFeature.ConvertEngineListToText =
  ConvertEngineListToText;

function GetEngineList(GetFinishCallBack, ws) {
  if (
    !WebSocket.prototype.isPrototypeOf(ws) ||
    typeof GetFinishCallBack != "function"
  ) {
    throw TypeError();
  }
  if (ws.readyState != ws.OPEN) {
    throw Error("WebSocket connection error");
  }
  function OnGetEngineListMessageReceived(event) {
    let msg = event.data.split("\x10");
    if (msg[0] == "ENGINE_LIST") {
      let list = ParseSavedEngineListMessage(msg[1]);
      ws.removeEventListener("message", OnGetEngineListMessageReceived);
      GetFinishCallBack(list);
    }
  }
  ws.addEventListener("message", OnGetEngineListMessageReceived);
  ws.send("GET_ENGINE_LIST");
}

window.fairyground.BinaryEngineFeature.GetEngineList = GetEngineList;

function SaveEngineList(EngineList, ws) {
  if (!Array.isArray(EngineList) || !WebSocket.prototype.isPrototypeOf(ws)) {
    throw TypeError();
  }
  if (ws.readyState != ws.OPEN) {
    throw Error("WebSocket connection error");
  }
  let text = ConvertEngineListToText(EngineList);
  ws.send(`SAVE_ENGINE_LIST\x10${text}`);
}

window.fairyground.BinaryEngineFeature.SaveEngineList = SaveEngineList;

function GetEngineItem(list, id) {
  if (!Array.isArray(list) || typeof id != "string") {
    throw TypeError();
  }
  try {
    list.forEach((item) => {
      if (item.id == id) {
        throw item;
      }
    });
  } catch (e) {
    return e;
  }
  return null;
}

window.fairyground.BinaryEngineFeature.GetEngineItem = GetEngineItem;

function SetEngineItem(list, id, path, workdirectory, protocol, options) {
  if (
    !Array.isArray(list) ||
    typeof id != "string" ||
    typeof path != "string" ||
    typeof workdirectory != "string" ||
    typeof protocol != "string" ||
    !Array.isArray(options)
  ) {
    throw TypeError();
  }
  list.forEach((item, ind) => {
    if (item.id == id) {
      list[ind] = {
        id: id,
        path: path,
        working_directory: workdirectory,
        protocol: protocol,
        options: options,
      };
    }
  });
}

window.fairyground.BinaryEngineFeature.SetEngineItem = SetEngineItem;

function AddEngineItem(list, id, path, workdirectory, protocol, options) {
  if (
    !Array.isArray(list) ||
    typeof id != "string" ||
    typeof path != "string" ||
    typeof workdirectory != "string" ||
    typeof protocol != "string" ||
    !Array.isArray(options)
  ) {
    throw TypeError();
  }
  try {
    list.forEach((item, ind) => {
      if (item.id == id) {
        throw ind;
      }
    });
  } catch (e) {
    console.error("Given ID already exists in the list.");
    throw e;
  }
  list.push({
    id: id,
    path: path,
    working_directory: workdirectory,
    protocol: protocol,
    options: options,
  });
}

window.fairyground.BinaryEngineFeature.AddEngineItem = AddEngineItem;

function RemoveEngineItem(list, id) {
  if (!Array.isArray(list) || typeof id != "string") {
    throw TypeError();
  }
  try {
    list.forEach((item, ind) => {
      if (item.id == id) {
        list.splice(ind, 1);
        throw item;
      }
    });
  } catch (e) {
    return e;
  }
  return null;
}

window.fairyground.BinaryEngineFeature.RemoveEngineItem = RemoveEngineItem;

function IsNullValue(val) {
  if (val !== null && val !== undefined && val != "") {
    if (val != "null" && val != "undefined") {
      if (typeof val == "number" && isNaN(val)) {
        return true;
      } else {
        return false;
      }
    }
  }
  return true;
}

window.fairyground.BinaryEngineFeature.IsNullValue = IsNullValue;

function DownloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

window.fairyground.BinaryEngineFeature.DownloadFile = DownloadFile;

//let wsa=new WebSocket("ws");

class Engine {
  constructor(
    ID,
    Command,
    WorkingDirectory,
    Protocol,
    Options,
    Color,
    LoadTimeOut,
    WebSocketConnection,
  ) {
    if (
      typeof ID != "string" ||
      typeof Command != "string" ||
      typeof WorkingDirectory != "string" ||
      typeof Protocol != "string" ||
      !Array.isArray(Options) ||
      typeof Color != "string" ||
      typeof LoadTimeOut != "number" ||
      !WebSocket.prototype.isPrototypeOf(WebSocketConnection)
    ) {
      throw TypeError();
    }
    if (WebSocketConnection.readyState != WebSocketConnection.OPEN) {
      throw Error("WebSocket connection error");
    }
    this.ID = ID.replace("|", "\\|");
    this.Name = "";
    this.Author = "";
    this.Command = Command.replace("|", "\\|");
    this.WorkingDirectory = WorkingDirectory.replace("|", "\\|");
    this.Protocol = Protocol.replace("|", "\\|");
    this.Options = Options;
    this.Color = Color.replace("|", "\\|");
    this.IsUsing = false;
    this.IsLoading = false;
    this.IsLoaded = false;
    this.Variants = [];
    this.HasVariantsOption = false;
    this.WebSocketConnection = WebSocketConnection;
    this.Move = "";
    this.Ponder = false;
    this.PonderMove = "0000";
    this.PonderMiss = false;
    this.IsStochasticPonder = false;
    this.ShowEvalutionInformation = false;
    this.DataStream = "";
    this.MessageBuffer = [];
    this.IsAnalysisEngine = false;
    this.SupportsByoyomi = false;
    this.MateEvaluationFactor = 2147483647;
    this.MaxMultiplePrincipalVariationCount = 4096;
    this.RecordedMultiplePrincipalVariation = 0;
    this.MultiplePrincipalVariationRecord = [];
    this.EvaluationIndex = [];
    this.IsThinking = false;
    this.MoveRightCount = 0;
    this.LoadTimeOut = LoadTimeOut;
    this.SupportsFischerRandom = false;
    this.LoadFinishCallBack = undefined;
    this.LoadFailureCallBack = undefined;
    this.IsReadyCallBack = undefined;
    this.SetIDCallBack = undefined;
    this.EvaluationUpdateCallBack = undefined;
    this.OutputUpdateCallBack = undefined;
    this.SendMessageCallBack = undefined;
    this.OnErrorMessageCallBack = undefined;
    if (Color == "ANALYSIS") {
      this.IsAnalysisEngine = true;
    }
    this.WebSocketOnMessageHandlerBinded =
      this.WebSocketOnMessageHandler.bind(this);
    this.WebSocketOnSocketInvalidHandlerBinded =
      this.WebSocketOnSocketInvalidHandler.bind(this);
    this.WebSocketConnection.addEventListener(
      "close",
      this.WebSocketOnSocketInvalidHandlerBinded,
    );
    this.WebSocketConnection.addEventListener(
      "message",
      this.WebSocketOnMessageHandlerBinded,
    );
    this.WebSocketConnection.addEventListener(
      "error",
      this.WebSocketOnSocketInvalidHandlerBinded,
    );
    for (let i = 0; i < this.MaxMultiplePrincipalVariationCount; i++) {
      this.MultiplePrincipalVariationRecord.push([
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
      this.EvaluationIndex.push(0);
    }
  }

  destructor() {
    this.WebSocketConnection.removeEventListener(
      "close",
      this.WebSocketOnSocketInvalidHandlerBinded,
    );
    this.WebSocketConnection.removeEventListener(
      "message",
      this.WebSocketOnMessageHandlerBinded,
    );
    this.WebSocketConnection.removeEventListener(
      "error",
      this.WebSocketOnSocketInvalidHandlerBinded,
    );
    if (this.WebSocketConnection.readyState == this.WebSocketConnection.OPEN) {
      this.WebSocketConnection.send(
        `EXIT_ENGINE\x10${this.ID}\x10${this.Color}`,
      );
    }
    this.IsUsing = false;
    this.IsLoaded = false;
    this.IsLoading = false;
    delete this;
  }

  Load(LoadFinishCallBack, LoadFailureCallBack) {
    if (
      typeof LoadFinishCallBack != "function" &&
      LoadFinishCallBack !== undefined
    ) {
      throw TypeError();
    }
    if (
      typeof LoadFailureCallBack != "function" &&
      LoadFailureCallBack !== undefined
    ) {
      throw TypeError();
    }
    if (this.WebSocketConnection.readyState != this.WebSocketConnection.OPEN) {
      return false;
    }
    this.IsLoading = true;
    this.IsLoaded = false;
    this.DataStream = "";
    this.Variants = [];
    this.Ponder = false;
    this.PonderMiss = false;
    this.PonderMove = "0000";
    this.Move = "0000";
    this.LoadFinishCallBack = LoadFinishCallBack;
    this.LoadFailureCallBack = LoadFailureCallBack;
    this.WebSocketConnection.send(
      `LOAD_ENGINE\x10${this.ID}\x10${this.Color}\x10${this.Protocol}\x10${this.Command}\x10${this.WorkingDirectory}\x10${this.LoadTimeOut}`,
    );
    return true;
  }

  OnReceivedMessageFromServer(Message) {
    if (typeof Message != "string") {
      throw TypeError();
    }
    //console.log(Message);
    //console.log(this.Color, this.ID);
    let msg = Message.split(MessageSplitter);
    //console.log(msg);
    if (
      msg[0] == "ENGINE_STDOUT" &&
      msg[1] == this.ID &&
      msg[2] == this.Color
    ) {
      this.DataStream += msg[3].replace(LineFeedCarriageReturnMatcher, "\n");
      let index = this.DataStream.indexOf("\n");
      if (index >= 0) {
        do {
          this.ParseEngineOutput(this.DataStream.slice(0, index));
          this.DataStream = this.DataStream.slice(index + 1);
          index = this.DataStream.indexOf("\n");
        } while (index >= 0);
      }
    } else if (msg[0] == "ERROR") {
      if (
        msg[1] == "LOAD_ENGINE" &&
        msg[2] == this.ID &&
        msg[3] == this.Color
      ) {
        this.IsLoading = false;
        this.IsLoaded = false;
        this.IsUsing = false;
        console.error(
          `Engine ID ${this.ID} Color ${this.Color} exited unexpectedly.`,
        );
        if (typeof this.LoadFailureCallBack == "function") {
          this.LoadFailureCallBack("Engine exited unexpectedly.");
        }
      } else if (
        msg[1] == "ENGINE_TIMEOUT" &&
        msg[2] == this.ID &&
        msg[3] == this.Color
      ) {
        this.IsLoading = false;
        this.IsLoaded = false;
        this.IsUsing = false;
        if (typeof this.LoadFailureCallBack == "function") {
          console.error("Engine load timed out.");
          this.LoadFailureCallBack("Engine load timed out.");
        }
      }
    } else if (
      msg[0] == "ENGINE_STDERR" &&
      msg[1] == this.ID &&
      msg[2] == this.Color
    ) {
      if (AllBlankTestRegExp.test(msg[3])) {
        return;
      }
      console.error("Engine " + msg[2] + " STDERR: " + msg[3]);
    } else if (
      msg[0] == "ID_CHANGED" &&
      msg[1] == this.ID &&
      msg[2] == this.Color
    ) {
      if (typeof this.SetIDCallBack == "function") {
        this.SetIDCallBack(this.ID);
      }
    }
  }

  ParseEngineOutput(Message) {
    if (typeof Message != "string") {
      throw TypeError();
    }
    if (this.IsLoaded) {
      if (typeof this.OutputUpdateCallBack == "function") {
        this.OutputUpdateCallBack(this.Color, Message);
      }
      if (Message.includes("bestmove")) {
        //console.log(`${this.Color} Receive: ${Message}`);
        //this.IsThinking = false;
        if (this.MoveRightCount <= 0) {
          console.error(
            `Engine ${this.Color} ID ${this.ID} claims too many moves.`,
          );
          return;
        }
        this.MoveRightCount--;
        if (EnginePlaysColor(this.Color)) {
          if (this.Ponder && this.PonderMiss) {
            this.PonderMiss = false;
            return;
          } else {
            let bestmoveline = Message.trim().split(WhiteSpaceMatcher);
            if (bestmoveline[1] == "resign" || bestmoveline[2] == "resign") {
              if (this.IsAnalysisEngine) {
                window.alert(
                  `${this.Name} (${this.Color}) suggests current mover to resign.`,
                );
              } else {
                this.Move = "0000";
                window.alert(`${this.Name} (${this.Color}) has resigned.`);
              }
            } else if (bestmoveline[1] == "win" || bestmoveline[1] == "lose") {
              this.Move = "0000";
              window.alert(
                `${this.Name} (${this.Color}) has claimed a ${bestmoveline[1]}.`,
              );
            } else {
              this.SetMoveInUCIFormat(bestmoveline[1]);
              if (this.Move == undefined) {
                this.Move = "0000";
              }
            }
            if (bestmoveline[2] == "draw") {
              this.SetPonderMoveInUCIFormat(bestmoveline[4]);
            } else {
              this.SetPonderMoveInUCIFormat(bestmoveline[3]);
            }
            if (this.PonderMove == undefined) {
              this.PonderMove = "0000";
            }
            console.log(
              `${this.Color}: Move: ${this.Move} Ponder: ${this.PonderMove}`,
            );
            if (
              this.Move != "0000" &&
              !this.IsAnalysisEngine &&
              !this.PonderMiss
            ) {
              this.CommitMove();
            }
          }
        } else {
          console.error(
            `Engine ID ${this.ID} Color ${this.Color} makes a move when not in it's turn. If you are not during play in advanced time control mode, you can ignore this message as this can be caused by clicking <stop> or the game finishes/aborts. Otherwise this usually can be making a move before "ponderhit" when Ponder=true.`,
          );
          if (typeof this.OnErrorMessageCallBack == "function") {
            this.OnErrorMessageCallBack(
              `Error: Engine ID ${this.ID} Color ${this.Color} makes a move when not in it's turn. This usually can be making a move before "ponderhit" when Ponder=true.`,
            );
          }
        }
      } else if (Message.includes("readyok")) {
        if (typeof this.IsReadyCallBack == "function") {
          this.IsReadyCallBack();
        }
      }
      if (typeof this.EvaluationUpdateCallBack == "function") {
        if (/( upperbound )|( lowerbound )/.test(Message)) {
          return;
        }
        if (Message.includes(" score ") && Message.includes(" pv ")) {
          let msglist = Message.trim().split(WhiteSpaceMatcher);
          let pv = msglist.slice(msglist.indexOf("pv") + 1);
          msglist = msglist.slice(0, msglist.indexOf("pv"));
          let moves = pv.join(" ");
          if (this.Protocol == "USI") {
            moves = convertUSImovestoUCImoves(
              moves,
              GetBoardWidth(),
              GetBoardHeight(),
            );
          } else if (
            this.Protocol == "UCCI" ||
            this.Protocol == "UCI_CYCLONE"
          ) {
            moves = convertUCCImovestoUCImoves(
              moves,
              GetBoardWidth(),
              GetBoardHeight(),
            );
          }
          this.EvaluationUpdateCallBack(msglist.join(" ") + " pv " + moves);
        } else if (Message.includes("bestmove")) {
          let msglist = Message.trim().split(WhiteSpaceMatcher);
          let bestmove = msglist[1];
          let ponder = "0000";
          if (msglist[2] == "draw") {
            ponder = msglist[4];
          } else {
            ponder = msglist[3];
          }
          if (this.Protocol == "USI") {
            bestmove = convertUSImovestoUCImoves(
              bestmove,
              GetBoardWidth(),
              GetBoardHeight(),
            );
          } else if (
            this.Protocol == "UCCI" ||
            this.Protocol == "UCI_CYCLONE"
          ) {
            bestmove = convertUCCImovestoUCImoves(
              bestmove,
              GetBoardWidth(),
              GetBoardHeight(),
            );
          }
          if (ponder) {
            if (this.Protocol == "USI") {
              ponder = convertUSImovestoUCImoves(
                ponder,
                GetBoardWidth(),
                GetBoardHeight(),
              );
            } else if (
              this.Protocol == "UCCI" ||
              this.Protocol == "UCI_CYCLONE"
            ) {
              ponder = convertUCCImovestoUCImoves(
                ponder,
                GetBoardWidth(),
                GetBoardHeight(),
              );
            }
          } else {
            ponder = "0000";
          }
          //console.log(`bestmove ${bestmove} ponder ${ponder}`);
          this.EvaluationUpdateCallBack(
            `bestmove ${bestmove} ponder ${ponder}`,
          );
        }
      }
    } else if (this.IsLoading) {
      this.MessageBuffer.push(Message);
      if (ProtocolSearchRegExp.test(Message)) {
        this.ParseEngineInitializationOutput(this.MessageBuffer);
        this.SetOptions(this.Options);
        this.MessageBuffer = [];
      } else if (Message.includes("readyok")) {
        this.WebSocketConnection.send(
          `ENGINE_READY\x10${this.ID}\x10${this.Color}`,
        );
        this.IsLoaded = true;
        this.IsLoading = false;
        let isfischerrandom = CurrentVariantFischerRandomEnabled();
        if (
          this.Variants.includes(GetCurrentVariantID()) &&
          ((isfischerrandom && this.SupportsFischerRandom) || !isfischerrandom)
        ) {
          this.IsUsing = true;
          if (this.HasVariantsOption) {
            this.SetVariant(GetCurrentVariantID(), isfischerrandom);
          }
          this.NewGame();
          let position = GetBoardPosition();
          this.SetPosition(
            position.fen,
            position.moves,
            GetBoardWidth(),
            GetBoardHeight(),
          );
        } else {
          console.log(
            "Engine " +
              this.Color +
              ": " +
              this.Name +
              ' does not support variant "' +
              GetCurrentVariantID() +
              '". In browser Fairy-Stockfish will be used instead.',
          );
          this.IsUsing = false;
        }
        let info = `Engine ${this.Color}:\nName: ${this.Name}\nAuthor: ${this.Author}\n`;
        if (this.Protocol == "UCI") {
          info += "uciok\n";
        } else if (this.Protocol == "USI") {
          info += "usiok\n";
        } else if (this.Protocol == "UCCI") {
          info += "ucciok\n";
        } else if (this.Protocol == "UCI_CYCLONE") {
          info += "uciok (cyclone)\n";
        } else {
          throw TypeError(`Unknown protocol: ${this.Protocol}`);
        }
        if (typeof this.OutputUpdateCallBack == "function") {
          this.OutputUpdateCallBack(this.Color, info);
        }
        this.MessageBuffer = [];
        if (typeof this.LoadFinishCallBack == "function") {
          this.LoadFinishCallBack(this.Name, this.Author);
        }
      }
    }
  }

  ParseEngineInitializationOutput(MessageBuffer) {
    if (!Array.isArray(MessageBuffer)) {
      throw TypeError();
    }
    let engine_info = MessageBuffer;
    let optionlist = [];
    let i = 0;
    let engine_name = "";
    let engine_author = "";
    let ponder = false;
    let variants = [];
    let variants_option = false;
    for (i = 0; i < engine_info.length; i++) {
      if (engine_info[i].startsWith("id name")) {
        engine_name = engine_info[i].split(" ").slice(2).join(" ");
      } else if (engine_info[i].startsWith("id author")) {
        engine_author = engine_info[i].split(" ").slice(2).join(" ");
      } else if (engine_info[i].startsWith("option ")) {
        let options = engine_info[i].split(" ");
        let optionname = options.slice(2, options.indexOf("type")).join(" ");
        if (this.Protocol == "UCCI") {
          optionname = options.slice(1, options.indexOf("type")).join(" ");
        }
        let optiontype = options[options.indexOf("type") + 1];
        if (optiontype == "button") {
          optionlist.push({
            name: optionname,
            type: optiontype,
            default: null,
            min: null,
            max: null,
            values: null,
            current: null,
          });
          continue;
        }
        let optiondefault = options[options.indexOf("default") + 1];
        if (optiontype == "check" || optiontype == "string") {
          optionlist.push({
            name: optionname,
            type: optiontype,
            default: optiondefault,
            min: null,
            max: null,
            values: null,
            current: null,
          });
          if (PonderOptionSearchRegExp.test(optionname)) {
            if (optiondefault == "true") {
              ponder = true;
            } else {
              ponder = false;
            }
          }
          if (optionname == "UCI_Chess960" && optiontype == "check") {
            this.SupportsFischerRandom = true;
          }
        } else if (optiontype == "spin") {
          optionlist.push({
            name: optionname,
            type: optiontype,
            default: optiondefault,
            min: options[options.indexOf("min") + 1],
            max: options[options.indexOf("max") + 1],
            values: null,
            current: null,
          });
        } else if (optiontype == "combo") {
          let dropdownoptions = options
            .slice(options.indexOf("default") + 1)
            .join(" ")
            .split(" var ")
            .slice(1);
          optionlist.push({
            name: optionname,
            type: optiontype,
            default: optiondefault,
            min: null,
            max: null,
            values: dropdownoptions,
            current: null,
          });
          if (VariantOptionSearchRegExp.test(optionname)) {
            variants = dropdownoptions.slice(0);
            variants_option = true;
          }
        } else {
          console.warn(
            "Unknown option type:" +
              optiontype +
              ".\nThis option will be ignored.",
          );
        }
      } else if (ProtocolSearchRegExp.test(engine_info[i])) {
        console.log("Engine loaded.");
        console.log(`Name: ${engine_name}\nAuthor: ${engine_author}`);
        //console.log(optionlist);
        if (variants.length == 0) {
          if (this.Protocol == "UCI") {
            variants = ["chess", ""];
          } else if (this.Protocol == "USI") {
            variants = ["shogi"];
          } else if (
            this.Protocol == "UCCI" ||
            this.Protocol == "UCI_CYCLONE"
          ) {
            variants = ["xiangqi"];
          }
          variants_option = false;
        }
        break;
      }
    }
    this.Name = engine_name;
    this.Author = engine_author;
    this.Ponder = ponder;
    this.Variants = variants;
    if (this.Options.length > 0) {
      this.Options.forEach((val, ind) => {
        optionlist.forEach((val2, ind2) => {
          if (val.name == val2.name) {
            if (IsNullValue(val.current)) {
              optionlist[ind2].current = val.default;
            } else {
              optionlist[ind2].current = val.current;
            }
            if (IsNullValue(val2.current)) {
              optionlist[ind2].current = val2.default;
            }
          }
        });
      });
    }
    this.Options = optionlist;
    this.HasVariantsOption = variants_option;
  }

  PostMessage(Message) {
    if (typeof Message != "string") {
      throw TypeError();
    }
    //console.log(`Send ${this.Color}: ${Message}`);
    //console.log(Error());
    if (typeof this.SendMessageCallBack == "function") {
      this.SendMessageCallBack(Message);
    }
    this.WebSocketConnection.send(
      `POST_MSG\x10${this.ID}\x10${this.Color}\x10${Message}`,
    );
  }

  SetOption(OptionName, OptionValue) {
    if (typeof OptionName != "string" || typeof OptionValue != "string") {
      throw TypeError();
    }
    if (
      this.Protocol == "UCI" ||
      this.Protocol == "USI" ||
      this.Protocol == "UCI_CYCLONE"
    ) {
      this.PostMessage(`setoption name ${OptionName} value ${OptionValue}`);
    } else if (this.Protocol == "UCCI") {
      this.PostMessage(`setoption ${OptionName} ${OptionValue}`);
    }
    if (
      OptionName == "Ponder" ||
      OptionName == "UCI_Ponder" ||
      OptionName == "USI_Ponder" ||
      OptionName == "UCCI_Ponder"
    ) {
      if (OptionValue == "true") {
        this.Ponder = true;
      } else {
        this.Ponder = false;
      }
    }
  }

  SetButtonOption(OptionName) {
    if (typeof OptionName != "string") {
      throw TypeError();
    }
    if (
      this.Protocol == "UCI" ||
      this.Protocol == "USI" ||
      this.Protocol == "UCI_CYCLONE"
    ) {
      this.PostMessage(`setoption name ${OptionName}`);
    } else if (this.Protocol == "UCCI") {
      this.PostMessage(`setoption ${OptionName}`);
    }
  }

  SetOptions(OptionList) {
    if (!Array.isArray(OptionList)) {
      throw TypeError();
    }
    OptionList.forEach((val) => {
      if (IsNullValue(val.current)) {
        return;
      }
      if (/^protocol$|^(UCI_|USI_|UCCI_)variant$|^variant$/i.test(val.name)) {
        return;
      }
      this.SetOption(val.name, val.current);
    });
    this.PostMessage(`isready`);
  }

  SaveOptionsToEngineList(EngineList) {
    if (!Array.isArray(EngineList)) {
      throw TypeError();
    }
    let item = GetEngineItem(EngineList, this.ID);
    if (item) {
      SetEngineItem(
        EngineList,
        this.ID,
        this.Command,
        this.WorkingDirectory,
        this.Protocol,
        this.Options,
      );
    } else {
      AddEngineItem(
        EngineList,
        this.ID,
        this.Command,
        this.WorkingDirectory,
        this.Protocol,
        this.Options,
      );
    }
  }

  NewGame() {
    this.StopThinking(true, false);
    this.RecordedMultiplePrincipalVariation = 0;
    if (this.Protocol == "UCI" || this.Protocol == "UCI_CYCLONE") {
      this.PostMessage("ucinewgame");
    } else if (this.Protocol == "USI") {
      this.PostMessage("usinewgame");
    } else if (this.Protocol == "UCCI") {
      this.PostMessage("uccinewgame");
    }
  }

  SetPosition(FEN, Moves, BoardWidth, BoardHeight) {
    if (
      typeof FEN != "string" ||
      typeof Moves != "string" ||
      typeof BoardWidth != "number" ||
      typeof BoardHeight != "number"
    ) {
      throw TypeError();
    }
    if (!this.IsUsing) {
      return;
    }
    this.RecordedMultiplePrincipalVariation = 0;
    if (FEN.length > 0) {
      if (this.Protocol == "UCI") {
        this.PostMessage(`position fen ${FEN} moves ${Moves}`);
      } else if (this.Protocol == "USI") {
        this.PostMessage(
          `position sfen ${ConvertFENtoSFEN(FEN)} moves ${convertUCImovestoUSImoves(Moves, BoardWidth, BoardHeight)}`,
        );
      } else if (this.Protocol == "UCCI" || this.Protocol == "UCI_CYCLONE") {
        this.PostMessage(
          `position fen ${FEN} moves ${convertUCImovestoUCCImoves(Moves, BoardWidth, BoardHeight)}`,
        );
      }
    } else {
      if (Moves.length > 0) {
        if (this.Protocol == "UCI") {
          this.PostMessage(`position startpos moves ${Moves}`);
        } else if (this.Protocol == "USI") {
          this.PostMessage(
            `position startpos moves ${convertUCImovestoUSImoves(Moves, BoardWidth, BoardHeight)}`,
          );
        } else if (this.Protocol == "UCCI" || this.Protocol == "UCI_CYCLONE") {
          this.PostMessage(
            `position startpos moves ${convertUCImovestoUCCImoves(Moves, BoardWidth, BoardHeight)}`,
          );
        }
      } else {
        this.PostMessage(`position startpos`);
      }
    }
  }

  SetVariant(VariantID, IsFischerRandom) {
    if (typeof VariantID != "string" || typeof IsFischerRandom != "boolean") {
      throw TypeError();
    }
    this.RecordedMultiplePrincipalVariation = 0;
    if (this.Variants.includes(VariantID)) {
      if (IsFischerRandom && !this.SupportsFischerRandom) {
        this.IsUsing = false;
        return false;
      }
      if (this.HasVariantsOption) {
        if (this.Protocol == "UCI" || this.Protocol == "UCI_CYCLONE") {
          this.PostMessage(`setoption name UCI_Variant value ${VariantID}`);
        } else if (this.Protocol == "USI") {
          this.PostMessage(`setoption name USI_Variant value ${VariantID}`);
        } else if (this.Protocol == "UCCI") {
          this.PostMessage(`setoption UCCI_Variant ${VariantID}`);
        }
      }
      if (this.SupportsFischerRandom) {
        this.PostMessage(
          `setoption name UCI_Chess960 value ${IsFischerRandom}`,
        );
      }
      this.NewGame();
      this.PostMessage("position startpos");
      this.IsUsing = true;
      return true;
    } else {
      this.IsUsing = false;
      return false;
    }
  }

  CommitMove() {
    if (!this.IsUsing) {
      return;
    }
    if (this.Move == "0000" || this.Move == undefined) {
      return;
    }
    console.log(`${this.Color}: Commit move: ${this.Move}`);
    if (EnginePlaysColor(this.Color)) {
      MakeMoveOnBoard(this.Move);
    }
  }

  SetMoveInUCIFormat(move) {
    if (!this.IsUsing) {
      return;
    }
    if (typeof move != "string") {
      throw TypeError();
    }
    if (this.Protocol == "UCI") {
      if (IsUCIMoveSyntaxCorrect(move)) {
        this.Move = move;
      } else {
        this.Move = null;
      }
    } else if (this.Protocol == "USI") {
      this.Move = convertUSImovestoUCImoves(
        move,
        GetBoardWidth(),
        GetBoardHeight(),
      );
    } else if (this.Protocol == "UCCI" || this.Protocol == "UCI_CYCLONE") {
      this.Move = convertUCCImovestoUCImoves(
        move,
        GetBoardWidth(),
        GetBoardHeight(),
      );
    }
  }

  SetPonderMoveInUCIFormat(move) {
    if (!this.IsUsing) {
      return;
    }
    if (typeof move != "string" && move !== undefined) {
      throw TypeError();
    }
    if (move) {
      if (this.Protocol == "UCI") {
        this.PonderMove = move;
      } else if (this.Protocol == "USI") {
        this.PonderMove = convertUSImovestoUCImoves(
          move,
          GetBoardWidth(),
          GetBoardHeight(),
        );
      } else if (this.Protocol == "UCCI" || this.Protocol == "UCI_CYCLONE") {
        this.PonderMove = convertUCCImovestoUCImoves(
          move,
          GetBoardWidth(),
          GetBoardHeight(),
        );
      }
    } else {
      this.PonderMove = undefined;
    }
  }

  RedetectOptions(LoadFinishCallBack, LoadFailureCallBack) {
    if (
      typeof LoadFinishCallBack != "function" &&
      LoadFinishCallBack !== undefined
    ) {
      throw TypeError();
    }
    if (
      typeof LoadFailureCallBack != "function" &&
      LoadFailureCallBack !== undefined
    ) {
      throw TypeError();
    }
    if (this.WebSocketConnection.readyState != this.WebSocketConnection.OPEN) {
      return false;
    }
    this.DataStream = "";
    this.Variants = [];
    this.Ponder = false;
    this.PonderMiss = false;
    this.PonderMove = "0000";
    this.Move = "0000";
    this.IsLoaded = false;
    this.IsLoading = true;
    this.LoadFinishCallBack = LoadFinishCallBack;
    this.LoadFailureCallBack = LoadFailureCallBack;
    if (this.Protocol == "UCI" || this.Protocol == "UCI_CYCLONE") {
      this.PostMessage("uci");
    } else if (this.Protocol == "USI") {
      this.PostMessage("usi");
    } else if (this.Protocol == "UCCI") {
      this.PostMessage("ucci");
    }
  }

  StopThinking(InterruptPondering, IsAdvancedTimeControl) {
    if (
      typeof InterruptPondering != "boolean" ||
      typeof IsAdvancedTimeControl != "boolean"
    ) {
      throw TypeError();
    }
    if (!this.IsThinking) {
      return;
    }
    this.IsThinking = false;
    if (InterruptPondering || !IsAdvancedTimeControl) {
      this.PonderMove = "0000";
      this.PostMessage("stop");
      this.PonderMiss = false;
    } else {
      if (!this.Ponder) {
        this.PonderMiss = false;
        this.PostMessage("stop");
      } else if (this.Ponder && this.PonderMiss) {
        this.PostMessage("stop");
      } else {
        this.IsThinking = true;
      }
    }
  }

  ForceStop() {
    this.PostMessage("stop");
    this.IsThinking = false;
    this.PonderMiss = false;
  }

  StartThinking(
    CurrentPlayer,
    IsInfinite,
    IsAdvancedTimeControl,
    IsPonder,
    IsPonderHit,
    IsByoyomi,
    Depth,
    MoveTime,
    Nodes,
    WhiteRemainingTime,
    WhiteTimeGain,
    BlackRemainingTime,
    BlackTimeGain,
    ByoyomiPeriodLength,
  ) {
    if (
      typeof CurrentPlayer != "string" ||
      typeof IsInfinite != "boolean" ||
      typeof IsAdvancedTimeControl != "boolean" ||
      typeof IsPonder != "boolean" ||
      typeof IsPonderHit != "boolean" ||
      typeof IsByoyomi != "boolean" ||
      typeof Depth != "number" ||
      typeof MoveTime != "number" ||
      typeof Nodes != "number" ||
      typeof WhiteRemainingTime != "number" ||
      typeof WhiteTimeGain != "number" ||
      typeof BlackRemainingTime != "number" ||
      typeof BlackTimeGain != "number" ||
      typeof ByoyomiPeriodLength != "number"
    ) {
      throw TypeError();
    }
    if (!this.IsUsing) {
      return;
    }
    if (!IsPonderHit) {
      this.MoveRightCount++;
    }
    this.IsThinking = true;
    this.RecordedMultiplePrincipalVariation = 0;
    let CurrentPlayerColor = CurrentPlayer.toUpperCase();
    if (this.IsAnalysisEngine || IsInfinite) {
      this.PostMessage("go infinite");
    } else if (IsAdvancedTimeControl) {
      let cmd = "";
      if (IsPonderHit) {
        //cmd = "ponderhit";
        this.PostMessage("ponderhit");
        return;
      } else {
        cmd = "go";
      }
      if (!IsPonderHit && IsPonder) {
        cmd += " ponder";
      }
      if (this.Protocol == "UCCI") {
        if (CurrentPlayerColor == "WHITE") {
          if (this.Color == CurrentPlayerColor) {
            if (IsByoyomi && this.SupportsByoyomi) {
              cmd += ` time ${WhiteRemainingTime} oppotime ${BlackRemainingTime} byoyomi ${ByoyomiPeriodLength}`;
            } else {
              cmd += ` time ${WhiteRemainingTime} increment ${WhiteTimeGain} oppotime ${BlackRemainingTime} oppoincrement ${BlackTimeGain}`;
            }
          } else {
            if (IsByoyomi && this.SupportsByoyomi) {
              cmd += ` time ${BlackRemainingTime} oppotime ${WhiteRemainingTime} byoyomi ${ByoyomiPeriodLength}`;
            } else {
              cmd += ` time ${BlackRemainingTime} increment ${BlackTimeGain} oppotime ${WhiteRemainingTime} oppoincrement ${WhiteTimeGain}`;
            }
          }
        } else if (CurrentPlayerColor == "BLACK") {
          if (this.Color == CurrentPlayerColor) {
            if (IsByoyomi && this.SupportsByoyomi) {
              cmd += ` time ${BlackRemainingTime} oppotime ${WhiteRemainingTime} byoyomi ${ByoyomiPeriodLength}`;
            } else {
              cmd += ` time ${BlackRemainingTime} increment ${BlackTimeGain} oppotime ${WhiteRemainingTime} oppoincrement ${WhiteTimeGain}`;
            }
          } else {
            if (IsByoyomi && this.SupportsByoyomi) {
              cmd += ` time ${WhiteRemainingTime} oppotime ${BlackRemainingTime} byoyomi ${ByoyomiPeriodLength}`;
            } else {
              cmd += ` time ${WhiteRemainingTime} increment ${WhiteTimeGain} oppotime ${BlackRemainingTime} oppoincrement ${BlackTimeGain}`;
            }
          }
        }
      } else {
        if (IsByoyomi && this.SupportsByoyomi) {
          cmd += ` wtime ${WhiteRemainingTime} btime ${BlackRemainingTime} byoyomi ${ByoyomiPeriodLength}`;
        } else {
          cmd += ` wtime ${WhiteRemainingTime} winc ${WhiteTimeGain} btime ${BlackRemainingTime} binc ${BlackTimeGain}`;
        }
      }
      this.PostMessage(cmd);
    } else {
      let args = "";
      //console.log(Depth, MoveTime, Nodes);
      if (Depth > 0) {
        args += ` depth ${Depth}`;
      }
      if (MoveTime > 0) {
        args += ` movetime ${MoveTime}`;
      }
      if (Nodes > 0) {
        args += ` nodes ${Nodes}`;
      }
      this.PostMessage(`go${args}`);
    }
  }

  SetID(ID, SetIDCallBack) {
    if (
      typeof ID != "string" ||
      (typeof SetIDCallBack != "function" && SetIDCallBack !== undefined)
    ) {
      throw TypeError();
    }
    let OldID = this.ID;
    this.SetIDCallBack = SetIDCallBack;
    this.ID = ID;
    this.WebSocketConnection.send(
      `CHANGE_ID\x10${OldID}\x10${this.Color}\x10${ID}`,
    );
  }

  SetPonderMiss() {
    this.PonderMiss = true;
    this.StopThinking(false, true);
  }

  IsReady(IsReadyCallBack) {
    if (typeof IsReadyCallBack != "function" && IsReadyCallBack !== undefined) {
      throw TypeError();
    }
    this.IsReadyCallBack = IsReadyCallBack;
    this.PostMessage("isready");
  }

  WebSocketOnMessageHandler(event) {
    this.OnReceivedMessageFromServer(event.data);
  }

  WebSocketOnSocketInvalidHandler(event) {
    this.IsUsing = false;
    this.IsLoaded = false;
    this.IsLoading = false;
  }
}

window.fairyground.BinaryEngineFeature.Engine = Engine;

function ShowEditEngineOptionsUI(EngineClass, DestructOnClose) {
  if (
    !Engine.prototype.isPrototypeOf(EngineClass) ||
    typeof DestructOnClose != "boolean"
  ) {
    throw TypeError();
  }
  if (!EngineClass.IsLoaded) {
    throw Error("Engine is not loaded.");
  }
  while (document.getElementById("enginesettingspopup") != null) {
    document.getElementById("enginesettingspopup").remove();
  }
  if (window.fairyground.BinaryEngineFeature.WebSocketStatus != "CONNECTED") {
    return;
  }
  window.fairyground.BinaryEngineFeature.changing_engine_settings = true;
  let popup = document.createElement("div");
  popup.id = "enginesettingspopup";
  let background = document.createElement("div");
  background.id = "enginesettingspopup-background";
  let title = document.createElement("p");
  title.id = "popup-title";
  title.innerHTML =
    "Name: " + EngineClass.Name + "\nAuthor: " + EngineClass.Author;
  title.style.whiteSpace = "pre-line";
  title.style.fontSize = "30px";
  title.style.fontWeight = "bold";
  title.style.fontFamily = "Times New Roman";
  title.style.fontStyle = "italic";
  popup.appendChild(title);
  let subdiv;
  let text;
  let input;
  let btntext;
  let restrictiontext;
  EngineClass.Options.forEach((value, index) => {
    subdiv = document.createElement("div");
    subdiv.id = value.name.replace(/[ ]/g, "") + "-div";
    text = document.createElement("p");
    text.innerHTML = value.name;
    subdiv.appendChild(text);
    if (value.type == "string") {
      input = document.createElement("input");
      input.type = "text";
      input.maxLength = 9999;
      input.value = value.default;
      subdiv.appendChild(input);
    } else if (value.type == "check") {
      input = document.createElement("input");
      input.type = "checkbox";
      if (value.default == "true") {
        input.checked = true;
      } else {
        input.checked = false;
      }
      subdiv.appendChild(input);
    } else if (value.type == "spin") {
      input = document.createElement("input");
      input.type = "number";
      input.max = value.max;
      input.min = value.min;
      input.value = value.default;
      input.onchange = function () {
        if (
          !/^(\-|\+)?(0|[1-9][0-9]*)$/.test(
            document.getElementById(value.name.replace(/[ ]/g, "") + "-input")
              .value,
          )
        ) {
          document.getElementById(
            value.name.replace(/[ ]/g, "") + "-input",
          ).value = parseInt(value.default);
        } else if (
          document.getElementById(value.name.replace(/[ ]/g, "") + "-input")
            .value < parseInt(value.min)
        ) {
          document.getElementById(
            value.name.replace(/[ ]/g, "") + "-input",
          ).value = parseInt(value.min);
        } else if (
          document.getElementById(value.name.replace(/[ ]/g, "") + "-input")
            .value > parseInt(value.max)
        ) {
          document.getElementById(
            value.name.replace(/[ ]/g, "") + "-input",
          ).value = parseInt(value.max);
        }
      };
      subdiv.appendChild(input);
      restrictiontext = document.createElement("p");
      restrictiontext.innerText = `(Min: ${value.min}, Max: ${value.max})`;
      subdiv.appendChild(restrictiontext);
    } else if (value.type == "button") {
      input = document.createElement("button");
      input.classList.add("ripple");
      input.onclick = function () {
        EngineClass.SetButtonOption(value.name);
      };
      btntext = document.createTextNode(value.name);
      input.appendChild(btntext);
      subdiv.appendChild(input);
    } else if (value.type == "combo") {
      input = document.createElement("select");
      let option;
      value.values.forEach((opt) => {
        option = document.createElement("option");
        option.text = opt;
        option.value = opt;
        input.appendChild(option);
      });
      subdiv.appendChild(input);
      input.childNodes.forEach((combooption, comboindex) => {
        if (combooption.innerHTML == EngineClass.Options[index].default) {
          input.selectedIndex = comboindex;
        }
      });
    } else {
      console.warn("Unknown option type: ", value.type);
    }
    input.id = value.name.replace(/[ ]/g, "") + "-input";
    subdiv.style.display = "flex";
    subdiv.style.marginTop = "10px";
    popup.appendChild(subdiv);
  });
  let actiondiv = document.createElement("div");
  actiondiv.style.display = "flex";
  actiondiv.style.marginTop = "5px";
  let cancel = document.createElement("button");
  cancel.classList.add("ripple");
  let canceltext = document.createTextNode("Close");
  cancel.appendChild(canceltext);
  cancel.onclick = function () {
    document.dispatchEvent(
      new CustomEvent("uilayoutchange", {
        detail: { message: "enginesetuppopup-background" },
      }),
    );
    while (document.getElementById("enginesettingspopup-background") != null) {
      document.getElementById("enginesettingspopup-background").remove();
    }
    while (document.getElementById("enginesettingspopup") != null) {
      document.getElementById("enginesettingspopup").remove();
    }
    window.fairyground.BinaryEngineFeature.changing_engine_settings = false;
    if (DestructOnClose) {
      EngineClass.destructor();
    }
  };
  let save = document.createElement("button");
  save.classList.add("ripple");
  let savetext = document.createTextNode("Apply Changes");
  save.onclick = function () {
    let Elem = null;
    EngineClass.Options.forEach((value, index) => {
      if (value.type == "button") {
        return;
      }
      Elem = document.getElementById(value.name.replace(/[ ]/g, "") + "-input");
      if (Elem == null) {
        return;
      }
      if (value.type == "check") {
        EngineClass.Options[index].current = Elem.checked.toString();
        if (
          value.name == "Ponder" ||
          value.name == "USI_Ponder" ||
          value.name == "UCCI_Ponder"
        ) {
          if (Elem.checked) {
            EngineClass.Ponder = true;
          } else {
            EngineClass.Ponder = false;
          }
        }
      } else {
        EngineClass.Options[index].current = Elem.value.toString();
      }
    });
    EngineClass.SetOptions(EngineClass.Options);
    /*EngineClass.IsReady(() => {
            console.log("readyok");
        });*/
    //console.log(EngineClass.Options);
    cancel.click();
  };
  save.appendChild(savetext);
  actiondiv.appendChild(save);
  let showcurrent = document.createElement("button");
  showcurrent.classList.add("ripple");
  let showcurrenttext = document.createTextNode("Show Current Value");
  showcurrent.onclick = function () {
    let Elem = null;
    EngineClass.Options.forEach((value, index) => {
      if (value.type == "button") {
        return;
      }
      Elem = document.getElementById(value.name.replace(/[ ]/g, "") + "-input");
      if (Elem == null || value.current == null) {
        return;
      }
      if (value.type == "check") {
        if (EngineClass.Options[index].current == "true") {
          Elem.checked = true;
        } else {
          Elem.checked = false;
        }
      } else if (value.type == "spin") {
        Elem.value = parseInt(EngineClass.Options[index].current);
      } else if (value.type == "combo") {
        Elem.childNodes.forEach((combooption, comboindex) => {
          if (combooption.innerHTML == EngineClass.Options[index].current) {
            Elem.selectedIndex = comboindex;
          }
        });
      } else {
        Elem.value = EngineClass.Options[index].current;
      }
    });
    //console.log(EngineClass.Options);
  };
  showcurrent.appendChild(showcurrenttext);
  actiondiv.appendChild(showcurrent);
  let showdefault = document.createElement("button");
  showdefault.classList.add("ripple");
  let showdefaulttext = document.createTextNode("Show Default Value");
  showdefault.onclick = function () {
    let Elem = null;
    EngineClass.Options.forEach((value, index) => {
      if (value.type == "button") {
        return;
      }
      Elem = document.getElementById(value.name.replace(/[ ]/g, "") + "-input");
      if (Elem == null || value.default == null) {
        return;
      }
      if (value.type == "check") {
        if (EngineClass.Options[index].default == "true") {
          Elem.checked = true;
        } else {
          Elem.checked = false;
        }
      } else if (value.type == "spin") {
        Elem.value = parseInt(EngineClass.Options[index].default);
      } else if (value.type == "combo") {
        Elem.childNodes.forEach((combooption, comboindex) => {
          if (combooption.innerHTML == EngineClass.Options[index].default) {
            Elem.selectedIndex = comboindex;
          }
        });
      } else {
        Elem.value = EngineClass.Options[index].default;
      }
    });
    //console.log(EngineClass.Options);
  };
  showdefault.appendChild(showdefaulttext);
  actiondiv.appendChild(showdefault);
  let redetectoptions = document.createElement("button");
  redetectoptions.classList.add("ripple");
  let redetectoptionstext = document.createTextNode("Re-detect");
  redetectoptions.appendChild(redetectoptionstext);
  redetectoptions.onclick = function () {
    EngineClass.RedetectOptions(
      () => {
        let Elem = null;
        EngineClass.Options.forEach((value, index) => {
          if (value.type == "button") {
            return;
          }
          Elem = document.getElementById(
            value.name.replace(/[ ]/g, "") + "-input",
          );
          if (Elem == null) {
            return;
          }
          if (value.type == "check") {
            EngineClass.Options[index].current = Elem.checked.toString();
            if (
              value.name == "Ponder" ||
              value.name == "USI_Ponder" ||
              value.name == "UCCI_Ponder"
            ) {
              if (Elem.checked) {
                EngineClass.Ponder = true;
              } else {
                EngineClass.Ponder = false;
              }
            }
          } else {
            EngineClass.Options[index].current = Elem.value.toString();
          }
        });
        //console.log(EngineClass.Options);
        EngineClass.SetOptions(EngineClass.Options);
        while (document.getElementById("enginesettingspopup") != null) {
          document.getElementById("enginesettingspopup").remove();
        }
        window.fairyground.BinaryEngineFeature.changing_engine_settings = false;
        setTimeout(() => {
          ShowEditEngineOptionsUI(EngineClass, false);
        }, 10);
      },
      (err) => {
        window.alert(`Failed to redetect options: ${err}`);
      },
    );
  };
  actiondiv.appendChild(cancel);
  actiondiv.appendChild(redetectoptions);
  let redetectoptionshelp = document.createElement("pre");
  redetectoptionshelp.innerText = "[?]";
  redetectoptionshelp.onclick = function () {
    window.alert(
      "On some engines, the options might change after you set some of these values. (e.g. Fairy-Stockfish, when you set VariantPath the UCI_Variant option will change.)\nThis function allows you to re-detect the option values so that the GUI can get the options properly.\nNote that you might need to click <Re-detect> for twice to make this work as the engine probably takes time to parse files while the GUI has no way to detect that.",
    );
  };
  redetectoptionshelp.style.cursor = "pointer";
  actiondiv.appendChild(redetectoptionshelp);
  popup.appendChild(actiondiv);
  popup.style.display = "block";
  popup.style.zIndex = "1006";
  background.style.display = "block";
  background.style.zIndex = "1005";
  document.body.appendChild(popup);
  document.body.appendChild(background);
  showcurrent.click();
  document.dispatchEvent(
    new CustomEvent("uilayoutchange", {
      detail: { message: "enginesettingspopup-background" },
    }),
  );
  document.dispatchEvent(new Event("initializeripples"));
}

window.fairyground.BinaryEngineFeature.ShowEditEngineOptionsUI =
  ShowEditEngineOptionsUI;

function ShowEngineSetupUI(EngineList, EngineClass, DestructOnClose, ws) {
  if (
    (!Engine.prototype.isPrototypeOf(EngineClass) &&
      EngineClass !== undefined) ||
    !WebSocket.prototype.isPrototypeOf(ws) ||
    typeof DestructOnClose != "boolean" ||
    !Array.isArray(EngineList)
  ) {
    throw TypeError();
  }
  if (ws.readyState != ws.OPEN) {
    throw Error("WebSocket connection error");
  }
  while (document.getElementById("enginesetuppopup") != null) {
    document.getElementById("enginesetuppopup").remove();
  }
  if (window.fairyground.BinaryEngineFeature.WebSocketStatus != "CONNECTED") {
    return;
  }
  if (EngineClass) {
    if (!EngineClass.IsLoaded) {
      throw Error("Engine is not loaded.");
    }
  }
  let newengineobj = undefined;
  let isloadingengine = false;
  let popup = document.createElement("div");
  popup.id = "enginesetuppopup";
  let background = document.createElement("div");
  background.id = "enginesetuppopup-background";
  let title = document.createElement("p");
  title.id = "popup-title";
  title.innerHTML = "Engine Setup";
  title.style.whiteSpace = "pre-line";
  title.style.fontSize = "50px";
  title.style.fontWeight = "bold";
  title.style.fontFamily = "Times New Roman";
  title.style.fontStyle = "italic";
  popup.appendChild(title);
  let iddiv = document.createElement("div");
  iddiv.style.display = "flex";
  let engineidtext = document.createElement("p");
  engineidtext.innerText = "Engine Display Name (must be unique):";
  let engineid = document.createElement("input");
  engineid.type = "text";
  engineid.maxLength = 9999;
  engineid.style.border = "1px solid #ddd";
  engineid.style.width = "500px";
  iddiv.appendChild(engineidtext);
  iddiv.appendChild(engineid);
  iddiv.style.marginBottom = "5px";
  popup.appendChild(iddiv);
  let pathdiv = document.createElement("div");
  pathdiv.style.display = "flex";
  let enginepathtext = document.createElement("p");
  enginepathtext.innerText = "Engine Executable Path (Absolute Path):";
  let enginepath = document.createElement("input");
  enginepath.type = "text";
  enginepath.maxLength = 9999;
  enginepath.style.border = "1px solid #ddd";
  enginepath.style.width = "500px";
  pathdiv.appendChild(enginepathtext);
  pathdiv.appendChild(enginepath);
  pathdiv.style.marginBottom = "5px";
  popup.appendChild(pathdiv);
  let wddiv = document.createElement("div");
  wddiv.style.display = "flex";
  let enginewdtext = document.createElement("p");
  enginewdtext.innerText = "Engine Working Directory (Absolute Path):";
  let enginewd = document.createElement("input");
  enginewd.type = "text";
  enginewd.maxLength = 9999;
  enginewd.style.border = "1px solid #ddd";
  enginewd.style.width = "500px";
  enginewd.placeholder =
    "Leave blank to be the same with Executable Path directory";
  wddiv.appendChild(enginewdtext);
  wddiv.appendChild(enginewd);
  wddiv.style.marginBottom = "5px";
  popup.appendChild(wddiv);
  let protocoldiv = document.createElement("div");
  protocoldiv.style.display = "flex";
  let engineprotocoltext = document.createElement("p");
  engineprotocoltext.innerText = "Engine Protocol:";
  let engineprotocol = document.createElement("select");
  engineprotocol.style.background = "#eee";
  engineprotocol.style.width = "400px";
  let option = document.createElement("option");
  option.text = "UCI (Universal Chess Interface)";
  option.value = "UCI";
  engineprotocol.appendChild(option);
  option = document.createElement("option");
  option.text = "UCCI (Universal Chinese Chess Interface)";
  option.value = "UCCI";
  engineprotocol.appendChild(option);
  option = document.createElement("option");
  option.text = "USI (Universal Shogi Interface)";
  option.value = "USI";
  engineprotocol.appendChild(option);
  option = document.createElement("option");
  option.text = "UCI: Cyclone (Universal Chess Interface Cyclone Variation)";
  option.value = "UCI_CYCLONE";
  engineprotocol.appendChild(option);
  protocoldiv.appendChild(engineprotocoltext);
  protocoldiv.appendChild(engineprotocol);
  protocoldiv.style.marginBottom = "5px";
  popup.appendChild(protocoldiv);
  if (EngineClass) {
    engineid.value = EngineClass.ID;
    enginepath.value = EngineClass.Command;
    enginewd.value = EngineClass.WorkingDirectory;
    let index = ["UCI", "UCCI", "USI", "UCI_CYCLONE"];
    engineprotocol.selectedIndex = index.indexOf(EngineClass.Protocol);
    //engineid.disabled = true;
  }
  let optionsdiv = document.createElement("div");
  optionsdiv.style.display = "flex";
  let engineoptionstext = document.createElement("p");
  engineoptionstext.innerText = "Engine Options:";
  let engineoptions = document.createElement("button");
  engineoptions.classList.add("ripple");
  engineoptions.onclick = function () {
    if (isloadingengine) {
      window.alert("Engine is loading.");
      return;
    }
    if (EngineClass) {
      if (
        enginepath.value.trim() == EngineClass.Command.trim() &&
        engineprotocol[engineprotocol.selectedIndex].value ==
          EngineClass.Protocol &&
        enginewd.value == EngineClass.WorkingDirectory
      ) {
        ShowEditEngineOptionsUI(EngineClass, false);
      } else {
        EngineClass.destructor();
        EngineClass = undefined;
        isloadingengine = true;
        EngineClass = new Engine(
          engineid.value,
          enginepath.value,
          enginewd.value,
          engineprotocol[engineprotocol.selectedIndex].value,
          [],
          "",
          window.fairyground.BinaryEngineFeature.load_engine_timeout,
          ws,
        );
        EngineClass.Load(
          () => {
            ShowEditEngineOptionsUI(EngineClass, false);
            isloadingengine = false;
          },
          (err) => {
            console.error(`Cannot load engine: ${err}`);
            window.alert(`Cannot load engine: ${err}`);
            isloadingengine = false;
          },
        );
      }
    } else {
      if (engineid.value == "" || enginepath.value == "") {
        window.alert("Engine ID and executable path must not be null");
        return;
      }
      if (newengineobj) {
        if (newengineobj.IsLoaded) {
          if (
            enginepath.value.trim() == newengineobj.Command.trim() &&
            engineprotocol[engineprotocol.selectedIndex].value ==
              newengineobj.Protocol &&
            enginewd.value == newengineobj.WorkingDirectory
          ) {
            ShowEditEngineOptionsUI(newengineobj, false);
            return;
          } else {
            newengineobj.destructor();
            newengineobj = undefined;
          }
        } else if (newengineobj.IsLoading) {
          window.alert("The engine is loading. Please wait for some time.");
          return;
        } else {
          newengineobj.destructor();
          newengineobj = undefined;
        }
      }
      isloadingengine = true;
      newengineobj = new Engine(
        engineid.value,
        enginepath.value,
        enginewd.value,
        engineprotocol[engineprotocol.selectedIndex].value,
        [],
        "",
        window.fairyground.BinaryEngineFeature.load_engine_timeout,
        ws,
      );
      newengineobj.Load(
        () => {
          ShowEditEngineOptionsUI(newengineobj, false);
          isloadingengine = false;
        },
        (err) => {
          console.error(`Cannot load engine: ${err}`);
          window.alert(`Cannot load engine: ${err}`);
          isloadingengine = false;
        },
      );
    }
  };
  let btntxt = document.createTextNode("Edit Options...");
  engineoptions.appendChild(btntxt);
  optionsdiv.appendChild(engineoptionstext);
  optionsdiv.appendChild(engineoptions);
  optionsdiv.style.marginBottom = "5px";
  popup.appendChild(optionsdiv);
  let actiondiv = document.createElement("div");
  actiondiv.style.display = "flex";
  let cancel = document.createElement("button");
  cancel.classList.add("ripple");
  let canceltext = document.createTextNode("Cancel");
  cancel.onclick = function () {
    if (isloadingengine) {
      window.alert("Engine is loading.");
      return;
    }
    if (DestructOnClose) {
      if (EngineClass) {
        EngineClass.destructor();
      }
    }
    if (newengineobj) {
      newengineobj.destructor();
      newengineobj = undefined;
    }
    document.dispatchEvent(
      new CustomEvent("uilayoutchange", {
        detail: { message: "enginemanagementpopup-background" },
      }),
    );
    while (document.getElementById("enginesetuppopup-background") != null) {
      document.getElementById("enginesetuppopup-background").remove();
    }
    while (document.getElementById("enginesetuppopup") != null) {
      document.getElementById("enginesetuppopup").remove();
    }
  };
  cancel.appendChild(canceltext);
  let confirm = document.createElement("button");
  confirm.classList.add("ripple");
  let confirmtext = document.createTextNode("");
  if (EngineClass) {
    confirmtext.textContent = "Save Changes";
  } else {
    confirmtext.textContent = "Add Engine";
  }
  confirm.onclick = function () {
    if (engineid.value == "" || enginepath.value == "") {
      window.alert("Engine ID and executable path must not be null");
      return;
    }
    if (isloadingengine) {
      window.alert("Engine is loading.");
      return;
    }
    if (
      EngineClass !== undefined &&
      EngineClass.IsLoaded &&
      enginepath.value.trim() == EngineClass.Command.trim() &&
      engineprotocol[engineprotocol.selectedIndex].value ==
        EngineClass.Protocol &&
      enginewd.value == EngineClass.WorkingDirectory
    ) {
      if (engineid.value != EngineClass.ID) {
        if (
          !window.confirm(
            `The ID has been changed to "${engineid.value}", which is different from the original one (${EngineClass.ID}). If you save the changes, it will be saved as a new engine while the original engine won't be changed. Proceed?`,
          )
        ) {
          return;
        }
      }
      EngineClass.SetID(engineid.value);
      EngineClass.Command = enginepath.value;
      EngineClass.Protocol = engineprotocol[engineprotocol.selectedIndex].value;
      EngineClass.WorkingDirectory = enginewd.value;
      EngineClass.SaveOptionsToEngineList(EngineList);
      if (window.fairyground.BinaryEngineFeature.first_engine) {
        if (
          window.fairyground.BinaryEngineFeature.first_engine.ID ==
          EngineClass.ID
        ) {
          window.fairyground.BinaryEngineFeature.first_engine.SetOptions(
            EngineClass.Options,
          );
        }
      }
      if (window.fairyground.BinaryEngineFeature.second_engine) {
        if (
          window.fairyground.BinaryEngineFeature.second_engine.ID ==
          EngineClass.ID
        ) {
          window.fairyground.BinaryEngineFeature.second_engine.SetOptions(
            EngineClass.Options,
          );
        }
      }
      if (window.fairyground.BinaryEngineFeature.analysis_engine) {
        if (
          window.fairyground.BinaryEngineFeature.analysis_engine.ID ==
          EngineClass.ID
        ) {
          window.fairyground.BinaryEngineFeature.analysis_engine.SetOptions(
            EngineClass.Options,
          );
        }
      }
    } else if (
      newengineobj !== undefined &&
      newengineobj.IsLoaded &&
      enginepath.value.trim() == newengineobj.Command.trim() &&
      engineprotocol[engineprotocol.selectedIndex].value ==
        newengineobj.Protocol &&
      enginewd.value == newengineobj.WorkingDirectory
    ) {
      if (GetEngineItem(EngineList, engineid.value)) {
        window.alert(
          `Engine with name "${engineid.value}" already exists. Please enter a different name.`,
        );
        return;
      }
      newengineobj.SetID(engineid.value);
      newengineobj.SaveOptionsToEngineList(EngineList);
    } else {
      window.alert(
        "The engine hasn't been verified yet. Click <Edit Options...> to check validity.",
      );
      return;
    }
    let availableenginesdropdown = document.getElementById(
      "availableenginesdropdown",
    );
    if (availableenginesdropdown) {
      while (availableenginesdropdown.length > 0) {
        availableenginesdropdown.removeChild(availableenginesdropdown[0]);
      }
      EngineList.forEach((val) => {
        let option = document.createElement("option");
        option.text = val.id;
        option.value = val.id;
        availableenginesdropdown.appendChild(option);
      });
    }
    cancel.click();
  };
  confirm.appendChild(confirmtext);
  actiondiv.appendChild(confirm);
  actiondiv.appendChild(cancel);
  popup.appendChild(actiondiv);
  popup.style.display = "block";
  popup.style.zIndex = "1004";
  background.style.display = "block";
  background.style.zIndex = "1003";
  document.body.appendChild(popup);
  document.body.appendChild(background);
  document.dispatchEvent(
    new CustomEvent("uilayoutchange", {
      detail: { message: "enginesetuppopup-background" },
    }),
  );
  document.dispatchEvent(new Event("initializeripples"));
}

window.fairyground.BinaryEngineFeature.ShowEngineSetupUI = ShowEngineSetupUI;

function ShowEngineManagementUI(EngineList, ws) {
  if (!WebSocket.prototype.isPrototypeOf(ws) || !Array.isArray(EngineList)) {
    throw TypeError();
  }
  if (ws.readyState != ws.OPEN) {
    throw Error("WebSocket connection error");
  }
  while (document.getElementById("enginemanagementpopup") != null) {
    document.getElementById("enginemanagementpopup").remove();
  }
  if (window.fairyground.BinaryEngineFeature.WebSocketStatus != "CONNECTED") {
    return;
  }
  let isloadingengine = false;
  let popup = document.createElement("div");
  popup.id = "enginemanagementpopup";
  let background = document.createElement("div");
  background.id = "enginemanagementpopup-background";
  let title = document.createElement("p");
  title.id = "popup-title";
  title.innerHTML = "Engine Management";
  title.style.whiteSpace = "pre-line";
  title.style.fontSize = "50px";
  title.style.fontWeight = "bold";
  title.style.fontFamily = "Times New Roman";
  title.style.fontStyle = "italic";
  popup.appendChild(title);
  let engineinfodiv = document.createElement("div");
  let enginelistdiv = document.createElement("div");
  let enginecontroldiv = document.createElement("div");
  enginelistdiv.style.display = "flex";
  enginecontroldiv.style.display = "flex";
  engineinfodiv.style.display = "flex";
  enginelistdiv.style.marginBottom = "5px";
  enginecontroldiv.style.marginBottom = "5px";
  engineinfodiv.style.marginBottom = "5px";
  engineinfodiv.style.flexDirection = "column";
  let whiteengineinfo = document.createElement("p");
  if (
    window.fairyground.BinaryEngineFeature.first_engine &&
    window.fairyground.BinaryEngineFeature.first_engine.IsLoaded
  ) {
    whiteengineinfo.innerText = `First Engine (WHITE) → ID: ${window.fairyground.BinaryEngineFeature.first_engine.ID} Name: ${window.fairyground.BinaryEngineFeature.first_engine.Name} Author: ${window.fairyground.BinaryEngineFeature.first_engine.Author}`;
  } else {
    whiteengineinfo.innerText = "First Engine (WHITE) → (Not Loaded)";
  }
  engineinfodiv.appendChild(whiteengineinfo);
  let blackengineinfo = document.createElement("p");
  if (
    window.fairyground.BinaryEngineFeature.second_engine &&
    window.fairyground.BinaryEngineFeature.second_engine.IsLoaded
  ) {
    blackengineinfo.innerText = `Second Engine (BLACK) → ID: ${window.fairyground.BinaryEngineFeature.second_engine.ID} Name: ${window.fairyground.BinaryEngineFeature.second_engine.Name} Author: ${window.fairyground.BinaryEngineFeature.second_engine.Author}`;
  } else {
    blackengineinfo.innerText = "Second Engine (BLACK) → (Not Loaded)";
  }
  engineinfodiv.appendChild(blackengineinfo);
  let analysisengineinfo = document.createElement("p");
  if (
    window.fairyground.BinaryEngineFeature.analysis_engine &&
    window.fairyground.BinaryEngineFeature.analysis_engine.IsLoaded
  ) {
    analysisengineinfo.innerText = `Analysis Engine (ANALYSIS) → ID: ${window.fairyground.BinaryEngineFeature.analysis_engine.ID} Name: ${window.fairyground.BinaryEngineFeature.analysis_engine.Name} Author: ${window.fairyground.BinaryEngineFeature.analysis_engine.Author}`;
  } else {
    analysisengineinfo.innerText = "Analysis Engine (ANALYSIS) → (Not Loaded)";
  }
  engineinfodiv.appendChild(analysisengineinfo);
  let availableenginestext = document.createElement("p");
  availableenginestext.innerText = "Available Engines:";
  let availableenginesdropdown = document.createElement("select");
  availableenginesdropdown.id = "availableenginesdropdown";
  EngineList.forEach((val) => {
    let option = document.createElement("option");
    option.text = val.id;
    option.value = val.id;
    availableenginesdropdown.appendChild(option);
  });
  enginelistdiv.appendChild(availableenginestext);
  enginelistdiv.appendChild(availableenginesdropdown);
  let addengine = document.createElement("button");
  addengine.classList.add("ripple");
  addengine.onclick = function () {
    ShowEngineSetupUI(EngineList, undefined, true, ws);
  };
  let addenginetext = document.createTextNode("Add Engine");
  addengine.appendChild(addenginetext);
  enginecontroldiv.appendChild(addengine);
  let removeengine = document.createElement("button");
  removeengine.classList.add("ripple");
  removeengine.onclick = function () {
    if (availableenginesdropdown.selectedIndex < 0) {
      window.alert("Please select a engine to remove.");
      return;
    }
    let id =
      availableenginesdropdown[availableenginesdropdown.selectedIndex].value;
    RemoveEngineItem(EngineList, id);
    while (availableenginesdropdown.length > 0) {
      availableenginesdropdown.removeChild(availableenginesdropdown[0]);
    }
    EngineList.forEach((val) => {
      let option = document.createElement("option");
      option.text = val.id;
      option.value = val.id;
      availableenginesdropdown.appendChild(option);
    });
  };
  let removeenginetext = document.createTextNode("Remove");
  removeengine.appendChild(removeenginetext);
  enginecontroldiv.appendChild(removeengine);
  let editsettings = document.createElement("button");
  editsettings.classList.add("ripple");
  editsettings.onclick = function () {
    if (availableenginesdropdown.selectedIndex < 0) {
      window.alert("Please select a engine.");
      return;
    }
    if (isloadingengine) {
      window.alert("Engine is loading.");
      return;
    }
    let id =
      availableenginesdropdown[availableenginesdropdown.selectedIndex].value;
    let enginesettings = GetEngineItem(EngineList, id);
    isloadingengine = true;
    let engineobj = new Engine(
      id,
      enginesettings.path,
      enginesettings.working_directory,
      enginesettings.protocol,
      enginesettings.options,
      "",
      window.fairyground.BinaryEngineFeature.load_engine_timeout,
      ws,
    );
    engineobj.Load(
      () => {
        ShowEngineSetupUI(EngineList, engineobj, true, ws);
        isloadingengine = false;
      },
      (err) => {
        isloadingengine = false;
        window.alert("Failed to load engine. Reason: " + err);
      },
    );
  };
  let editsettingstext = document.createTextNode("Change Options");
  editsettings.appendChild(editsettingstext);
  enginecontroldiv.appendChild(editsettings);
  let selectaswhite = document.createElement("button");
  selectaswhite.classList.add("ripple");
  selectaswhite.onclick = function () {
    if (window.fairyground.BinaryEngineFeature.first_engine) {
      if (window.fairyground.BinaryEngineFeature.first_engine.IsLoading) {
        window.alert("Engine is loading, please wait...");
        return;
      }
      window.fairyground.BinaryEngineFeature.first_engine.destructor();
    }
    if (availableenginesdropdown.selectedIndex < 0) {
      window.alert("Please select a engine.");
      return;
    }
    let id =
      availableenginesdropdown[availableenginesdropdown.selectedIndex].value;
    let enginesettings = GetEngineItem(EngineList, id);
    let engineobj = new Engine(
      id,
      enginesettings.path,
      enginesettings.working_directory,
      enginesettings.protocol,
      enginesettings.options,
      "WHITE",
      window.fairyground.BinaryEngineFeature.load_engine_timeout,
      ws,
    );
    window.fairyground.BinaryEngineFeature.first_engine = engineobj;
    engineobj.Load(
      (name, author) => {
        whiteengineinfo.innerText = `First Engine (WHITE) → ID: ${id} Name: ${name} Author: ${author}`;
      },
      (err) => {
        whiteengineinfo.innerText = `First Engine (WHITE) → (Not Loaded) (Error: ${err})`;
        document.getElementById("whiteengineoutput").textContent +=
          "\n[Error] ❌ " + err + "\n\n";
        window.alert("Engine WHITE Error: " + err);
      },
    );
  };
  let selectaswhitetext = document.createTextNode("Load As 1st Engine");
  selectaswhite.appendChild(selectaswhitetext);
  enginecontroldiv.appendChild(selectaswhite);
  let selectasblack = document.createElement("button");
  selectasblack.classList.add("ripple");
  selectasblack.onclick = function () {
    if (window.fairyground.BinaryEngineFeature.second_engine) {
      if (window.fairyground.BinaryEngineFeature.second_engine.IsLoading) {
        window.alert("Engine is loading, please wait...");
        return;
      }
      window.fairyground.BinaryEngineFeature.second_engine.destructor();
    }
    if (availableenginesdropdown.selectedIndex < 0) {
      window.alert("Please select a engine.");
      return;
    }
    let id =
      availableenginesdropdown[availableenginesdropdown.selectedIndex].value;
    let enginesettings = GetEngineItem(EngineList, id);
    let engineobj = new Engine(
      id,
      enginesettings.path,
      enginesettings.working_directory,
      enginesettings.protocol,
      enginesettings.options,
      "BLACK",
      window.fairyground.BinaryEngineFeature.load_engine_timeout,
      ws,
    );
    window.fairyground.BinaryEngineFeature.second_engine = engineobj;
    engineobj.Load(
      (name, author) => {
        blackengineinfo.innerText = `Second Engine (BLACK) → ID: ${id} Name: ${name} Author: ${author}`;
      },
      (err) => {
        blackengineinfo.innerText = `Second Engine (BLACK) → (Not Loaded) (Error: ${err})`;
        document.getElementById("blackengineoutput").textContent +=
          "\n[Error] ❌ " + err + "\n\n";
        window.alert("Engine BLACK Error: " + err);
      },
    );
  };
  let selectasblacktext = document.createTextNode("Load As 2nd Engine");
  selectasblack.appendChild(selectasblacktext);
  enginecontroldiv.appendChild(selectasblack);
  let selectasanalysis = document.createElement("button");
  selectasanalysis.classList.add("ripple");
  selectasanalysis.onclick = function () {
    if (window.fairyground.BinaryEngineFeature.analysis_engine) {
      if (window.fairyground.BinaryEngineFeature.analysis_engine.IsLoading) {
        window.alert("Engine is loading, please wait...");
        return;
      }
      window.fairyground.BinaryEngineFeature.analysis_engine.destructor();
    }
    if (availableenginesdropdown.selectedIndex < 0) {
      window.alert("Please select a engine.");
      return;
    }
    let id =
      availableenginesdropdown[availableenginesdropdown.selectedIndex].value;
    let enginesettings = GetEngineItem(EngineList, id);
    let engineobj = new Engine(
      id,
      enginesettings.path,
      enginesettings.working_directory,
      enginesettings.protocol,
      enginesettings.options,
      "ANALYSIS",
      window.fairyground.BinaryEngineFeature.load_engine_timeout,
      ws,
    );
    window.fairyground.BinaryEngineFeature.analysis_engine = engineobj;
    engineobj.Load(
      (name, author) => {
        analysisengineinfo.innerText = `Analysis Engine (ANALYSIS) → ID: ${id} Name: ${name} Author: ${author}`;
      },
      (err) => {
        analysisengineinfo.innerText = `Analysis Engine (ANALYSIS) → (Not Loaded) (Error: ${err})`;
        document.getElementById("analysisengineoutput").textContent +=
          "\n[Error] ❌ " + err + "\n\n";
        window.alert("Engine ANALYSIS Error: " + err);
      },
    );
  };
  let selectasanalysistext = document.createTextNode("Load As Analysis Engine");
  selectasanalysis.appendChild(selectasanalysistext);
  enginecontroldiv.appendChild(selectasanalysis);
  popup.appendChild(enginelistdiv);
  popup.appendChild(enginecontroldiv);
  popup.appendChild(engineinfodiv);
  let storagediv = document.createElement("div");
  storagediv.style.display = "flex";
  storagediv.style.marginBottom = "5px";
  let savelist = document.createElement("button");
  savelist.classList.add("ripple");
  let savelisttext = document.createTextNode("Save Engine List");
  savelist.appendChild(savelisttext);
  savelist.onclick = function () {
    if (
      !window.confirm(
        "Save added engines? The saved data will be replaced with current list.",
      )
    ) {
      return;
    }
    try {
      localStorage.setItem(
        "fairyground-EngineList",
        ConvertEngineListToText(EngineList),
      );
      window.alert("Successfully saved added engines.");
    } catch (e) {
      window.alert(`Cannot save list:\n${e}`);
    }
  };
  let loadlist = document.createElement("button");
  loadlist.classList.add("ripple");
  let loadlisttext = document.createTextNode("Load Engine List");
  loadlist.appendChild(loadlisttext);
  loadlist.onclick = function () {
    let listmsg = localStorage.getItem("fairyground-EngineList");
    if (listmsg) {
      let newlist = ParseSavedEngineListMessage(listmsg).reverse();
      EngineList.splice(0, EngineList.length);
      while (newlist.length > 0) {
        EngineList.push(newlist.pop());
      }
      while (availableenginesdropdown.length > 0) {
        availableenginesdropdown.removeChild(availableenginesdropdown[0]);
      }
      EngineList.forEach((val) => {
        let option = document.createElement("option");
        option.text = val.id;
        option.value = val.id;
        availableenginesdropdown.appendChild(option);
      });
    } else {
      window.alert(
        "There is no saved list. Note that the list cannot be accessed if you changed the browser, port, host name or web protocol.",
      );
    }
  };
  let savelisttofile = document.createElement("button");
  savelisttofile.classList.add("ripple");
  let savelisttofiletext = document.createTextNode("Save Engine List To File");
  savelisttofile.appendChild(savelisttofiletext);
  savelisttofile.onclick = function () {
    DownloadFile(
      ConvertEngineListToText(EngineList),
      "EngineList.txt",
      "text/plain",
    );
  };
  let loadlistfromfile = document.createElement("button");
  loadlistfromfile.classList.add("ripple");
  let loadlistfromfiletext = document.createTextNode(
    "Load Engine List From File",
  );
  loadlistfromfile.appendChild(loadlistfromfiletext);
  loadlistfromfile.onclick = function () {
    while (document.getElementById("EngineListFileSelect") != null) {
      document.getElementById("EngineListFileSelect").remove();
    }
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "EngineListFileSelect";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith("text/")) {
        const reader = new FileReader();

        reader.onload = function (event) {
          let text = event.target.result;
          let newlist = ParseSavedEngineListMessage(text).reverse();
          EngineList.splice(0, EngineList.length);
          while (newlist.length > 0) {
            EngineList.push(newlist.pop());
          }
          while (availableenginesdropdown.length > 0) {
            availableenginesdropdown.removeChild(availableenginesdropdown[0]);
          }
          EngineList.forEach((val) => {
            let option = document.createElement("option");
            option.text = val.id;
            option.value = val.id;
            availableenginesdropdown.appendChild(option);
          });
        };

        reader.readAsText(file, "utf-8");
      }
    });
    popup.appendChild(fileInput);
    fileInput.click();
  };
  storagediv.appendChild(loadlist);
  storagediv.appendChild(savelist);
  storagediv.appendChild(loadlistfromfile);
  storagediv.appendChild(savelisttofile);
  popup.appendChild(storagediv);
  let cancel = document.createElement("button");
  cancel.classList.add("ripple");
  let canceltext = document.createTextNode("Close");
  cancel.appendChild(canceltext);
  cancel.onclick = function () {
    if (isloadingengine) {
      window.alert("Engine is loading, please wait...");
      return;
    }
    const SelectedIndex =
      document.getElementById("dropdown-variant").selectedIndex;
    if (window.fairyground.BinaryEngineFeature.first_engine) {
      if (window.fairyground.BinaryEngineFeature.first_engine.IsLoading) {
        window.alert("Engine is loading, please wait...");
        return;
      }
      if (
        window.fairyground.BinaryEngineFeature.first_engine.SetVariant(
          document.getElementById("dropdown-variant")[SelectedIndex].value,
          document.getElementById("isfischerrandommode").checked,
        )
      ) {
        document.getElementById("whiteunsupportedvariant").hidden = true;
      } else {
        document.getElementById("whiteunsupportedvariant").hidden = false;
      }
    }
    if (window.fairyground.BinaryEngineFeature.second_engine) {
      if (window.fairyground.BinaryEngineFeature.second_engine.IsLoading) {
        window.alert("Engine is loading, please wait...");
        return;
      }
      if (
        window.fairyground.BinaryEngineFeature.second_engine.SetVariant(
          document.getElementById("dropdown-variant")[SelectedIndex].value,
          document.getElementById("isfischerrandommode").checked,
        )
      ) {
        document.getElementById("blackunsupportedvariant").hidden = true;
      } else {
        document.getElementById("blackunsupportedvariant").hidden = false;
      }
    }
    if (window.fairyground.BinaryEngineFeature.analysis_engine) {
      if (window.fairyground.BinaryEngineFeature.analysis_engine.IsLoading) {
        window.alert("Engine is loading, please wait...");
        return;
      }
      if (
        window.fairyground.BinaryEngineFeature.analysis_engine.SetVariant(
          document.getElementById("dropdown-variant")[SelectedIndex].value,
          document.getElementById("isfischerrandommode").checked,
        )
      ) {
        document.getElementById("analysisunsupportedvariant").hidden = true;
      } else {
        document.getElementById("analysisunsupportedvariant").hidden = false;
      }
    }
    document.getElementById("binengineoutputinit").click();
    document.dispatchEvent(
      new CustomEvent("uilayoutchange", { detail: { message: null } }),
    );
    while (
      document.getElementById("enginemanagementpopup-background") != null
    ) {
      document.getElementById("enginemanagementpopup-background").remove();
    }
    while (document.getElementById("enginemanagementpopup") != null) {
      document.getElementById("enginemanagementpopup").remove();
    }
  };
  popup.appendChild(cancel);
  let supportedvariants = document.createElement("button");
  supportedvariants.classList.add("ripple");
  let supportedvariantstext = document.createTextNode("Supported Variants");
  supportedvariants.appendChild(supportedvariantstext);
  supportedvariants.onclick = function () {
    window.alert(
      `First Engine:\n${window.fairyground.BinaryEngineFeature.first_engine ? window.fairyground.BinaryEngineFeature.first_engine.Variants.toString().replace(/,/g, ", ") : "(Not loaded)"}`,
    );
    window.alert(
      `Second Engine:\n${window.fairyground.BinaryEngineFeature.second_engine ? window.fairyground.BinaryEngineFeature.second_engine.Variants.toString().replace(/,/g, ", ") : "(Not loaded)"}`,
    );
    window.alert(
      `Analysis Engine:\n${window.fairyground.BinaryEngineFeature.analysis_engine ? window.fairyground.BinaryEngineFeature.analysis_engine.Variants.toString().replace(/,/g, ", ") : "(Not loaded)"}`,
    );
  };
  popup.appendChild(supportedvariants);
  let redetectsupportedvariants = document.createElement("button");
  redetectsupportedvariants.classList.add("ripple");
  let redetectsupportedvariantstext = document.createTextNode(
    "Re-detect Supported Variants",
  );
  redetectsupportedvariants.appendChild(redetectsupportedvariantstext);
  redetectsupportedvariants.onclick = function () {
    if (window.fairyground.BinaryEngineFeature.first_engine) {
      if (window.fairyground.BinaryEngineFeature.first_engine.IsLoading) {
        window.alert(
          "First engine is loading. Please wait for all engines to be loaded before performing this action.",
        );
        return;
      }
      window.fairyground.BinaryEngineFeature.first_engine.RedetectOptions(
        () => {
          let Elem = null;
          let EngineClass = window.fairyground.BinaryEngineFeature.first_engine;
          EngineClass.Options.forEach((value, index) => {
            if (value.type == "button") {
              return;
            }
            Elem = document.getElementById(
              value.name.replace(/[ ]/g, "") + "-input",
            );
            if (Elem == null) {
              return;
            }
            if (value.type == "check") {
              EngineClass.Options[index].current = Elem.checked.toString();
              if (
                value.name == "Ponder" ||
                value.name == "USI_Ponder" ||
                value.name == "UCCI_Ponder"
              ) {
                if (Elem.checked) {
                  EngineClass.Ponder = true;
                } else {
                  EngineClass.Ponder = false;
                }
              }
            } else {
              EngineClass.Options[index].current = Elem.value.toString();
            }
          });
          EngineClass.SetOptions(EngineClass.Options);
        },
        (err) => {
          window.alert(`Failed to redetect options: ${err}`);
        },
      );
    }
    if (window.fairyground.BinaryEngineFeature.second_engine) {
      if (window.fairyground.BinaryEngineFeature.second_engine.IsLoading) {
        window.alert(
          "Second engine is loading. Please wait for all engines to be loaded before performing this action.",
        );
        return;
      }
      window.fairyground.BinaryEngineFeature.second_engine.RedetectOptions(
        () => {
          let Elem = null;
          let EngineClass =
            window.fairyground.BinaryEngineFeature.second_engine;
          EngineClass.Options.forEach((value, index) => {
            if (value.type == "button") {
              return;
            }
            Elem = document.getElementById(
              value.name.replace(/[ ]/g, "") + "-input",
            );
            if (Elem == null) {
              return;
            }
            if (value.type == "check") {
              EngineClass.Options[index].current = Elem.checked.toString();
              if (
                value.name == "Ponder" ||
                value.name == "USI_Ponder" ||
                value.name == "UCCI_Ponder"
              ) {
                if (Elem.checked) {
                  EngineClass.Ponder = true;
                } else {
                  EngineClass.Ponder = false;
                }
              }
            } else {
              EngineClass.Options[index].current = Elem.value.toString();
            }
          });
          EngineClass.SetOptions(EngineClass.Options);
        },
        (err) => {
          window.alert(`Failed to redetect options: ${err}`);
        },
      );
    }
    if (window.fairyground.BinaryEngineFeature.analysis_engine) {
      if (window.fairyground.BinaryEngineFeature.analysis_engine.IsLoading) {
        window.alert(
          "Analysis engine is loading. Please wait for all engines to be loaded before performing this action.",
        );
        return;
      }
      window.fairyground.BinaryEngineFeature.analysis_engine.RedetectOptions(
        () => {
          let Elem = null;
          let EngineClass =
            window.fairyground.BinaryEngineFeature.analysis_engine;
          EngineClass.Options.forEach((value, index) => {
            if (value.type == "button") {
              return;
            }
            Elem = document.getElementById(
              value.name.replace(/[ ]/g, "") + "-input",
            );
            if (Elem == null) {
              return;
            }
            if (value.type == "check") {
              EngineClass.Options[index].current = Elem.checked.toString();
              if (
                value.name == "Ponder" ||
                value.name == "USI_Ponder" ||
                value.name == "UCCI_Ponder"
              ) {
                if (Elem.checked) {
                  EngineClass.Ponder = true;
                } else {
                  EngineClass.Ponder = false;
                }
              }
            } else {
              EngineClass.Options[index].current = Elem.value.toString();
            }
          });
          EngineClass.SetOptions(EngineClass.Options);
        },
        (err) => {
          window.alert(`Failed to redetect options: ${err}`);
        },
      );
    }
  };
  popup.appendChild(redetectsupportedvariants);
  popup.style.display = "block";
  popup.style.zIndex = "1002";
  background.style.display = "block";
  background.style.zIndex = "1001";
  document.body.appendChild(popup);
  document.body.appendChild(background);
  document.dispatchEvent(
    new CustomEvent("uilayoutchange", {
      detail: { message: "enginemanagementpopup-background" },
    }),
  );
  document.dispatchEvent(new Event("initializeripples"));
}

window.fairyground.BinaryEngineFeature.ShowEngineManagementUI =
  ShowEngineManagementUI;

if (window.fairyground) {
} else {
  throw TypeError(
    'Namespace "fairyground" is not defined. Cannot transfer definitions to main page.',
  );
}

window.fairyground.SavedGamesParsingFeature = { super: window.fairyground };

const WhiteSpaceMatcher2 = new RegExp("[ ]+", "");
const LineFeedCarriageReturnMatcher2 = new RegExp("(\r\n)|(\r)", "g");
const MateEvaluationFactor = 2147483647;
const BracketStartMatcher = new RegExp("\\(|\\{", "");
const BracketEndMatcher = new RegExp("\\)|\\}", "");
const MoveEvaluationCommentMatcher = new RegExp("\\!|\\?", "g");
const MoveNumberMatcher = new RegExp("^[0-9]+\\.+$", "");
const MoveNumberHeaderMatcher = new RegExp("^[0-9]+\\.+", "");

function RemovePGNNotes(PGNSANMove) {
  if (typeof PGNSANMove != "string") {
    throw TypeError();
  }
  let bracketlevel = 0;
  let result = "";
  let i = 0;
  for (i = 0; i < PGNSANMove.length; i++) {
    if (bracketlevel < 0) {
      return null;
    }
    if (BracketStartMatcher.test(PGNSANMove.charAt(i))) {
      bracketlevel++;
    } else if (BracketEndMatcher.test(PGNSANMove.charAt(i))) {
      bracketlevel--;
    } else if (bracketlevel == 0) {
      result += PGNSANMove.charAt(i);
    }
  }
  return result;
}

window.fairyground.SavedGamesParsingFeature.RemovePGNNotes = RemovePGNNotes;

function RemoveSANMoveNotes(MoveList) {
  if (!Array.isArray(MoveList)) {
    throw TypeError();
  }
  MoveList.forEach((val, ind, arr) => {
    let result = val;
    if (MoveNumberHeaderMatcher.test(result)) {
      result = result.replace(MoveNumberHeaderMatcher, "");
    }
    arr[ind] = result.replace(MoveEvaluationCommentMatcher, "");
  });
}

window.fairyground.SavedGamesParsingFeature.RemoveSANMoveNotes =
  RemoveSANMoveNotes;

function SetPosition(FEN, UCIMoves, Variant, Is960) {
  if (
    typeof FEN != "string" ||
    typeof UCIMoves != "string" ||
    typeof Variant != "string" ||
    typeof Is960 != "boolean"
  ) {
    throw TypeError();
  }
  const varianttype = document.getElementById("dropdown-varianttype");
  const variantname = document.getElementById("dropdown-variant");
  const isfischerrandommode = document.getElementById("isfischerrandommode");
  if (variantname.value != Variant) {
    window.alert(
      `This position uses variant "${Variant}", but the current selected variant is "${variantname.value}". Change the variant to "${Variant}" before setting this position.`,
    );
    return false;
  } else if (isfischerrandommode.checked != Is960) {
    window.alert(
      `This position has fischer random ${Is960 ? "enabled" : "disabled"}, but the current selected variant mismatches with it. ${isfischerrandommode.checked ? "Uncheck" : "Check"} "Fischer Random" before setting this position.`,
    );
    return false;
  }
  const fen = document.getElementById("fen");
  const move = document.getElementById("move");
  const setpos = document.getElementById("setpos");
  fen.value = FEN.trim();
  move.value = UCIMoves.trim();
  setpos.click();
  return true;
}

window.fairyground.SavedGamesParsingFeature.SetPosition = SetPosition;

function GetCurrentGameInformation(FFishJSLibrary) {
  const fge = window.fairyground.BinaryEngineFeature;
  const Variant =
    document.getElementById("dropdown-variant").value == ""
      ? "chess"
      : document.getElementById("dropdown-variant").value;
  const FEN = document.getElementById("fen").value.trim();
  const UCIMoves = document.getElementById("move").value.trim();
  const EngineWhite = document.getElementById("playwhite").checked;
  const EngineBlack = document.getElementById("playblack").checked;
  const GameEvent = "Fairy-Stockfish Playground match";
  const Site = window.location.host;
  const TimeoutSide = document.getElementById("timeoutside").value;
  const Is960 = document.getElementById("isfischerrandommode").checked;
  let whitename = "";
  let blackname = "";
  if (EngineWhite) {
    if (fge.first_engine) {
      whitename = fge.first_engine.Name;
    } else {
      whitename = "In browser Fairy-Stockfish";
    }
  } else {
    whitename = "Human Player";
  }
  if (EngineBlack) {
    if (fge.second_engine) {
      blackname = fge.second_engine.Name;
    } else {
      blackname = "In browser Fairy-Stockfish";
    }
  } else {
    blackname = "Human Player";
  }
  if (
    FFishJSLibrary.variants().split(" ").includes(Variant) &&
    FFishJSLibrary.validateFen(FEN, Variant, Is960) >= 0
  ) {
    let tmpboard = new FFishJSLibrary.Board(
      Variant,
      FEN == "" ? FFishJSLibrary.startingFen(Variant) : FEN,
      Is960,
    );
    let moveslist = UCIMoves.split(WhiteSpaceMatcher2).slice().reverse();
    if (moveslist.length == 1 && moveslist[0] == "") {
    } else {
      while (moveslist.length > 0) {
        if (!tmpboard.push(moveslist.pop())) {
          return null;
        }
      }
    }
    let Termination = "Normal";
    if (TimeoutSide != 0) {
      Termination = "Time forfeit";
    } else if (
      tmpboard.result() == "*" &&
      tmpboard.result(true) == "*" &&
      tmpboard.result(false) == "*"
    ) {
      Termination = "Unterminated";
    }
    let gameresult = tmpboard.result();
    if (gameresult == "*") {
      if (tmpboard.result(true) != "*") {
        gameresult = tmpboard.result(true);
      } else if (tmpboard.result(false) != "*") {
        gameresult = tmpboard.result(true);
      }
    }
    tmpboard.delete();
    return {
      Event: GameEvent,
      Site: Site,
      Date: new Date(),
      FEN: FEN,
      UCIMoves: UCIMoves,
      Variant: Variant,
      Is960: Is960,
      FirstPlayerName: whitename,
      SecondPlayerName: blackname,
      Result: gameresult,
      Termination: Termination,
    };
  } else {
    return null;
  }
}

window.fairyground.SavedGamesParsingFeature.GetCurrentGameInformation =
  GetCurrentGameInformation;

class Game {
  constructor(
    Variant,
    FEN,
    UCIMoves,
    Result,
    GameEvent,
    Site,
    GameDate,
    Round,
    FirstPlayerName,
    SecondPlayerName,
    FirstPlayerElo,
    SecondPlayerElo,
    BestMove,
    SuppliedMove,
    Evaluation,
    Termination,
    Is960,
  ) {
    if (
      typeof Variant != "string" ||
      typeof FEN != "string" ||
      typeof UCIMoves != "string" ||
      typeof Result != "string" ||
      typeof GameEvent != "string" ||
      typeof Site != "string" ||
      !Date.prototype.isPrototypeOf(GameDate) ||
      typeof Round != "number" ||
      typeof FirstPlayerName != "string" ||
      typeof SecondPlayerName != "string" ||
      typeof FirstPlayerElo != "number" ||
      typeof SecondPlayerElo != "number" ||
      typeof BestMove != "string" ||
      typeof SuppliedMove != "string" ||
      typeof Evaluation != "number" ||
      typeof Termination != "string" ||
      typeof Is960 != "boolean"
    ) {
      throw TypeError();
    }
    this.Variant = Variant;
    this.FEN = FEN;
    this.UCIMoves = UCIMoves.trim().split(WhiteSpaceMatcher2);
    this.Result = Result;
    this.Event = GameEvent;
    this.Site = Site;
    this.GameDate = GameDate;
    this.Round = Round;
    this.FirstPlayerName = FirstPlayerName;
    this.SecondPlayerName = SecondPlayerName;
    this.FirstPlayerElo = FirstPlayerElo;
    this.SecondPlayerElo = SecondPlayerElo;
    this.BestMove = BestMove;
    this.SuppliedMove = SuppliedMove;
    this.Evaluation = Evaluation;
    this.Termination = Termination;
    this.Is960 = Is960;
  }
  destructor() {
    delete this;
  }

  ToPortableGameNotation(FFishJSLibrary) {
    if (FFishJSLibrary == null) {
      throw TypeError();
    }
    if (
      FFishJSLibrary.variants().split(" ").includes(this.Variant) &&
      FFishJSLibrary.validateFen(this.FEN, this.Variant, this.Is960) >= 0
    ) {
      let tmpboard = new FFishJSLibrary.Board(
        this.Variant,
        this.FEN == "" ? FFishJSLibrary.startingFen(this.Variant) : this.FEN,
        this.Is960,
      );
      let moveslist = this.UCIMoves.slice().reverse();
      if (moveslist.length == 1 && moveslist[0] == "") {
      } else {
        while (moveslist.length > 0) {
          if (!tmpboard.push(moveslist.pop())) {
            return null;
          }
        }
      }
      let gameresult = tmpboard.result();
      if (gameresult == "*") {
        if (tmpboard.result(true) != "*") {
          gameresult = tmpboard.result(true);
        } else if (tmpboard.result(false) != "*") {
          gameresult = tmpboard.result(false);
        }
      }
      if (this.FEN == "") {
        tmpboard.reset();
      } else {
        tmpboard.setFen(this.FEN);
      }
      let result = "";
      const year = this.GameDate.getFullYear();
      const month = this.GameDate.getMonth() + 1;
      const day = this.GameDate.getDate();
      const hours = this.GameDate.getHours();
      const minutes = this.GameDate.getMinutes();
      const seconds = this.GameDate.getSeconds();
      let GameResult = this.Result;
      if (
        GameResult != "1-0" &&
        GameResult != "0-1" &&
        GameResult != "1/2-1/2" &&
        GameResult != "*"
      ) {
        GameResult = gameresult;
      }
      let Termination = this.Termination;
      if (Termination == "") {
        if (GameResult != gameresult) {
          Termination = "Time forfeit";
        } else if (GameResult == "*") {
          Termination = "Unterminated";
        } else {
          Termination = "Normal";
        }
      }
      result = `[Event "${this.Event}"]\n[Site "${this.Site}"]\n[Date "${year.toString() + "." + month.toString() + "." + day.toString()}"]\n`;
      result += `[Round "${this.Round}"]\n[White "${this.FirstPlayerName}"]\n[Black "${this.SecondPlayerName}"]\n`;
      if (this.FirstPlayerElo > 0) {
        result += `[WhiteElo "${this.FirstPlayerElo}"]\n`;
      }
      if (this.SecondPlayerElo > 0) {
        result += `[BlackElo "${this.SecondPlayerElo}"]\n`;
      }
      result += `[FEN "${tmpboard.fen()}"]\n[Result "${GameResult}"]\n[Variant "${this.Is960 ? this.Variant + "960" : this.Variant}"]\n[Termination "${Termination}"]\n\n`;
      result += tmpboard.variationSan(
        this.UCIMoves.join(" "),
        FFishJSLibrary.Notation.SAN,
      );
      result += ` ${gameresult}\n\n`;
      tmpboard.delete();
      return result;
    } else {
      return null;
    }
  }

  ToExtendedPositionDescription(FFishJSLibrary) {
    if (FFishJSLibrary == null) {
      throw TypeError();
    }
    if (
      FFishJSLibrary.variants().split(" ").includes(this.Variant) &&
      FFishJSLibrary.validateFen(this.FEN, this.Variant, this.Is960) >= 0
    ) {
      let tmpboard = new FFishJSLibrary.Board(
        this.Variant,
        this.FEN == "" ? FFishJSLibrary.startingFen(this.Variant) : this.FEN,
        this.Is960,
      );
      let moveslist = this.UCIMoves.slice().reverse();
      if (moveslist.length == 1 && moveslist[0] == "") {
      } else {
        while (moveslist.length > 0) {
          if (!tmpboard.push(moveslist.pop())) {
            return null;
          }
        }
      }
      const year = this.GameDate.getFullYear();
      const month = this.GameDate.getMonth() + 1;
      const day = this.GameDate.getDate();
      const hours = this.GameDate.getHours();
      const minutes = this.GameDate.getMinutes();
      const seconds = this.GameDate.getSeconds();
      let GameResult = this.Result;
      if (
        GameResult != "1-0" &&
        GameResult != "0-1" &&
        GameResult != "1/2-1/2" &&
        GameResult != "*"
      ) {
        GameResult = tmpboard.result();
      }
      let Termination = this.Termination;
      if (Termination == "") {
        if (GameResult != tmpboard.result()) {
          Termination = "Time forfeit";
        } else if (GameResult == "*") {
          Termination = "Unterminated";
        } else {
          Termination = "Normal";
        }
      }
      let result = `${tmpboard.fen()};`;
      result += ` variant "${this.Is960 ? this.Variant + "960" : this.Variant}";`;
      result += ` id "${this.Event}";`;
      result += ` site "${this.Site}";`;
      result += ` date "${year.toString() + "." + month.toString() + "." + day.toString()}";`;
      result += ` round ${this.Round};`;
      result += ` result "${GameResult}";`;
      result += ` first_player "${this.FirstPlayerName}";`;
      result += ` second_player "${this.SecondPlayerName}";`;
      if (this.FirstPlayerElo > 0) {
        result += ` first_player_elo ${this.FirstPlayerElo};`;
      }
      if (this.SecondPlayerElo > 0) {
        result += ` second_player_elo ${this.SecondPlayerElo};`;
      }
      result += ` termination "${Termination}";`;
      if (this.BestMove) {
        result += ` bm ${this.BestMove};`;
      }
      if (this.SuppliedMove) {
        result += ` sm ${this.SuppliedMove};`;
      }
      result += ` eval ${this.Evaluation.toFixed(2)};`;
      tmpboard.delete();
      return result;
    } else {
      return null;
    }
  }
}

window.fairyground.SavedGamesParsingFeature.Game = Game;

class PortableGameNotation {
  constructor(FileRawText, FFishJSLibrary) {
    if (typeof FileRawText != "string" && FileRawText !== undefined) {
      throw TypeError();
    }
    if (FFishJSLibrary == null) {
      throw TypeError();
    }
    this.GameList = [];
    this.FFishJSLibrary = FFishJSLibrary;
    if (typeof FileRawText == "string") {
      let NotLoadedGameCount = this.ParseFromText(FileRawText);
      if (NotLoadedGameCount) {
        window.alert(
          `${NotLoadedGameCount} game(s) is/are not loaded. Press Ctrl+Shift+I to see the reasons in errors.`,
        );
      }
    }
  }

  ConvertSANToUCI(Variant, FEN, SANMoves, Notation, Is960, Result) {
    if (
      typeof Variant != "string" ||
      typeof FEN != "string" ||
      typeof SANMoves != "string" ||
      typeof Notation != "object" ||
      typeof Is960 != "boolean" ||
      (typeof Result != "string" && Result !== undefined)
    ) {
      throw TypeError();
    }
    if (
      this.FFishJSLibrary.variants().split(" ").includes(Variant) &&
      this.FFishJSLibrary.validateFen(FEN, Variant, Is960) >= 0
    ) {
      let tmpboard = new this.FFishJSLibrary.Board(
        Variant,
        FEN == "" ? this.FFishJSLibrary.startingFen(Variant) : FEN,
        Is960,
      );
      let result = "";
      let moveslist = RemovePGNNotes(SANMoves)
        .split(WhiteSpaceMatcher2)
        .reverse()
        .filter((val) => {
          if (val == "") {
            return false;
          } else if (MoveNumberMatcher.test(val)) {
            return false;
          } else if (
            val == "*" ||
            val == "1-0" ||
            val == "0-1" ||
            val == "1/2-1/2" ||
            val == "..." ||
            val.startsWith("$")
          ) {
            return false;
          } else {
            return true;
          }
        });
      RemoveSANMoveNotes(moveslist);
      if (moveslist.length == 1 && moveslist[0] == "") {
      } else {
        while (moveslist.length > 0) {
          if (!tmpboard.pushSan(moveslist.pop(), Notation)) {
            tmpboard.delete();
            return null;
          }
        }
        result = tmpboard.moveStack();
      }
      if (typeof Result == "string") {
        if (tmpboard.result() != Result) {
          console.warn("Provided result mismatches with actual result.");
          tmpboard.delete();
          return null;
        }
      }
      tmpboard.delete();
      return result.trim();
    } else {
      console.warn("Invalid FEN or non-existent variant");
      return null;
    }
  }

  ConvertSANToUCIDefaultNotation(Variant, FEN, SANMoves, Is960, Result) {
    if (
      typeof Variant != "string" ||
      typeof FEN != "string" ||
      typeof SANMoves != "string" ||
      typeof Is960 != "boolean" ||
      (typeof Result != "string" && Result !== undefined)
    ) {
      throw TypeError();
    }
    function GetPart(str, i) {
      let start = 0;
      for (let j = 0; j < i; j++) {
        start = str.indexOf(" ", start) + 1;
        if (start === 0) {
          return "";
        }
      }
      let end = str.indexOf(" ", start);
      if (end === -1) {
        end = str.length;
      }
      return str.substring(start, end);
    }
    function GetPartIndex(str, substr) {
      let start = 0;
      let index = str.indexOf(substr);
      let i = 0;
      let result = 0;
      if (index < 0) {
        return -1;
      }
      for (i = 0; i < index; i++) {
        if (str.charAt(i) == " ") {
          result++;
        }
      }
      return result;
    }
    if (
      this.FFishJSLibrary.variants().split(" ").includes(Variant) &&
      this.FFishJSLibrary.validateFen(FEN, Variant, Is960) >= 0
    ) {
      let tmpboard = new this.FFishJSLibrary.Board(
        Variant,
        FEN == "" ? this.FFishJSLibrary.startingFen(Variant) : FEN,
        Is960,
      );
      let result = "";
      let moveslist = RemovePGNNotes(SANMoves)
        .split(WhiteSpaceMatcher2)
        .reverse()
        .filter((val) => {
          if (val == "") {
            return false;
          } else if (MoveNumberMatcher.test(val)) {
            return false;
          } else if (
            val == "*" ||
            val == "1-0" ||
            val == "0-1" ||
            val == "1/2-1/2" ||
            val == "..."
          ) {
            return false;
          } else {
            return true;
          }
        });
      RemoveSANMoveNotes(moveslist);
      if (moveslist.length == 1 && moveslist[0] == "") {
      } else {
        while (moveslist.length > 0) {
          let move = moveslist.pop();
          let legalmovesuci = tmpboard.legalMoves();
          let legalmovessan = " " + tmpboard.legalMovesSan() + " ";
          let index = GetPartIndex(legalmovessan, " " + move + " ");
          if (index < 0) {
            console.warn(`Bad SAN move: ${move}`);
            return null;
          }
          let ucimove = GetPart(legalmovesuci, index);
          tmpboard.push(ucimove);
          result += ` ${ucimove}`;
        }
      }
      if (typeof Result == "string") {
        if (tmpboard.result() != Result) {
          console.warn("Provided result mismatches with actual result.");
          tmpboard.delete();
          return null;
        }
      }
      tmpboard.delete();
      return result.trim();
    } else {
      console.warn("Invalid FEN or non-existent variant");
      return null;
    }
  }

  ParseFromText(FileRawText) {
    if (typeof FileRawText != "string") {
      throw TypeError();
    }
    let i = 0;
    let CurrentGame = 0;
    let Variant = "";
    let IsFischerRandom = false;
    let FEN = "";
    let SANMoves = "";
    let Result = "";
    let GameEvent = "";
    let Site = "";
    let GameDate = new Date();
    let Round = 1;
    let FirstPlayerName = "";
    let SecondPlayerName = "";
    let FirstPlayerElo = 0;
    let SecondPlayerElo = 0;
    let Termination = "";
    let SANVariation = this.FFishJSLibrary.Notation.SAN;
    let ParserState = 0;
    let ParserStarts = false;
    let NotLoadedGameCount = 0;
    let rawText = FileRawText.replace(
      LineFeedCarriageReturnMatcher2,
      "\n",
    ).split("\n");
    for (i = 0; i < rawText.length; i++) {
      if (rawText[i].startsWith("#") || rawText[i] == "") {
        continue;
      } else if (rawText[i].startsWith("[") && rawText[i].endsWith("]")) {
        let text = rawText[i].slice(1).slice(0, -1);
        let whitespaceindex = text.indexOf(" ");
        if (whitespaceindex < 1) {
          console.warn(
            `At line ${i + 1} of PGN file: Syntax Error: PGN configuration entries must be in [<Key> "<value>"] format.`,
          );
          continue;
        }
        let entry = [
          text.slice(0, whitespaceindex),
          text.slice(whitespaceindex + 1),
        ];
        if (entry[1].startsWith('"') && entry[1].endsWith('"')) {
          if (ParserStarts && ParserState == 0) {
            CurrentGame++;
            if (Variant == "") {
              Variant = "chess";
            } else if (Variant.endsWith("960")) {
              Variant = Variant.slice(0, -3);
              IsFischerRandom = true;
            }
            let UCIMoves = this.ConvertSANToUCI(
              Variant,
              FEN,
              SANMoves,
              SANVariation,
              IsFischerRandom,
              undefined,
            );
            if (UCIMoves != null) {
              this.GameList.push(
                new Game(
                  Variant,
                  FEN == "" ? this.FFishJSLibrary.startingFen(Variant) : FEN,
                  UCIMoves,
                  Result,
                  GameEvent,
                  Site,
                  GameDate,
                  Round,
                  FirstPlayerName,
                  SecondPlayerName,
                  FirstPlayerElo,
                  SecondPlayerElo,
                  "0000",
                  "0000",
                  0.0,
                  Termination,
                  IsFischerRandom,
                ),
              );
            } else {
              let variantlist = this.FFishJSLibrary.variants().split(" ");
              if (variantlist.includes(Variant)) {
                console.error(
                  `At game ${CurrentGame} (ends with line ${i}) in PGN file: Value Error: Bad FEN, move notation or game result.`,
                );
                NotLoadedGameCount++;
              } else {
                console.error(
                  `At game ${CurrentGame} (ends with line ${i}) in PGN file: Reference Error: Variant "${Variant}" is not defined.`,
                );
                NotLoadedGameCount++;
                if (!variantlist.includes("chess")) {
                  console.error("FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!");
                  window.alert(
                    "ERROR: FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!",
                  );
                  throw Error("FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!");
                }
              }
            }
            Variant = "";
            IsFischerRandom = false;
            FEN = "";
            SANMoves = "";
            Result = "";
            GameEvent = "";
            Site = "";
            GameDate = new Date();
            Round = 1;
            FirstPlayerName = "";
            SecondPlayerName = "";
            FirstPlayerElo = 0;
            SecondPlayerElo = 0;
            Termination = "";
          }
          ParserState = 1;
          ParserStarts = true;
          let item = entry[1].slice(1).slice(0, -1);
          if (entry[0] == "Variant") {
            Variant = item.toLowerCase();
          } else if (entry[0] == "FEN") {
            FEN = item;
          } else if (entry[0] == "Result") {
            Result = item;
          } else if (entry[0] == "Event") {
            GameEvent = item;
          } else if (entry[0] == "Site") {
            Site = item;
          } else if (entry[0] == "Date" || entry[0] == "UTCDate") {
            let datestr = item.split(".");
            if (datestr.length != 3) {
              console.warn(`At line ${i + 1} of PGN file: Syntax Error.`);
              continue;
            }
            let year = parseInt(datestr[0]);
            let month = parseInt(datestr[1]);
            let day = parseInt(datestr[2]);
            if (isNaN(year)) {
              console.warn(
                `At line ${i + 1} of PGN file: Syntax Error: Date must be in YYYY.MM.DD format and YYYY, MM, DD must be numbers.`,
              );
              continue;
            }
            if (isNaN(month)) {
              console.warn(
                `At line ${i + 1} of PGN file: Syntax Error: Date must be in YYYY.MM.DD format and YYYY, MM, DD must be numbers.`,
              );
              continue;
            }
            if (isNaN(day)) {
              console.warn(
                `At line ${i + 1} of PGN file: Syntax Error: Date must be in YYYY.MM.DD format and YYYY, MM, DD must be numbers.`,
              );
              continue;
            }
            GameDate.setFullYear(year, month - 1, day);
          } else if (entry[0] == "Round") {
            let round = parseInt(item);
            if (isNaN(round)) {
              console.warn(
                `At line ${i + 1} of PGN file: Syntax Error: Round must be a number.`,
              );
              continue;
            }
            Round = round;
          } else if (entry[0] == "White") {
            FirstPlayerName = item;
          } else if (entry[0] == "Black") {
            SecondPlayerName = item;
          } else if (entry[0] == "WhiteElo") {
            let elo = parseInt(item);
            if (isNaN(elo)) {
              console.warn(
                `At line ${i + 1} of PGN file: Syntax Error: Arpard Elo Rating score must be a number.`,
              );
              continue;
            }
            FirstPlayerElo = elo;
          } else if (entry[0] == "BlackElo") {
            let elo = parseInt(item);
            if (isNaN(elo)) {
              console.warn(
                `At line ${i + 1} of PGN file: Syntax Error: Arpard Elo Rating score must be a number.`,
              );
              continue;
            }
            SecondPlayerElo = elo;
          } else if (entry[0] == "Termination") {
            Termination = item;
          }
        } else {
          console.warn(
            `At line ${i + 1} of PGN file: Syntax Error: The value must be enclosed by double quotation marks.`,
          );
          continue;
        }
      } else if (ParserStarts) {
        ParserState = 0;
        SANMoves += " " + rawText[i];
      } else {
        console.warn(
          `At line ${i + 1} of PGN file: Syntax Error: A PGN file must begin with configuration entries.`,
        );
      }
    }
    if (ParserStarts && ParserState == 0) {
      CurrentGame++;
      if (Variant == "") {
        Variant = "chess";
      } else if (Variant.endsWith("960")) {
        Variant = Variant.slice(0, -3);
        IsFischerRandom = true;
      }
      let UCIMoves = this.ConvertSANToUCI(
        Variant,
        FEN,
        SANMoves,
        SANVariation,
        IsFischerRandom,
        undefined,
      );
      if (UCIMoves != null) {
        this.GameList.push(
          new Game(
            Variant,
            FEN,
            UCIMoves,
            Result,
            GameEvent,
            Site,
            GameDate,
            Round,
            FirstPlayerName,
            SecondPlayerName,
            FirstPlayerElo,
            SecondPlayerElo,
            "0000",
            "0000",
            0.0,
            Termination,
            IsFischerRandom,
          ),
        );
      } else {
        let variantlist = this.FFishJSLibrary.variants().split(" ");
        if (variantlist.includes(Variant)) {
          console.error(
            `At game ${CurrentGame} (ends with line ${i}) in PGN file: Value Error: Bad FEN, move notation or game result.`,
          );
          NotLoadedGameCount++;
        } else {
          console.error(
            `At game ${CurrentGame} (ends with line ${i}) in PGN file: Reference Error: Variant "${Variant}" is not defined.`,
          );
          NotLoadedGameCount++;
          if (!variantlist.includes("chess")) {
            console.error("FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!");
            window.alert("ERROR: FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!");
            throw Error("FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!");
          }
        }
      }
    } else if (ParserStarts) {
      console.warn(
        `At line ${i + 1} of PGN file: Syntax Error: Configuration entries defined with no moves provided.`,
      );
    } else {
      console.warn(
        `At line ${i + 1} of PGN file: Syntax Error: A PGN file must begin with configuration entries.`,
      );
    }
    return NotLoadedGameCount;
  }

  AppendToGameList(GameList) {
    if (!Array.isArray(GameList)) {
      throw TypeError();
    }
    this.GameList.forEach((val) => {
      GameList.push(val);
    });
  }
}

window.fairyground.SavedGamesParsingFeature.PortableGameNotation =
  PortableGameNotation;

class ExtendedPositionDescription {
  constructor(FileRawText, FFishJSLibrary) {
    if (typeof FileRawText != "string" && FileRawText !== undefined) {
      throw TypeError();
    }
    if (FFishJSLibrary == null) {
      throw TypeError();
    }
    this.GameList = [];
    this.FFishJSLibrary = FFishJSLibrary;
    if (typeof FileRawText == "string") {
      let NotLoadedGameCount = this.ParseFromText(FileRawText);
      if (NotLoadedGameCount) {
        window.alert(
          `${NotLoadedGameCount} game(s) is/are not loaded. Press Ctrl+Shift+I to see the reasons in errors.`,
        );
      }
    }
  }

  ParseFromText(FileRawText) {
    if (typeof FileRawText != "string") {
      throw TypeError();
    }
    let i = 0;
    let j = 0;
    let k = 0;
    let index = 0;
    let CurrentGame = 0;
    let Variant = "";
    let IsFischerRandom = false;
    let FEN = "";
    let Result = "";
    let Site = "";
    let GameEvent = "";
    let GameDate = new Date();
    let Round = 1;
    let FirstPlayerName = "";
    let SecondPlayerName = "";
    let FirstPlayerElo = 0;
    let SecondPlayerElo = 0;
    let BestMove = "0000";
    let SuppliedMove = "0000";
    let Evaluation = 0.0;
    let Termination = "";
    let NotLoadedGameCount = 0;
    let rawText = FileRawText.replace(
      LineFeedCarriageReturnMatcher2,
      "\n",
    ).split("\n");
    for (i = 0; i < rawText.length; i++) {
      if (rawText[i].startsWith("#") || rawText[i] == "") {
        continue;
      }
      let textentry = rawText[i].trim().split(";");
      Variant = "";
      IsFischerRandom = false;
      Result = "";
      Site = "";
      GameEvent = "";
      GameDate = new Date();
      Round = 1;
      FirstPlayerName = "";
      SecondPlayerName = "";
      FirstPlayerElo = 0;
      SecondPlayerElo = 0;
      BestMove = "0000";
      SuppliedMove = "0000";
      Evaluation = 0.0;
      Termination = "";
      FEN = textentry[0];
      for (j = 1; j < textentry.length; j++) {
        let text = textentry[j].trim();
        let isinquotes = false;
        for (k = 0; k < text.length; k++) {
          if (text.charAt(k) == '"') {
            isinquotes = !isinquotes;
          }
          if (text.charAt(k) == " " && !isinquotes) {
            index = k;
            break;
          }
        }
        let entry = [
          text.slice(0, index).trim().replace(/\"/g, ""),
          text
            .slice(index + 1)
            .trim()
            .replace(/\"/g, ""),
        ];
        if (entry[0] == "id") {
          GameEvent = entry[1];
        } else if (entry[0] == "variant") {
          Variant = entry[1].toLowerCase();
        } else if (entry[0] == "bm") {
          BestMove = entry[1];
        } else if (entry[0] == "sm") {
          SuppliedMove = entry[1];
        } else if (entry[0] == "eval") {
          let number = parseInt(entry[1]);
          if (entry[1].startsWith("#")) {
            number = MateEvaluationFactor / parseInt(entry[1].slice(1));
          }
          if (isNaN(number)) {
            console.warn(
              `At line ${i + 1} section ${j + 1} of EPD file: Syntax Error: Evaluation must be a number (integer in centi pawns) or a mate progress (#<number>).`,
            );
            continue;
          }
          Evaluation = number / 100;
        } else if (entry[0] == "result") {
          Result = entry[1];
        } else if (entry[0] == "date") {
          let datestr = entry[1].split(".");
          if (datestr.length != 3) {
            console.warn(
              `At line ${i + 1} section ${j + 1} of EPD file: Syntax Error.`,
            );
            continue;
          }
          let year = parseInt(datestr[0]);
          let month = parseInt(datestr[1]);
          let day = parseInt(datestr[2]);
          if (isNaN(year)) {
            console.warn(
              `At line ${i + 1} section ${j + 1} of EPD file: Syntax Error: Date must be in YYYY.MM.DD format and YYYY, MM, DD must be numbers.`,
            );
            continue;
          }
          if (isNaN(month)) {
            console.warn(
              `At line ${i + 1} section ${j + 1} of EPD file: Syntax Error: Date must be in YYYY.MM.DD format and YYYY, MM, DD must be numbers.`,
            );
            continue;
          }
          if (isNaN(day)) {
            console.warn(
              `At line ${i + 1} section ${j + 1} of EPD file: Syntax Error: Date must be in YYYY.MM.DD format and YYYY, MM, DD must be numbers.`,
            );
            continue;
          }
          GameDate.setFullYear(year, month - 1, day);
        } else if (entry[0] == "first_player") {
          FirstPlayerName = entry[1];
        } else if (entry[0] == "second_player") {
          SecondPlayerName = entry[1];
        } else if (entry[0] == "site") {
          Site = entry[1];
        } else if (entry[0] == "round") {
          Round = parseInt(entry[1]);
          if (isNaN(Round)) {
            console.warn(
              `At line ${i + 1} section ${j + 1} of EPD file: Syntax Error: Round must be a number.`,
            );
            continue;
          }
        } else if (entry[0] == "termination") {
          Termination = entry[1];
        } else if (entry[0] == "first_player_elo") {
          FirstPlayerElo = parseInt(entry[1]);
          if (isNaN(FirstPlayerElo)) {
            console.warn(
              `At line ${i + 1} section ${j + 1} of EPD file: Syntax Error: Arpard Elo Rating score must be a number.`,
            );
            continue;
          }
        } else if (entry[0] == "second_player_elo") {
          SecondPlayerElo = parseInt(entry[1]);
          if (isNaN(SecondPlayerElo)) {
            console.warn(
              `At line ${i + 1} section ${j + 1} of EPD file: Syntax Error: Arpard Elo Rating score must be a number.`,
            );
            continue;
          }
        }
      }
      CurrentGame++;
      if (Variant == "") {
        Variant = "chess";
      } else if (Variant.endsWith("960")) {
        Variant = Variant.slice(0, -3);
        IsFischerRandom = true;
      }
      if (
        this.FFishJSLibrary.variants().split(" ").includes(Variant) &&
        this.FFishJSLibrary.validateFen(FEN, Variant, IsFischerRandom) >= 0
      ) {
        this.GameList.push(
          new Game(
            Variant,
            FEN == "" ? this.FFishJSLibrary.startingFen(Variant) : FEN,
            "",
            Result,
            GameEvent,
            Site,
            GameDate,
            Round,
            FirstPlayerName,
            SecondPlayerName,
            FirstPlayerElo,
            SecondPlayerElo,
            BestMove,
            SuppliedMove,
            Evaluation,
            Termination,
            IsFischerRandom,
          ),
        );
      } else {
        let variantlist = this.FFishJSLibrary.variants().split(" ");
        if (variantlist.includes(Variant)) {
          console.error(
            `At line ${i + 1} of EPD file: Value Error: Invalid FEN.`,
          );
          NotLoadedGameCount++;
          continue;
        } else {
          console.error(
            `At line ${i + 1} of EPD file: Reference Error: Variant "${Variant}" is not defined.`,
          );
          if (!variantlist.includes("chess")) {
            console.error("FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!");
            window.alert("ERROR: FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!");
            throw Error("FFISH.JS CRASH!!! RELOAD PAGE TO FIX THIS!!!");
          }
          NotLoadedGameCount++;
          continue;
        }
      }
    }
    return NotLoadedGameCount;
  }

  AppendToGameList(GameList) {
    if (!Array.isArray(GameList)) {
      throw TypeError();
    }
    this.GameList.forEach((val) => {
      GameList.push(val);
    });
  }
}

window.fairyground.SavedGamesParsingFeature.ExtendedPositionDescription =
  ExtendedPositionDescription;

class GameDisplayTable {
  constructor(GlobalGameList) {
    if (!Array.isArray(GlobalGameList)) {
      throw TypeError();
    }
    this.Table = document.createElement("table");
    this.Table.style.border = "2px double black";
    this.Caption = document.createElement("caption");
    this.Caption.innerText = "Total Games: 0 ┇ Games Shown: 0";
    this.Caption.style.borderTop = "2px double black";
    this.Caption.style.borderLeft = "2px double black";
    this.Caption.style.borderRight = "2px double black";
    this.Table.appendChild(this.Caption);
    this.GameList = [];
    this.GlobalGameList = GlobalGameList;
    this.InitializeTable();
  }

  InitializeTable() {
    while (this.Table.childNodes.length > 0) {
      this.Table.childNodes[0].remove();
    }
    this.GameList = [];
    this.Caption = document.createElement("caption");
    this.Caption.innerText = "Total Games: 0 ┇ Games Shown: 0";
    this.Caption.style.borderTop = "2px double black";
    this.Caption.style.borderLeft = "2px double black";
    this.Caption.style.borderRight = "2px double black";
    this.Table.appendChild(this.Caption);
    let header = document.createElement("tr");
    let headerentry = document.createElement("th");
    headerentry.innerText = "Variant";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Event";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Site";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Date";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Round";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Result";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "First Player";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Elo";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Second Player";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Elo";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Best Move";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Supplied Move";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Evaluation";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Termination";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    headerentry = document.createElement("th");
    headerentry.innerText = "Actions";
    headerentry.style.fontWeight = "bold";
    headerentry.style.border = "1px solid black";
    header.appendChild(headerentry);
    this.Table.appendChild(header);
  }

  RemoveRow(GameObject) {
    if (!Game.prototype.isPrototypeOf(GameObject)) {
      throw TypeError();
    }
    let index = this.GameList.indexOf(GameObject);
    if (index < 0) {
      return false;
    }
    this.GameList.splice(index, 1);
    this.Table.childNodes[index + 2].remove();
    index = this.GlobalGameList.indexOf(GameObject);
    if (index < 0) {
      return false;
    }
    this.GlobalGameList.splice(index, 1);
    this.Caption.textContent = `Total Games: ${this.GlobalGameList.length} ┇ Games Shown: ${this.GameList.length}`;
    return true;
  }

  AddRow(GameObject) {
    if (!(GameObject instanceof Game)) {
      throw TypeError();
    }
    let row = document.createElement("tr");
    let entry = document.createElement("td");
    entry.innerText = GameObject.Variant;
    if (GameObject.Is960) {
      entry.innerText += " (Fischer Random)";
    }
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.Event;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.Site;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.GameDate.toDateString();
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.Round.toString();
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.Result;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.FirstPlayerName;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.FirstPlayerElo;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.SecondPlayerName;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.SecondPlayerElo;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.BestMove;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.SuppliedMove;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.Evaluation.toFixed(2);
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.innerText = GameObject.Termination;
    entry.style.border = "1px solid black";
    row.appendChild(entry);
    entry = document.createElement("td");
    entry.style.border = "1px solid black";
    let applypos = document.createElement("button");
    let applypostext = document.createTextNode("Set Position");
    applypos.appendChild(applypostext);
    applypos.onclick = function () {
      if (
        SetPosition(
          GameObject.FEN,
          GameObject.UCIMoves.join(" "),
          GameObject.Variant,
          GameObject.Is960,
        )
      ) {
        document.getElementById("pgnepd-close").click();
      }
    };
    let removepos = document.createElement("button");
    let removepostext = document.createTextNode("Remove");
    removepos.appendChild(removepostext);
    removepos.onclick = () => {
      this.RemoveRow(GameObject);
    };
    entry.appendChild(applypos);
    entry.appendChild(removepos);
    row.appendChild(entry);
    this.Table.appendChild(row);
    this.GameList.push(GameObject);
    this.Caption.textContent = `Total Games: ${this.GlobalGameList.length} ┇ Games Shown: ${this.GameList.length}`;
  }

  AddRows(GameList) {
    if (!Array.isArray(GameList)) {
      throw TypeError();
    }
    GameList.forEach((val) => {
      this.AddRow(val);
    });
    this.Caption.textContent = `Total Games: ${this.GlobalGameList.length} ┇ Games Shown: ${this.GameList.length}`;
  }

  SearchEntryAndDisplay(Target, Value, IsRegularExpression) {
    if (
      typeof Target != "string" ||
      typeof Value != "string" ||
      typeof IsRegularExpression != "boolean"
    ) {
      throw TypeError();
    }
    let result = [];
    function GenerateRegExp(expstr) {
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
            'There is a syntax error in the regular expression. The syntax is /<search items...>/<flags...>. You can google "regular expression" to get more informaion.',
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
    if (IsRegularExpression) {
      let regexp = GenerateRegExp(Value);
      if (regexp == null) {
        return null;
      }
      if (Target == "Variant") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.Variant)) {
            result.push(val);
          }
        });
      } else if (Target == "Event") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.Event)) {
            result.push(val);
          }
        });
      } else if (Target == "Site") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.Site)) {
            result.push(val);
          }
        });
      } else if (Target == "Round") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.Round.toString())) {
            result.push(val);
          }
        });
      } else if (Target == "Result") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.Result)) {
            result.push(val);
          }
        });
      } else if (Target == "Date") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.GameDate.toDateString())) {
            result.push(val);
          }
        });
      } else if (Target == "First Player") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.FirstPlayerName)) {
            result.push(val);
          }
        });
      } else if (Target == "Second Player") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.SecondPlayerName)) {
            result.push(val);
          }
        });
      } else if (Target == "First Player Elo") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.FirstPlayerElo.toString())) {
            result.push(val);
          }
        });
      } else if (Target == "Second Player Elo") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.SecondPlayerElo.toString())) {
            result.push(val);
          }
        });
      } else if (Target == "Termination") {
        this.GameList.forEach((val) => {
          if (regexp.test(val.Termination)) {
            result.push(val);
          }
        });
      }
    } else {
      if (Target == "Variant") {
        this.GameList.forEach((val) => {
          if (val.Variant.includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "Event") {
        this.GameList.forEach((val) => {
          if (val.Event.includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "Site") {
        this.GameList.forEach((val) => {
          if (val.Site.includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "Round") {
        this.GameList.forEach((val) => {
          if (val.Round.toString().includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "Result") {
        this.GameList.forEach((val) => {
          if (val.Result.includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "Date") {
        this.GameList.forEach((val) => {
          if (val.GameDate.toDateString().includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "First Player") {
        this.GameList.forEach((val) => {
          if (val.FirstPlayerName.includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "Second Player") {
        this.GameList.forEach((val) => {
          if (val.SecondPlayerName.includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "First Player Elo") {
        this.GameList.forEach((val) => {
          if (val.FirstPlayerElo.toString().includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "Second Player Elo") {
        this.GameList.forEach((val) => {
          if (val.SecondPlayerElo.toString().includes(Value)) {
            result.push(val);
          }
        });
      } else if (Target == "Termination") {
        this.GameList.forEach((val) => {
          if (val.Termination.includes(Value)) {
            result.push(val);
          }
        });
      }
    }
    this.InitializeTable();
    this.AddRows(result);
    return result;
  }
}

window.fairyground.SavedGamesParsingFeature.GameDisplayTable = GameDisplayTable;

function ShowPGNOrEPDFileUI(GameList, FFishJSLibrary) {
  if (!Array.isArray(GameList) || FFishJSLibrary == null) {
    throw TypeError();
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
  let table = new GameDisplayTable(GameList);
  table.AddRows(GameList);
  let popup = document.createElement("div");
  popup.id = "loadsavedgamespopup";
  let background = document.createElement("div");
  background.id = "loadsavedgamespopup-background";
  let title = document.createElement("p");
  title.id = "popup-title";
  title.innerHTML =
    "Portable Game Notation / Extended Position Description Parser";
  title.style.whiteSpace = "pre-line";
  title.style.fontSize = "40px";
  title.style.fontWeight = "bold";
  title.style.fontFamily = "Times New Roman";
  title.style.fontStyle = "italic";
  popup.appendChild(title);
  let operationdiv = document.createElement("div");
  let searchdiv = document.createElement("div");
  let gameshowdiv = document.createElement("div");
  operationdiv.style.display = "flex";
  searchdiv.style.display = "inline-flex";
  gameshowdiv.style.display = "block";
  operationdiv.style.marginBottom = "5px";
  searchdiv.style.marginBottom = "5px";
  let filetext = document.createElement("p");
  filetext.innerText = "Select PGN/EPD:";
  operationdiv.appendChild(filetext);
  let openfile = document.createElement("input");
  openfile.type = "file";
  openfile.onchange = function (event) {
    const selected = event.currentTarget.files[0];
    if (selected) {
      const name = selected.name;
      const size = selected.size;
      if (size > 1048576) {
        if (
          !window.confirm(
            `Warning: Provided file is very large (${(size / 1048576).toFixed(2)} MB). Fairyground is not designed to load large files (>1MB). Continuing loading can cause the page to hang for a long time. Proceed?`,
          )
        ) {
          return;
        }
      }
      let reader = new FileReader();
      reader.onload = function () {
        console.log(reader.result);
        if (name.endsWith(".pgn")) {
          let PGNObj = new PortableGameNotation(reader.result, FFishJSLibrary);
          PGNObj.AppendToGameList(GameList);
        } else if (name.endsWith(".epd")) {
          let EPDObj = new ExtendedPositionDescription(
            reader.result,
            FFishJSLibrary,
          );
          EPDObj.AppendToGameList(GameList);
        } else {
          window.alert(
            "Unsupported file extension. Supported file types are:\n*.pgn (Portable Game Notation)\n*.epd (Extended Position Description)",
          );
          return;
        }
        table.InitializeTable();
        table.AddRows(GameList);
      };
      reader.readAsText(selected);
    }
  };
  let cleargames = document.createElement("button");
  cleargames.classList.add("ripple");
  let cleargamestext = document.createTextNode("Clear List");
  cleargames.appendChild(cleargamestext);
  cleargames.onclick = function () {
    while (GameList.length > 0) {
      GameList.pop();
    }
    table.InitializeTable();
  };
  let addtolist = document.createElement("button");
  addtolist.classList.add("ripple");
  let addtolisttext = document.createTextNode("Add Current Game To List");
  addtolist.appendChild(addtolisttext);
  addtolist.onclick = function () {
    const info = GetCurrentGameInformation(FFishJSLibrary);
    if (info == null) {
      window.alert(
        "There are invalid FEN, moves or variant name in the current game.",
      );
      return;
    }
    let gameobj = new Game(
      info.Variant,
      info.FEN,
      info.UCIMoves,
      info.Result,
      info.Event,
      info.Site,
      info.Date,
      1,
      info.FirstPlayerName,
      info.SecondPlayerName,
      0,
      0,
      "0000",
      "0000",
      0.0,
      info.Termination,
      info.Is960,
    );
    GameList.push(gameobj);
    table.InitializeTable();
    table.AddRows(GameList);
  };
  let savetopgn = document.createElement("button");
  savetopgn.classList.add("ripple");
  let savetopgntext = document.createTextNode("Save PGN");
  savetopgn.appendChild(savetopgntext);
  savetopgn.onclick = function () {
    let filecontent = "";
    table.GameList.forEach((val) => {
      filecontent += `${val.ToPortableGameNotation(FFishJSLibrary)}\n`;
    });
    DownloadFile(filecontent, "PortableGameNotation.pgn", "text/plain");
  };
  let savetoepd = document.createElement("button");
  savetoepd.classList.add("ripple");
  let savetoepdtext = document.createTextNode("Save EPD");
  savetoepd.appendChild(savetoepdtext);
  savetoepd.onclick = function () {
    let filecontent = "";
    table.GameList.forEach((val) => {
      filecontent += `${val.ToExtendedPositionDescription(FFishJSLibrary)}\n`;
    });
    DownloadFile(filecontent, "ExtendedPositionDescription.epd", "text/plain");
  };
  let close = document.createElement("button");
  close.classList.add("ripple");
  close.id = "pgnepd-close";
  let closetext = document.createTextNode("Close");
  close.appendChild(closetext);
  close.onclick = function () {
    document.dispatchEvent(
      new CustomEvent("uilayoutchange", { detail: { message: null } }),
    );
    while (document.getElementById("loadsavedgamespopup-background") != null) {
      document.getElementById("loadsavedgamespopup-background").remove();
    }
    while (document.getElementById("loadsavedgamespopup") != null) {
      document.getElementById("loadsavedgamespopup").remove();
    }
  };
  operationdiv.appendChild(openfile);
  operationdiv.appendChild(addtolist);
  operationdiv.appendChild(cleargames);
  operationdiv.appendChild(savetopgn);
  operationdiv.appendChild(savetoepd);
  operationdiv.appendChild(close);
  let searchbox = document.createElement("input");
  searchbox.type = "text";
  searchbox.maxLength = 9999;
  searchbox.style.width = "400px";
  searchbox.placeholder = "Leave blank to display all games";
  searchbox.style.border = "1px solid #ddd";
  let searchtarget = document.createElement("select");
  let searchentry = document.createElement("option");
  searchentry.value = "Variant";
  searchentry.text = "Variant";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "Event";
  searchentry.text = "Event";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "Site";
  searchentry.text = "Site";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "Date";
  searchentry.text = "Date";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "Round";
  searchentry.text = "Round";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "Result";
  searchentry.text = "Result";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "First Player";
  searchentry.text = "First Player";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "First Player Elo";
  searchentry.text = "First Player Elo";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "Second Player";
  searchentry.text = "Second Player";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "Second Player Elo";
  searchentry.text = "Second Player Elo";
  searchtarget.appendChild(searchentry);
  searchentry = document.createElement("option");
  searchentry.value = "Termination";
  searchentry.text = "Termination";
  searchtarget.appendChild(searchentry);
  let isregexp = document.createElement("input");
  isregexp.type = "checkbox";
  isregexp.id = "pgnepd-isregexp";
  isregexp.checked = false;
  let isregexplabel = document.createElement("label");
  isregexplabel.appendChild(isregexp);
  isregexplabel.innerHTML += "Regular Expression";
  let searchonresult = document.createElement("input");
  searchonresult.type = "checkbox";
  searchonresult.id = "pgnepd-searchonresult";
  searchonresult.checked = false;
  let searchonresultlabel = document.createElement("label");
  searchonresultlabel.appendChild(searchonresult);
  searchonresultlabel.innerHTML += "Search In Current Results";
  let search = document.createElement("button");
  search.classList.add("ripple");
  let searchtext = document.createTextNode("Search");
  search.appendChild(searchtext);
  search.onclick = function () {
    if (searchbox.value == "") {
      table.InitializeTable();
      table.AddRows(GameList);
    } else {
      if (!document.getElementById("pgnepd-searchonresult").checked) {
        table.GameList = GameList.slice();
      }
      table.SearchEntryAndDisplay(
        searchtarget.value,
        searchbox.value,
        document.getElementById("pgnepd-isregexp").checked,
      );
    }
  };
  searchbox.onkeyup = function (event) {
    if (event.keyCode == 13) {
      search.click();
    }
  };
  searchdiv.appendChild(searchtarget);
  searchdiv.appendChild(searchbox);
  searchdiv.appendChild(isregexplabel);
  searchdiv.appendChild(searchonresultlabel);
  searchdiv.appendChild(search);
  gameshowdiv.appendChild(table.Table);
  popup.appendChild(operationdiv);
  popup.appendChild(searchdiv);
  popup.appendChild(gameshowdiv);
  popup.style.display = "block";
  popup.style.zIndex = "1002";
  background.style.display = "block";
  background.style.zIndex = "1001";
  document.body.appendChild(popup);
  document.body.appendChild(background);
  document.dispatchEvent(
    new CustomEvent("uilayoutchange", {
      detail: { message: "loadsavedgamespopup-background" },
    }),
  );
  document.dispatchEvent(new Event("initializeripples"));
}

window.fairyground.SavedGamesParsingFeature.ShowPGNOrEPDFileUI =
  ShowPGNOrEPDFileUI;

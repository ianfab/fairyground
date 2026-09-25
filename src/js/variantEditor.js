// Editor for variant definitions in the variants.ini format of
// Fairy-Stockfish: syntax highlighting, autocomplete and context help from
// the documented options, live diagnostics from the engine's "check" command
// and a preview of the movement of pieces defined in Betza notation.

import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import {
  StreamLanguage,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { linter, lintGutter, forceLinting } from "@codemirror/lint";
import { tags } from "@lezer/highlight";

const VARIANT_OPTIONS = require("./variantoptions.json");

const OPTIONS_BY_KEY = new Map(
  VARIANT_OPTIONS.options.map((option) => [option.key, option]),
);

export const variantOptions = VARIANT_OPTIONS;

export function getOption(key) {
  return OPTIONS_BY_KEY.get(key);
}

// ------------------------------------------------------------------
// Parsing
// ------------------------------------------------------------------

const SECTION = /^\s*\[([^\]:]*)(?::([^\]]*))?\]\s*$/;
const KEY_VALUE = /^(\s*)([^=#;\s][^=]*?)\s*=\s*(.*?)\s*$/;
const COMMENT = /^\s*[#;]/;

// Returns the sections of a variants.ini with their options. Line numbers
// are 1-based. Options before the first section are listed in "stray".
export function parseIni(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  const stray = [];
  let current = null;
  lines.forEach((line, index) => {
    const number = index + 1;
    if (COMMENT.test(line) || line.trim() == "") {
      return;
    }
    const section = line.match(SECTION);
    if (section) {
      current = {
        name: section[1].trim(),
        parent: section[2] === undefined ? null : section[2].trim(),
        line: number,
        endLine: number,
        options: [],
      };
      sections.push(current);
      return;
    }
    const keyvalue = line.match(KEY_VALUE);
    const option = keyvalue
      ? { key: keyvalue[2], value: keyvalue[3], line: number }
      : { key: null, value: line.trim(), line: number };
    if (current) {
      current.options.push(option);
      current.endLine = number;
    } else {
      stray.push(option);
    }
  });
  return { sections, stray };
}

// Renames the sections with the given function. References to renamed
// sections as template ([child:parent]) within the same text are renamed
// along with them.
export function renameSections(text, rename) {
  const names = new Map();
  parseIni(text).sections.forEach((section) => {
    if (!names.has(section.name)) {
      names.set(section.name, rename(section.name));
    }
  });
  return text
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(SECTION);
      if (!match) {
        return line;
      }
      const name = names.get(match[1].trim()) || match[1].trim();
      if (match[2] === undefined) {
        return `[${name}]`;
      }
      const parent = match[2].trim();
      return `[${name}:${names.get(parent) || parent}]`;
    })
    .join("\n");
}

// Returns the text of each section, from its header to the line before the
// next header (comments directly above a header belong to that header).
export function sectionTexts(text) {
  const lines = text.split(/\r?\n/);
  const { sections } = parseIni(text);
  return sections.map((section, index) => {
    let start = section.line - 1;
    while (start > 0 && COMMENT.test(lines[start - 1])) {
      start--;
    }
    const next = sections[index + 1];
    let end = next ? next.line - 1 : lines.length;
    if (next) {
      while (end > start + 1 && COMMENT.test(lines[end - 1])) {
        end--;
      }
    }
    const body = lines.slice(start, end);
    while (body.length > 0 && body[body.length - 1].trim() == "") {
      body.pop();
    }
    return { name: section.name, text: body.join("\n") };
  });
}

// Letters and digits Fairy-Stockfish understands in Betza notation. The
// engine silently ignores other characters.
const BETZA_ATOMS = "WFDNAHLCJZGKRBQ";
const BETZA_MODIFIERS = "mcpgnifbvhrlse";

export function betzaProblems(betza) {
  const problems = [];
  if (betza.trim() == "") {
    problems.push("Missing Betza move notation.");
    return problems;
  }
  const unknown = [...new Set(betza)].filter(
    (c) =>
      !BETZA_ATOMS.includes(c) &&
      !BETZA_MODIFIERS.includes(c) &&
      !/[0-9]/.test(c),
  );
  if (unknown.length > 0) {
    problems.push(
      `Unsupported Betza character${unknown.length > 1 ? "s" : ""} ${unknown.join(" ")} (ignored by the engine).`,
    );
  }
  if (![...betza].some((c) => BETZA_ATOMS.includes(c))) {
    problems.push(
      "No move atom (e.g., W, F, N, R, B, Q) in the Betza notation.",
    );
  }
  return problems;
}

// The Betza notation of a piece definition such as "customPiece1 = a:mRcB",
// "king = k:KN" or "knight = n" (predefined movement).
export function pieceBetza(key, value) {
  if (/^customPiece\d+$/.test(key) || key == "king") {
    const colon = value.indexOf(":");
    if (colon >= 0) {
      return value.slice(colon + 1).trim();
    }
    if (key == "king") {
      return "K";
    }
    return "";
  }
  const option = OPTIONS_BY_KEY.get(key);
  if (option && option.betza !== undefined && value.trim() != "-") {
    return option.betza;
  }
  return null;
}

// ------------------------------------------------------------------
// Diagnostics
// ------------------------------------------------------------------

const CHECK_PREFIX = "fgcheck-";

// Prepares a text for the engine's "check" command. The engine only checks
// variants whose name is not loaded yet, so the sections are checked under
// temporary names.
export function textForCheck(text) {
  return renameSections(text, (name) => CHECK_PREFIX + name);
}

// Maps the output of the engine's "check" command to lines of the text.
export function mapCheckOutput(text, output) {
  const { sections } = parseIni(text);
  const diagnostics = [];
  let current = null;
  let searchfrom = 0;
  // The line of an option. If it is set more than once, the value named in
  // the message or else the last value (which is the one in effect).
  const optionLine = (section, key, message) => {
    const options = section.options.filter((o) => o.key == key);
    if (options.length == 0) {
      return null;
    }
    const named = message
      ? options.filter((o) => o.value != "" && message.includes(o.value))
      : [];
    return (named.length > 0 ? named : options).pop().line;
  };
  output.forEach((raw) => {
    const message = raw.split(CHECK_PREFIX).join("").trim();
    if (message == "") {
      return;
    }
    const parsing = message.match(/^Parsing variant: (.*)$/);
    if (parsing) {
      const index = sections.findIndex(
        (s, i) => i >= searchfrom && s.name == parsing[1],
      );
      if (index >= 0) {
        current = sections[index];
        searchfrom = index + 1;
      }
      return;
    }
    const template = message.match(/^Variant template '(.*)' does not exist/);
    if (template) {
      const index = sections.findIndex(
        (s, i) => i >= searchfrom && s.parent == template[1],
      );
      if (index >= 0) {
        diagnostics.push({
          line: sections[index].line,
          severity: "error",
          message: `Unknown template variant '${template[1]}'.`,
        });
        current = null;
        searchfrom = index + 1;
      }
      return;
    }
    // Existing names are checked by the UI and lines without "=" by
    // staticDiagnostics(), which knows the line.
    if (/already exists\.$|^Invalid syntax: /.test(message)) {
      return;
    }
    const severity =
      /Deprecated|Missing piece type|Ambiguous/.test(message) ||
      /^pieceToCharTable/.test(message)
        ? "warning"
        : "error";
    let line = null;
    const keyed = message.match(/^([A-Za-z][A-Za-z0-9]*) - (.*)$/);
    const invalid = message.match(/^Invalid option: (.*)$/);
    if (current) {
      if (keyed) {
        line = optionLine(current, keyed[1], keyed[2]);
      } else if (invalid) {
        line = optionLine(current, invalid[1]);
      } else if (/number of ranks|number of files/.test(message)) {
        line =
          optionLine(current, "startFen") ||
          optionLine(current, /ranks/.test(message) ? "maxRank" : "maxFile");
      } else {
        // Point to the first option of the section the message mentions.
        const mentioned = current.options.find(
          (o) => o.key && new RegExp(`\\b${o.key}\\b`).test(message),
        );
        line = mentioned ? mentioned.line : null;
      }
    }
    diagnostics.push({
      line: line || (current ? current.line : 1),
      severity,
      message:
        keyed && line
          ? keyed[2]
          : keyed && current
            ? `${message} (inherited)`
            : message,
    });
  });
  return diagnostics;
}

// Diagnostics that do not need the engine.
export function staticDiagnostics(text, nameProblem) {
  const { sections, stray } = parseIni(text);
  const diagnostics = [];
  stray.forEach((option) => {
    diagnostics.push({
      line: option.line,
      severity: "error",
      message:
        "Options must be inside a variant section, e.g., [myvariant:chess].",
    });
  });
  const seen = new Set();
  sections.forEach((section) => {
    if (section.name == "") {
      diagnostics.push({
        line: section.line,
        severity: "error",
        message: "Missing variant name.",
      });
    } else if (/\s/.test(section.name)) {
      diagnostics.push({
        line: section.line,
        severity: "error",
        message: "Variant names must not contain spaces.",
      });
    } else if (seen.has(section.name)) {
      diagnostics.push({
        line: section.line,
        severity: "error",
        message: `Variant ${section.name} is defined twice.`,
      });
    } else if (nameProblem) {
      const problem = nameProblem(section.name);
      if (problem) {
        diagnostics.push({
          line: section.line,
          severity: "warning",
          message: problem,
        });
      }
    }
    seen.add(section.name);
    const keys = new Set();
    section.options.forEach((option) => {
      if (option.key === null) {
        diagnostics.push({
          line: option.line,
          severity: "error",
          message: "Expected an option of the form key = value.",
        });
        return;
      }
      if (keys.has(option.key)) {
        diagnostics.push({
          line: option.line,
          severity: "warning",
          message: `${option.key} is set more than once in this variant.`,
        });
      }
      keys.add(option.key);
      if (/^customPiece\d+$/.test(option.key) || option.key == "king") {
        const betza = pieceBetza(option.key, option.value);
        if (option.key == "king" && !option.value.includes(":")) {
          return;
        }
        betzaProblems(betza).forEach((problem) =>
          diagnostics.push({
            line: option.line,
            severity: "warning",
            message: problem,
          }),
        );
      }
    });
  });
  return diagnostics;
}

// ------------------------------------------------------------------
// Betza preview
// ------------------------------------------------------------------

const PREVIEW_SIZE = 9;
const PREVIEW_FILES = "abcdefghi";
const previewCache = new Map();
let previewCounter = 0;

function previewFen(pieces) {
  const rows = [];
  for (let rank = PREVIEW_SIZE; rank >= 1; rank--) {
    let row = "";
    let empty = 0;
    for (let file = 0; file < PREVIEW_SIZE; file++) {
      const piece = pieces.get(PREVIEW_FILES[file] + rank);
      if (piece) {
        row += (empty > 0 ? empty : "") + piece;
        empty = 0;
      } else {
        empty++;
      }
    }
    rows.push(row + (empty > 0 ? empty : ""));
  }
  return rows.join("/") + " w - - 0 1";
}

// Computes where a white piece with the given Betza notation can move from
// the center of an empty 9x9 board, and where it can capture. Hopping moves
// are computed with a screen piece next to the piece. Returns null if the
// notation cannot be loaded.
export function betzaPreview(ffish, betza) {
  if (previewCache.has(betza)) {
    return previewCache.get(betza);
  }
  const id = `fgbetzapreview${previewCounter++}`;
  ffish.loadVariantConfig(
    `[${id}:fairy]\nmaxRank = ${PREVIEW_SIZE}\nmaxFile = ${PREVIEW_FILES[PREVIEW_SIZE - 1]}\n` +
      `king = -\npawn = p\ncustomPiece1 = a:${betza}\n` +
      `startFen = ${previewFen(new Map([["e5", "A"]]))}\n`,
  );
  if (!ffish.variants().split(" ").includes(id)) {
    previewCache.set(betza, null);
    return null;
  }
  const center = "e5";
  const movesFrom = (pieces) => {
    const board = new ffish.Board(id, previewFen(pieces));
    const moves = board
      .legalMoves()
      .split(" ")
      .filter((move) => move.startsWith(center))
      .map((move) => move.slice(2, 4).replace(/[^a-z0-9]/g, ""));
    board.delete();
    return new Set(moves);
  };
  const hopper = /[pg]/.test(betza);
  // Squares by their distance (in king steps) from the piece.
  const rings = [];
  for (let rank = 1; rank <= PREVIEW_SIZE; rank++) {
    for (let file = 0; file < PREVIEW_SIZE; file++) {
      const distance = Math.max(Math.abs(file - 4), Math.abs(rank - 5));
      if (distance > 0) {
        (rings[distance] = rings[distance] || []).push(
          PREVIEW_FILES[file] + rank,
        );
      }
    }
  }
  const withPieces = (squares) =>
    new Map([[center, "A"]].concat(squares.map((sq) => [sq, "p"])));
  // Moves to the given squares, with opponent pieces on them and on the
  // other given squares.
  const movesTo = (squares, others) =>
    [...movesFrom(withPieces(squares.concat(others || [])))].filter((sq) =>
      squares.includes(sq),
    );
  const quiet = movesFrom(withPieces([]));
  // Captures at a distance, with opponent pieces on all squares at that
  // distance. The squares in between are empty, so this finds the same
  // captures as testing each square on its own, with far fewer positions.
  const capture = new Set();
  for (let distance = 1; distance < rings.length; distance++) {
    movesTo(rings[distance]).forEach((sq) => capture.add(sq));
  }
  // Hopping moves, with screens on all squares next to the piece.
  const hop = new Set();
  if (hopper) {
    const beyond = rings.slice(2).flat();
    [...movesFrom(withPieces(rings[1]))]
      .filter((sq) => beyond.includes(sq) && !quiet.has(sq))
      .forEach((sq) => {
        quiet.add(sq);
        hop.add(sq);
      });
    for (let distance = 2; distance < rings.length; distance++) {
      movesTo(rings[distance], rings[1])
        .filter((sq) => !capture.has(sq))
        .forEach((sq) => {
          capture.add(sq);
          hop.add(sq);
        });
    }
  }
  const result = {
    size: PREVIEW_SIZE,
    files: PREVIEW_FILES,
    center,
    quiet,
    capture,
    hop,
    initial: betza.includes("i"),
  };
  previewCache.set(betza, result);
  return result;
}

// ------------------------------------------------------------------
// Editor
// ------------------------------------------------------------------

const iniLanguage = StreamLanguage.define({
  name: "variantsini",
  startState: () => ({ value: false }),
  token(stream, state) {
    if (stream.sol()) {
      state.value = false;
      stream.eatSpace();
      if (stream.peek() == "#" || stream.peek() == ";") {
        stream.skipToEnd();
        return "comment";
      }
      if (stream.peek() == "[") {
        stream.skipToEnd();
        return "heading";
      }
    }
    if (stream.eatSpace()) {
      return null;
    }
    if (!state.value) {
      if (stream.eat("=")) {
        state.value = true;
        return "operator";
      }
      stream.eatWhile((c) => c != "=" && c != " " && c != "\t");
      return "propertyName";
    }
    if (stream.match(/^(true|false)\b/)) {
      return "bool";
    }
    if (stream.match(/^-?\d+\b/)) {
      return "number";
    }
    stream.eatWhile((c) => c != " " && c != "\t");
    return "string";
  },
  tokenTable: {},
});

const iniHighlight = HighlightStyle.define([
  { tag: tags.comment, color: "var(--muted)", fontStyle: "italic" },
  { tag: tags.heading, color: "var(--accent)", fontWeight: "700" },
  { tag: tags.propertyName, color: "var(--text)", fontWeight: "600" },
  { tag: tags.operator, color: "var(--muted)" },
  { tag: tags.bool, color: "var(--warn)" },
  { tag: tags.number, color: "var(--good)" },
  { tag: tags.string, color: "var(--accent-hover)" },
]);

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--r)",
    fontSize: "12.5px",
  },
  "&.cm-focused": {
    outline: "2px solid var(--accent)",
    outlineOffset: "1px",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.5",
  },
  ".cm-content": { caretColor: "var(--text)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--text)" },
  ".cm-gutters": {
    backgroundColor: "var(--surface2)",
    color: "var(--faint)",
    border: "none",
    borderRadius: "var(--r) 0 0 var(--r)",
  },
  ".cm-activeLine": { backgroundColor: "rgba(127, 127, 127, 0.08)" },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(127, 127, 127, 0.12)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    { backgroundColor: "var(--accent-soft2)" },
  ".cm-tooltip": {
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border2)",
    borderRadius: "8px",
    boxShadow: "var(--shadow)",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily: "var(--font-mono)",
    maxHeight: "16em",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-ink)",
  },
  ".cm-completionDetail": { color: "var(--muted)", fontStyle: "normal" },
  ".cm-completionInfo": {
    maxWidth: "320px",
    padding: "6px 10px",
    fontFamily: "var(--font-ui)",
    whiteSpace: "normal",
  },
  ".cm-diagnostic": { fontFamily: "var(--font-ui)" },
  ".cm-panels": {
    backgroundColor: "var(--surface2)",
    color: "var(--text)",
  },
  ".cm-panels input, .cm-panels button": {
    height: "auto",
  },
});

function optionInfo(option) {
  const parts = [option.description];
  if (option.type) {
    parts.push(`Type: ${option.type}`);
  }
  if (option.values) {
    parts.push(`Values: ${option.values.join(", ")}`);
  }
  if (option.default !== null && option.default !== "") {
    parts.push(`Default: ${option.default}`);
  }
  return parts.join("\n");
}

function valueCompletions(option) {
  if (!option) {
    return [];
  }
  let values = option.values;
  const type = option.type ? VARIANT_OPTIONS.types[option.type] : null;
  if (!values && type && type.values) {
    values = type.values;
  }
  if (!values && option.type == "File") {
    values = "abcdefghijkl".split("");
  }
  if (!values && option.type == "Rank") {
    values = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  }
  if (!values) {
    return option.default ? [option.default] : [];
  }
  if (option.default && !values.includes(option.default)) {
    values = values.concat([option.default]);
  }
  return values;
}

// The section, option and part of the line at a position.
function contextAt(state, pos) {
  const line = state.doc.lineAt(pos);
  const text = line.text;
  const column = pos - line.from;
  const upto = text.slice(0, column);
  let section = null;
  for (let n = line.number - 1; n >= 1; n--) {
    const match = state.doc.line(n).text.match(SECTION);
    if (match) {
      section = {
        name: match[1].trim(),
        parent: match[2] === undefined ? null : match[2].trim(),
        line: n,
      };
      break;
    }
  }
  const keyvalue = text.match(KEY_VALUE);
  return {
    line,
    column,
    upto,
    section,
    header: SECTION.test(text) ? text.match(SECTION) : null,
    key: keyvalue ? keyvalue[2] : null,
    value: keyvalue ? keyvalue[3] : null,
    inValue: upto.includes("="),
    comment: COMMENT.test(text),
  };
}

export function createVariantEditor(config) {
  const {
    parent,
    doc,
    onChange,
    onContext,
    onDiagnostics,
    runCheck,
    nameProblem,
    variantNames,
    onRun,
  } = config;

  const complete = (context) => {
    const ctx = contextAt(context.state, context.pos);
    if (ctx.comment) {
      return null;
    }
    // Template of a section header: [name:templ|
    const template = ctx.upto.match(/^\s*\[[^\]:]*:([^\]]*)$/);
    if (template) {
      const names = new Set(variantNames ? variantNames() : []);
      parseIni(context.state.doc.toString()).sections.forEach((s) => {
        if (s.line < ctx.line.number) {
          names.add(s.name);
        }
      });
      return {
        from: context.pos - template[1].length,
        options: [...names].sort().map((name) => ({
          label: name,
          type: "class",
        })),
        validFor: /^[\w-]*$/,
      };
    }
    if (ctx.header || !ctx.section) {
      return null;
    }
    if (!ctx.inValue) {
      const word = ctx.upto.match(/^\s*([A-Za-z0-9]*)$/);
      if (!word || (word[1] == "" && !context.explicit)) {
        return null;
      }
      const used = new Set(
        parseIni(context.state.doc.toString())
          .sections.filter((s) => s.line == ctx.section.line)
          .flatMap((s) => s.options.map((o) => o.key)),
      );
      return {
        from: context.pos - word[1].length,
        options: VARIANT_OPTIONS.options.map((option) => ({
          label: option.key,
          detail: option.type || (option.values ? "choice" : ""),
          info: optionInfo(option),
          type: option.group == "Pieces" ? "class" : "property",
          boost: used.has(option.key) ? -10 : 0,
          apply: (view, completion, from, to) => {
            const rest = view.state.doc.sliceString(
              to,
              view.state.doc.lineAt(to).to,
            );
            const insert = rest.trim().startsWith("=")
              ? option.key
              : `${option.key} = `;
            view.dispatch({
              changes: { from, to, insert },
              selection: { anchor: from + insert.length },
            });
            if (insert.endsWith("= ") && valueCompletions(option).length) {
              window.setTimeout(() => startCompletion(view), 0);
            }
          },
        })),
        validFor: /^[A-Za-z0-9]*$/,
      };
    }
    const option = OPTIONS_BY_KEY.get(ctx.key);
    const values = valueCompletions(option);
    if (values.length == 0) {
      return null;
    }
    const value = ctx.upto.match(/=\s*(\S*)$/);
    if (!value) {
      return null;
    }
    return {
      from: context.pos - value[1].length,
      options: values.map((v) => ({
        label: v,
        type: "constant",
        detail: v == option.default ? "default" : "",
      })),
      validFor: /^\S*$/,
    };
  };

  const lint = async (view) => {
    const text = view.state.doc.toString();
    let diagnostics = staticDiagnostics(text, nameProblem);
    if (runCheck && parseIni(text).sections.length > 0) {
      const output = await runCheck(textForCheck(text));
      if (view.state.doc.toString() != text) {
        return [];
      }
      if (output) {
        diagnostics = diagnostics.concat(mapCheckOutput(text, output));
      }
    }
    if (onDiagnostics) {
      onDiagnostics(diagnostics);
    }
    return diagnostics.map((d) => {
      const line = view.state.doc.line(
        Math.min(Math.max(d.line, 1), view.state.doc.lines),
      );
      const keyvalue = line.text.match(KEY_VALUE);
      let from = line.from;
      let to = line.to;
      if (keyvalue && !SECTION.test(line.text)) {
        from = line.from + keyvalue[1].length;
      }
      if (to == from) {
        to = Math.min(from + 1, view.state.doc.length);
      }
      return { from, to, severity: d.severity, message: d.message };
    });
  };

  let lastContext = "";
  const reportContext = (state) => {
    if (!onContext) {
      return;
    }
    const ctx = contextAt(state, state.selection.main.head);
    const key = [
      ctx.section ? ctx.section.name : "",
      ctx.key,
      ctx.value,
      ctx.line.number,
    ].join("\u0000");
    if (key == lastContext) {
      return;
    }
    lastContext = key;
    onContext({
      section: ctx.section,
      key: ctx.key,
      value: ctx.value,
      option: ctx.key ? OPTIONS_BY_KEY.get(ctx.key) || null : null,
      betza: ctx.key ? pieceBetza(ctx.key, ctx.value || "") : null,
      line: ctx.line.number,
    });
  };

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              if (onRun) {
                onRun();
              }
              return true;
            },
          },
        ]),
        basicSetup,
        iniLanguage,
        syntaxHighlighting(iniHighlight),
        editorTheme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          "aria-label": "Variant definition in variants.ini format",
          spellcheck: "false",
          autocapitalize: "off",
          autocorrect: "off",
        }),
        autocompletion({ override: [complete], icons: false }),
        linter(lint, { delay: 500 }),
        lintGutter(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
          if (update.docChanged || update.selectionSet) {
            reportContext(update.state);
          }
        }),
      ],
    }),
  });
  reportContext(view.state);

  return {
    view,
    getText: () => view.state.doc.toString(),
    setText(text) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
        selection: { anchor: 0 },
      });
    },
    focus: () => view.focus(),
    relint: () => forceLinting(view),
    // The section at the cursor, or null.
    currentSection() {
      const ctx = contextAt(view.state, view.state.selection.main.head);
      if (ctx.header) {
        return ctx.header[1].trim();
      }
      return ctx.section ? ctx.section.name : null;
    },
    // Moves the cursor to a line.
    goToLine(number) {
      const line = view.state.doc.line(
        Math.min(Math.max(number, 1), view.state.doc.lines),
      );
      view.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true,
      });
      view.focus();
    },
    // Adds an option to the section at the cursor (or the last section),
    // or selects its value if the section already sets it. Returns false if
    // there is no section.
    insertOption(key, value) {
      const state = view.state;
      const { sections } = parseIni(state.doc.toString());
      if (sections.length == 0) {
        return false;
      }
      const cursorline = state.doc.lineAt(state.selection.main.head).number;
      let section = sections[sections.length - 1];
      sections.forEach((s) => {
        if (s.line <= cursorline) {
          section = s;
        }
      });
      const existing = section.options.find((o) => o.key == key);
      if (existing) {
        const line = state.doc.line(existing.line);
        const eq = line.text.indexOf("=");
        const valuestart = line.from + eq + 1 + (line.text[eq + 1] == " ");
        view.dispatch({
          selection: { anchor: valuestart, head: line.to },
          scrollIntoView: true,
        });
      } else {
        const after = state.doc.line(section.endLine);
        const insert = `\n${key} = ${value}`;
        view.dispatch({
          changes: { from: after.to, insert },
          selection: {
            anchor: after.to + insert.length - value.length,
            head: after.to + insert.length,
          },
          scrollIntoView: true,
        });
      }
      view.focus();
      return true;
    },
    destroy: () => view.destroy(),
  };
}

// This module is bundled separately (lib/varianteditor.js) and loaded by the
// UI when the variant editor is opened.
if (typeof window != "undefined" && window.fairyground) {
  window.fairyground.VariantEditor = {
    createVariantEditor,
    variantOptions,
    getOption,
    parseIni,
    renameSections,
    sectionTexts,
    betzaPreview,
  };
}

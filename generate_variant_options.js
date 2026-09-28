/*
 * Generates src/js/variantoptions.json, the option reference used by the
 * variant editor (autocomplete, option search, context help), from the
 * documentation in the header of Fairy-Stockfish's variants.ini.
 *
 * Usage: node generate_variant_options.js [path or URL of variants.ini]
 *
 * By default the variants.ini of the Fairy-Stockfish version bundled in
 * fairy-stockfish-nnue.wasm is used, so that the documented options match
 * the engine. Update DEFAULT_SOURCE when updating that package.
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_SOURCE =
  "https://raw.githubusercontent.com/ianfab/fairy-stockfish.wasm/b2e693ef1e111233ce3fb40685921708b3276ed6/src/variants.ini";
const OUTPUT = path.join(__dirname, "src", "js", "variantoptions.json");
const CUSTOM_PIECE_SLOTS = 25;

async function readSource(source) {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Cannot download ${source}: HTTP ${response.status}`);
    }
    return await response.text();
  }
  return fs.readFileSync(source, "utf8");
}

// Splits the comment header into its "### Title" sections.
function headerSections(text) {
  const sections = new Map();
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("### ")) {
      current = line.slice(4).replace(/:$/, "").trim();
      sections.set(current, []);
    } else if (line.startsWith("#####")) {
      current = null;
    } else if (current && line.startsWith("#")) {
      sections.get(current).push(line.replace(/^# ?/, ""));
    } else if (current && line.trim() == "") {
      current = null;
    }
  }
  return sections;
}

// Parses "key: description [Type] (default: value)" entries, including
// descriptions continued on indented lines.
function parseOptions(lines, group) {
  const options = [];
  for (const line of lines) {
    const entry = line.match(/^([A-Za-z][A-Za-z0-9]*): (.*)$/);
    if (entry) {
      options.push({ key: entry[1], text: entry[2].trim(), group });
    } else if (/^\s{2,}\S/.test(line) && options.length > 0) {
      options[options.length - 1].text += " " + line.trim();
    }
  }
  let previous = null;
  return options.map((option) => {
    // A description of '"' repeats the previous option.
    if (option.text == '"' && previous) {
      return { ...previous, key: option.key };
    }
    let text = option.text;
    let defaultValue = null;
    const defaultMatch = text.match(/\s*\(default: ?([^)]*)\)/);
    if (defaultMatch) {
      defaultValue = defaultMatch[1].trim();
      text =
        text.slice(0, defaultMatch.index) +
        text.slice(defaultMatch.index + defaultMatch[0].length);
    }
    let type = null;
    let values = null;
    const typeMatch = text.match(/\s*\[([^\]]*)\]/);
    if (typeMatch) {
      if (typeMatch[1].startsWith("values:")) {
        values = typeMatch[1]
          .slice(7)
          .split(",")
          .map((value) => value.trim());
      } else {
        type = typeMatch[1].trim();
      }
      text =
        text.slice(0, typeMatch.index) +
        text.slice(typeMatch.index + typeMatch[0].length);
    }
    previous = {
      key: option.key,
      group: option.group,
      type,
      values,
      default: defaultValue,
      description: text.replace(/\s+/g, " ").trim(),
    };
    return previous;
  });
}

// Parses "[Type]: description [value, value]" entries.
function parseTypes(lines) {
  const types = {};
  for (const line of lines) {
    const entry = line.match(/^\[([A-Za-z]+)\]: (.*?)(?: \[([^\]]*)\])?$/);
    if (entry) {
      types[entry[1]] = { description: entry[2].trim(), values: null };
      if (entry[3] && !/[.,]{3}|e\.g\./.test(entry[3])) {
        const values = entry[3].split(",").map((value) => value.trim());
        if (values.every((value) => /^[A-Za-z]+$/.test(value))) {
          types[entry[1]].values = values;
        }
      }
      types[entry[1]].hint = entry[3] || null;
    }
  }
  return types;
}

// Parses the list of predefined pieces, e.g. "knight (N)".
function parsePieces(lines) {
  const pieces = [];
  for (const line of lines) {
    const entry = line.match(/^([a-z][A-Za-z]*) \(([^)]*)\)$/);
    if (entry) {
      pieces.push({ name: entry[1], betza: entry[2] });
    }
  }
  return pieces;
}

async function main() {
  const source = process.argv[2] || DEFAULT_SOURCE;
  const sections = headerSections(await readSource(source));
  const required = [
    "Piece types",
    "Custom pieces",
    "Option types",
    "Rule definition options",
  ];
  for (const title of required) {
    if (!sections.has(title)) {
      throw new Error(`Section "${title}" not found in ${source}`);
    }
  }

  const pieces = parsePieces(sections.get("Piece types"));
  const options = [];
  for (const piece of pieces) {
    options.push({
      key: piece.name,
      group: "Pieces",
      type: "Piece",
      values: null,
      default: null,
      description: `Predefined piece moving as ${piece.betza || "nothing (immobile)"} in Betza notation. The value is the letter of the piece, e.g., ${piece.name} = ${piece.name[0]}, or - to remove it.`,
      betza: piece.betza,
    });
  }
  for (let i = 1; i <= CUSTOM_PIECE_SLOTS; i++) {
    options.push({
      key: `customPiece${i}`,
      group: "Pieces",
      type: "CustomPiece",
      values: null,
      default: null,
      description:
        "Custom piece with its letter and its movement in Betza notation, e.g., a:mRcB for a piece moving as a rook and capturing as a bishop.",
    });
  }
  for (const key of ["pieceValueMg", "pieceValueEg"]) {
    options.push({
      key,
      group: "Pieces",
      type: "PieceValues",
      values: null,
      default: null,
      description: `Override the ${key == "pieceValueMg" ? "middlegame" : "endgame"} value of pieces for the engine, e.g., ${key} = p:150 n:800. For orientation, the rook has r:${key == "pieceValueMg" ? 1276 : 1380}.`,
    });
  }
  options.push(
    ...parseOptions(
      sections.get(
        "Additional options relevant for usage in Winboard/XBoard",
      ) || [],
      "XBoard/WinBoard",
    ),
    ...parseOptions(sections.get("Rule definition options"), "Rules"),
  );

  const output = {
    source,
    betzaHelp: sections
      .get("Custom pieces")
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2)),
    types: parseTypes(sections.get("Option types")),
    options,
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`Wrote ${options.length} options to ${OUTPUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

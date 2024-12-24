const fs = require("fs");
const EOLMatcher = new RegExp("\r\n|\r", "g");

function GetHeadAndBodyOfHTML(html_str) {
  let headstr = "";
  let bodystr = "";
  let pagestr = html_str.substring(0);
  let i = 0;
  let headstart = 0;
  let headend = 0;
  let bodystart = 0;
  let bodyend = 0;
  let stringmode = "";
  for (i = 0; i < pagestr.length; i++) {
    if (!stringmode && pagestr[i] == "/" && pagestr[i + 1] == "/") {
      while (pagestr[i] != "\n") {
        i++;
      }
      continue;
    } else if (!stringmode && pagestr[i] == "/" && pagestr[i + 1] == "*") {
      while (pagestr[i] != "*" || pagestr[i + 1] != "/") {
        i++;
      }
      continue;
    }
    if (stringmode) {
      if (pagestr[i] == stringmode && pagestr[i - 1] != "\\") {
        stringmode = "";
      }
    } else {
      if (pagestr[i] == '"' || pagestr[i] == "'" || pagestr[i] == "`") {
        if (pagestr[i - 1] != "\\" && !stringmode) {
          stringmode = pagestr[i];
          lastchar = i;
        }
      } else if (pagestr[i] == "<") {
        if (!bodystart && pagestr.startsWith("<body>", i)) {
          bodystart = i + 6;
        } else if (!bodyend && pagestr.startsWith("</body>", i)) {
          bodyend = i;
        } else if (!headstart && pagestr.startsWith("<head>", i)) {
          headstart = i + 6;
        } else if (!headend && pagestr.startsWith("</head>", i)) {
          headend = i;
        }
        if (headstart && headend && bodystart && bodyend) {
          break;
        }
      }
    }
  }
  if (stringmode) {
    throw SyntaxError("Invalid syntax in advanced.html.");
  }
  if (!(headstart && headend && bodystart && bodyend)) {
    throw SyntaxError(
      "Missing body or head, or invalid syntax in advanced.html.",
    );
  }
  headstr = pagestr.substring(headstart, headend);
  bodystr = pagestr.substring(bodystart, bodyend);
  return {
    head_str: headstr,
    head_start_index: headstart,
    head_end_index: headend,
    body_str: bodystr,
    body_start_index: bodystart,
    body_end_index: bodyend,
  };
}

try {
  let advpage = fs
    .readFileSync("./src/html/advanced.html", "utf8")
    .replace(EOLMatcher, "\n");
  let index_page_css = fs.readFileSync("./src/index_page_css.css", "utf8");
  let index_page_js = fs.readFileSync("./src/index_page_js.js", "utf8");
  advpage = advpage
    .replace(
      "<title>Fairy-Stockfish playground</title>",
      "<title>Play against Fairy-Stockfish</title>",
    )
    .replace(
      /let( +)advanced_time_control( *)=( *)false/,
      "let advanced_time_control = true",
    )
    .replace(/let( +)play_black( *)=( *)false/, "let play_black = true");
  let htmlseg = GetHeadAndBodyOfHTML(advpage);
  let headerendpos = htmlseg.head_end_index;
  let index_page =
    advpage.substring(0, headerendpos) +
    "\n<style>\n" +
    index_page_css +
    "\n</style>\n" +
    advpage.substring(headerendpos);
  let htmlseg2 = GetHeadAndBodyOfHTML(index_page);
  let bodystartpos = htmlseg2.body_start_index;
  let index_page2 =
    index_page.substring(0, bodystartpos) +
    "\n<script>\n" +
    index_page_js +
    "\n</script>\n" +
    index_page.substring(bodystartpos);
  console.log(index_page2);
} catch (err) {
  console.error("Error reading file:", err);
}

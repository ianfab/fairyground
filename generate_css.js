/* 
 * 
 * Generates SVG files for generic boards and CSS files for "FEN Style Letters" theme and generic boards.
 * "node generate_css.js --help" for more information.
 * 
 */ 

const path = require('path');

function MostSignificantTrueBit(n) {
    const max=1<<31;
    const med=1<<15;
    if (n&max) {
        return max;
    }
    else if (n==0) {
        return 0;
    }
    if (n&2147418112) {
        let finder=1<<30;
        n<<=1;
        while (!(n&max)) {
            n<<=1;
            finder>>=1;
        }
        return finder;
    }
    else {
        let finder=1<<15;
        while (!(n&med)) {
            n<<=1;
            finder>>=1;
        }
        return finder;
    }
}

function MostSignificantTrueBitPosition(n) {
    const max=1<<31;
    const med=1<<15;
    if (n&max) {
        return 31;
    }
    else if (n==0) {
        return -1;
    }
    if (n&2147418112) {
        let finder=30;
        n<<=1;
        while (!(n&max)) {
            n<<=1;
            finder--;
        }
        return finder;
    }
    else {
        let finder=15;
        while (!(n&med)) {
            n<<=1;
            finder--;
        }
        return finder;
    }
}

function GenerateGenericBoardSVGTiling(width, height, squareWidth, squareHeight, colorCodeLight, colorCodeDark) {
    let result="";
    let i=0;
    let j=0;
    result+=`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${squareWidth*width} ${squareHeight*height}">\n`;
    result+=`<!-- Automatically generated, do not edit!!! -->\n`;
    result+=`<g fill="${colorCodeLight}"><rect x="0" y="0" width="100%" height="100%"/></g>`
    result+=`<g fill="${colorCodeDark}">`;
    for (i=0;i<width;i+=1) { //From left to right, 0 to N-1
        for (j=0;j<height;j+=1) { //From bottom to top, 0 to N-1
            //Square at bottom left corner is always dark
            if ((j&1)==(i&1)) {
                result+=`<rect x="${i*squareWidth}" y="${(height-j-1)*squareHeight}" width="${squareWidth}" height="${squareHeight}"/>`;
            }
        }
    }
    result+=`</g></svg>`;
    return result;
}

function GenerateGenericBoardSVGLineReuse(width, height, squareWidth, squareHeight, colorCodeLight, colorCodeDark) {
    let result="";
    let i=0;
    let j=0;
    const height_msb=MostSignificantTrueBit(height);
    const height_target=((height==height_msb)?height_msb:height_msb<<1);
    const width_msb=MostSignificantTrueBit(width);
    const width_target=((width==width_msb)?width_msb>>1:width_msb);
    const height_msbp=MostSignificantTrueBitPosition(height_target);
    const width_msbp=MostSignificantTrueBitPosition(width_target);
    if (height_target==1<<31 || width_target==1<<31) {
        return "";
    }
    result+=`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${squareWidth*width} ${squareHeight*height}">\n`;
    result+=`<!-- Automatically generated, do not edit!!! -->\n`;
    result+=`<g fill="${colorCodeLight}"><rect x="0" y="0" width="100%" height="100%"/></g>`
    result+=`<g fill="${colorCodeDark}">`;
    j=height_msbp+1;
    for (i=height_target;i>1;i>>=1) {
        result+=`<g id="h${j--}">`;
    }
    result+=`<g id="h1">`
    j=width_msbp+1;
    for (i=width_target;i>1;i>>=1) {
        result+=`<g id="w${j--}">`;
    }
    result+=`<g id="w1"><rect x="0" y="${(height-1)*squareHeight}" width="${squareWidth}" height="${squareHeight}"/></g>`;
    j=1;
    for (i=1;i<width_target;i<<=1) {
        result+=`<use transform="translate(${squareWidth<<j},0)" xlink:href="#w${j++}"/></g>`
    }
    result+="</g>"  //<g id="h1">
    j=1;
    for (i=1;i<height_target;i<<=1) {
        if (i&1) {
            result+=`<use transform="translate(${squareWidth},${-(squareHeight<<(j-1))})" xlink:href="#h${j++}"/></g>`
        }
        else {
            result+=`<use transform="translate(0,${-(squareHeight<<(j-1))})" xlink:href="#h${j++}"/></g>`;
        }
    }
    result+=`</g></svg>`;  //<g fill="${colorCodeDark}">
    return result;
}

function GenerateGenericBoardSVGSquareReuse(width, height, squareWidth, squareHeight, colorCodeLight, colorCodeDark) {
    let result="";
    let i=0;
    let j=0;
    const height_msb=MostSignificantTrueBit(height);
    const height_target=((height==height_msb)?height_msb:height_msb<<1);
    const width_msb=MostSignificantTrueBit(width);
    const width_target=((width==width_msb)?width_msb:width_msb<<1);
    if (height_target==1<<31 || width_target==1<<31) {
        return "";
    }
    const target=((height_target>width_target)?height_target:width_target);
    const size_msbp=MostSignificantTrueBitPosition(target);
    result+=`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${squareWidth*width} ${squareHeight*height}">\n`;
    result+=`<!-- Automatically generated, do not edit!!! -->\n`;
    result+=`<g fill="${colorCodeLight}"><rect x="0" y="0" width="100%" height="100%"/></g>`
    result+=`<g fill="${colorCodeDark}">`;
    j=size_msbp+1;
    for (i=target;i>1;i>>=1) {
        result+=`<g id="s${j--}">`;
    }
    result+=`<g id="s1"><rect x="0" y="${(height-1)*squareHeight}" width="${squareWidth}" height="${squareHeight}"/></g>`;
    for (i=1,j=1;i<target;i<<=1,j++) {
        if (!(i&1)) {
            result+=`<use transform="translate(0,${-(squareHeight<<(j-1))})" xlink:href="#s${j}"/>`;
            result+=`<use transform="translate(${squareWidth<<(j-1)},0)" xlink:href="#s${j}"/>`;
        }
        result+=`<use transform="translate(${squareWidth<<(j-1)},${-(squareHeight<<(j-1))})" xlink:href="#s${j}"/></g>`;
    }
    result+=`</g></svg>`;
    return result;
}

function IsValidColorSyntax(colorString) {
    function IsValidInteger(value,min,max) {
        let i=0;
        for (i=(value.startsWith("-")||value.startsWith("+"))?1:0;i<value.length;i++) {
            if (value.charCodeAt(i)<48 || value.charCodeAt(i)>57) {
                return false;
            }
        }
        let num=parseInt(value);
        return num>=min && num<=max;
    }
    function IsValidPercentage(value,min,max) {
        if (!value.endsWith("%")) {
            return false;
        }
        let i=0;
        let pointCount=0;
        for (i=(value.startsWith("-")||value.startsWith("+"))?1:0;i<value.length-1;i++) {
            if (value.charAt(i)=='.') {
                pointCount++;
            }
            else if (value.charCodeAt(i)<48 || value.charCodeAt(i)>57) {
                return false;
            }
            if (pointCount>1) {
                return false;
            }
        }
        let num=parseFloat(value)/100;
        return num>=min && num<=max;
    }
    function IsValidFloatingPoint(value,min,max) {
        let i=0;
        let pointCount=0;
        for (i=(value.startsWith("-")||value.startsWith("+"))?1:0;i<value.length;i++) {
            if (value.charAt(i)=='.') {
                pointCount++;
            }
            else if (value.charCodeAt(i)<48 || value.charCodeAt(i)>57) {
                return false;
            }
            if (pointCount>1) {
                return false;
            }
        }
        let num=parseFloat(value);
        return num>=min && num<=max;
    }
    function IsValidDigit(value,min,max) {
        return IsValidFloatingPoint(value,min,max) || IsValidPercentage(value,min,max);
    }
    let str="";
    let i=0;
    let haserror=false;
    colorString=colorString.trim().toLowerCase();
    if (colorString.startsWith("#")) {
        if (colorString.length==4 || colorString.length==5 || colorString.length==7 || colorString.length==9) {
            for (i=1;i<colorString.length;i++) {
                let ch=colorString.charCodeAt(i);
                if (ch>=48 && ch<=57 || ch>=65 && ch<=70 || ch>=97 && ch<=102) {
                    continue;
                }
                haserror=true;
                break;
            }
        }
        else {
            haserror=true;
        }
        return !haserror;
    }
    else if (colorString.startsWith("rgb(")) {
        if (colorString.endsWith(")")) {
            str=colorString.slice(4,-1).replace(/[ ]+/g,"");
            let list=str.split(',');
            if (list.length!=3) {
                return false;
            }
            return IsValidInteger(list[0],0,255) && IsValidInteger(list[1],0,255) && IsValidInteger(list[2],0,255);
        }
    }
    else if (colorString.startsWith("rgba(")) {
        if (colorString.endsWith(")")) {
            str=colorString.slice(5,-1).replace(/[ ]+/g,"");
            let list=str.split(',');
            if (list.length!=4) {
                return false;
            }
            return IsValidInteger(list[0],0,255) && IsValidInteger(list[1],0,255) && IsValidInteger(list[2],0,255) && IsValidDigit(list[3],0,1);
        }
    }
    else if (colorString.startsWith("hsl(")) {
        if (colorString.endsWith(")")) {
            str=colorString.slice(4,-1).replace(/[ ]+/g,"");
            let list=str.split(',');
            if (list.length!=3) {
                return false;
            }
            if (list[0].endsWith("deg")) {
                list[0]=list[0].slice(0,-3);
            }
            return IsValidInteger(list[0],0,360) && IsValidPercentage(list[1],0,1) && IsValidPercentage(list[2],0,1);
        }
    }
    else if (colorString.startsWith("hsla(")) {
        if (colorString.endsWith(")")) {
            str=colorString.slice(5,-1).replace(/[ ]+/g,"");
            let list=str.split(',');
            if (list.length!=4) {
                return false;
            }
            if (list[0].endsWith("deg")) {
                list[0]=list[0].slice(0,-3);
            }
            return IsValidInteger(list[0],0,360) && IsValidPercentage(list[1],0,1) && IsValidPercentage(list[2],0,1) && IsValidDigit(list[3],0,1);
        }
    }
    else if (colorString.startsWith("oklch(")) {
        if (colorString.endsWith(")")) {
            str=colorString.slice(6,-1);
            let parts=str.split('/');
            if (parts.length!=2) {
                return false;
            }
            let LCH=parts[0].trim().split(/[ ]+/);
            if (LCH.length!=3) {
                return false;
            }
            let A=parts[1].trim();
            if (LCH[2].endsWith("deg")) {
                LCH[2]=LCH[2].slice(0,-3);``
            }
            return IsValidPercentage(LCH[0],0,1) && IsValidPercentage(LCH[1],0,1) && IsValidInteger(LCH[2],0,360) && IsValidDigit(A,0,1);
        }
    }
    else if (colorString=="currentcolor") {
        return true;
    }
    return false;
}

function directoryExists(dirpath) {
    const dirPath = path.join(__dirname, dirpath);
    try {
        fs.accessSync(dirPath, fs.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}

function makeDirectory(dirpath) {
    const dirPath = path.join(__dirname, dirpath);
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        return true;
    }
    catch {
        return false;
    }
}

function wrapText(text, width, paddingLeft) {
    let tokens=text.split(/[ ]+/);
    let result="";
    let i=0;
    let j=0;
    let linecharcount=0;
    for (i=0;i<paddingLeft;i++) {
        result+=" ";
    }
    for (i=0;i<tokens.length;i++) {
        linecharcount+=(tokens[i].length+1);
        if (linecharcount>width-paddingLeft && i>0) {
            result+="\n";
            for (j=0;j<paddingLeft;j++) {
                result+=" ";
            }
            linecharcount=tokens[i].length+1;
        }
        result+=(tokens[i]+" ");
    }
    return result;
}



const args = process.argv.slice(2);
const consolewidth=process.stdout.columns;

if (args.includes("--help") || args.includes("-help") || args.includes("-h") || args.includes("/?")) {
    console.log(wrapText("Generates SVG files for generic boards and CSS files for \"FEN Style Letters\" theme and generic boards.",consolewidth,0));
    console.log("");
    console.log(wrapText("Usage (Bash or CMD):",consolewidth,0));
    console.log(wrapText("node generate_css.js [--silent] [--max-rank <int>] [--max-file <int>] [--min-rank <int>] [--min-file <int>] [--colors <<string>:<CSSColor>:<CSSColor>[;...]>] [--compress-svg]",consolewidth,0));
    console.log("");
    console.log(wrapText("Options:",consolewidth,0));
    console.log(wrapText("--silent",consolewidth,0));
    console.log(wrapText("When given, do not show the created files in console.",consolewidth,10));
    console.log("");
    console.log(wrapText("--min-rank <minRankCount: int>",consolewidth,0));
    console.log(wrapText("Sets the minimum count of ranks (rows) of the board CSS and SVG to generate. (Default: 1)",consolewidth,10));
    console.log("");
    console.log(wrapText("--min-file <minFileCount: int>",consolewidth,0));
    console.log(wrapText("Sets the minimum count of files (columns) of the board CSS and SVG to generate. (Default: 1)",consolewidth,10));
    console.log("");
    console.log(wrapText("--max-rank <maxRankCount: int>",consolewidth,0));
    console.log(wrapText("Sets the maxiumum count of ranks (rows) of the board CSS and SVG to generate. (Default: 10)",consolewidth,10));
    console.log("");
    console.log(wrapText("--max-file <maxFileCount: int>",consolewidth,0));
    console.log(wrapText("Sets the maxiumum count of files (columns) of the board CSS and SVG to generate. (Default: 12)",consolewidth,10));
    console.log("");
    console.log(wrapText("--colors <<themeName: string>:<lightColorCSSCode: CSSColor>:<darkColorCSSCode: CSSColor>;[...]>",consolewidth,0));
    console.log(wrapText("Sets the the color of the light and dark squares, and the name for the theme. The name of the theme can only contain letters and underlines. The CSSColor should be the format of CSS color declaration, e.g. #fff, rgb(0, 0, 0), oklch(50% 30% 120deg / 0.5), etc. You can add multiple entries, using the semicolon to seperate them.",consolewidth,10));
    console.log(wrapText("(Default: \"blue:#dee3e6:#8ca2ad;green:#ffffdd:#86a666;brown:#f0d9b5:#b58863;purple:#eadfed:#a781b1\")",consolewidth,10));
    console.log("");
    console.log(wrapText("--compress-svg",consolewidth,0));
    console.log(wrapText("When given, generate the vector graphs in compressed format which can reduce the file size of large board SVG significantly at the cost of rendering speed. Compressed file size grows logarithmically while normal file size grows linearly when board size grows.",consolewidth,10));
    console.log(wrapText("Examples:",consolewidth,10));
    console.log(wrapText("Board 32x32 - Compressed file size: 974B; Normal file size: 24.9KB",consolewidth,10));
    console.log(wrapText("Board 16x16 - Compressed file size: 837B; Normal file size: 6.34KB",consolewidth,10));
    console.log(wrapText("Board 8x8 - Compressed file size: 699B; Normal file size: 1.76KB",consolewidth,10));
    console.log(wrapText("Board 4x4 - Compressed file size: 564B; Normal file size: 659B",consolewidth,10));
    console.log(wrapText("Board 2x2 - Compressed file size: 429B; Normal file size: 375B",consolewidth,10));
    console.log(wrapText("Compressed files can have noticeable impact on very large boards like 128x128, or slow computers. If network speed is not a problem such as using offline version, normal versions are recommended.",consolewidth,10));
    console.log("");
    console.log(wrapText("Outputs:",consolewidth,0));
    console.log(wrapText("./public/assets/generated.css",consolewidth,0));
    console.log(wrapText("./public/assets/images/board/<theme name>/*",consolewidth,0));
    console.log(wrapText("./public/assets/theme-board-<theme name>board.css",consolewidth,0));
    console.log(wrapText("./public/assets/theme-piece-letters.css",consolewidth,0));
    console.log("");
    console.log(wrapText("Examples:",consolewidth,0));
    console.log(wrapText("node generate_css.js",consolewidth,0));
    console.log(wrapText("node generate_css.js --silent",consolewidth,0));
    console.log(wrapText("node generate_css.js --max-file 8 --min-file 4",consolewidth,0));
    console.log(wrapText("node generate_css.js --max-rank 12 --max-file 10",consolewidth,0));
    console.log(wrapText("node generate_css.js --silent --max-rank 12 --max-file 10",consolewidth,0));
    console.log(wrapText("node generate_css.js --silent --colors high_contrast:#fff:#000 --compress-svg",consolewidth,0));
    console.log(wrapText("node generate_css.js --max-rank 32 --max-file 32 --colors \"red:rgb(255, 200, 200):rgb(200, 0, 0)\"",consolewidth,0));
    console.log("");
    process.exit(0);
}

const fs=require("fs");

const HIDE_OUTPUT=args.includes("--silent");
const COMPRESS_SVG=args.includes("--compress-svg");

let maxrankparam=-1;
let maxfileparam=-1;
let minrankparam=-1;
let minfileparam=-1;
let colorsparam=[];
let haserror=false;

if (args.includes("--max-rank")) {
    let num=parseInt(args[args.indexOf("--max-rank")+1]);
    if (isNaN(num)) {
        console.error(`Illegal parameter for --max-rank: ${args[args.indexOf("--max-rank")+1]}.`);
        haserror=true;
    }
    else if (num<1) {
        console.error(`Illegal value for --max-rank: ${num}. Maxiumum rank must be a positive integer.`);
        haserror=true;
    }   
    else {
        maxrankparam=num;
    }
}
if (args.includes("--max-file")) {
    let num=parseInt(args[args.indexOf("--max-file")+1]);
    if (isNaN(num)) {
        console.error(`Illegal parameter for --max-file: ${args[args.indexOf("--max-file")+1]}.`);
        haserror=true;
    }
    else if (num<1) {
        console.error(`Illegal value for --max-file: ${num}. Maxiumum file must be a positive integer.`);
        haserror=true;
    }
    else {
        maxfileparam=num;
    }
}
if (args.includes("--min-rank")) {
    let num=parseInt(args[args.indexOf("--min-rank")+1]);
    if (isNaN(num)) {
        console.error(`Illegal parameter for --min-rank: ${args[args.indexOf("--min-rank")+1]}.`);
        haserror=true;
    }
    else if (num<1) {
        console.error(`Illegal value for --min-rank: ${num}. Minimum rank must be a positive integer.`);
        haserror=true;
    }   
    else {
        minrankparam=num;
    }
}
if (args.includes("--min-file")) {
    let num=parseInt(args[args.indexOf("--min-file")+1]);
    if (isNaN(num)) {
        console.error(`Illegal parameter for --min-file: ${args[args.indexOf("--min-file")+1]}.`);
        haserror=true;
    }
    else if (num<1) {
        console.error(`Illegal value for --min-file: ${num}. Minimum file must be a positive integer.`);
        haserror=true;
    }
    else {
        minfileparam=num;
    }
}
if (args.includes("--colors")) {
    if (args[args.indexOf("--colors")+1]==undefined) {
        haserror=true;
        console.error(`Illegal syntax for --colors: ${args[args.indexOf("--colors")+1]}. Syntax: <<string>:<CSSColor>:<CSSColor>[;...]>.\nExample: blue:#dee3e6:#8ca2ad;highcontrast:#fff:#000`);
    }
    else {
        let colorslist=args[args.indexOf("--colors")+1].split(';');
        let i=0;
        let entry=[];
        for (i=0;i<colorslist.length;i++) {
            entry=colorslist[i].split(':');
            if (entry.length!=3) {
                console.error(`Illegal syntax for --colors: "${args[args.indexOf("--colors")+1]}". Syntax: <<string>:<CSSColor>:<CSSColor>[;...]>.\nExample: blue:#dee3e6:#8ca2ad;highcontrast:#fff:#000`);
                haserror=true;
                break;
            }
            entry[0]=entry[0].trim();
            if (entry[0].length==0) {
                haserror=true;
                console.error(`At entry ${i+1} in --colors: Illegal value for color name: "${entry[0]}". Color name cannot be empty.`);
            }
            let j=0;
            let ch=0;
            for (j=0;j<entry[0].length;j++) {
                ch=entry[0].charCodeAt(j);
                if (ch>=65 && ch<=90 || ch>=97 && ch<=122 || entry[0][j]=='_') {
                    continue;
                }
                haserror=true;
                console.error(`At entry ${i+1} in --colors:  Illegal value for color name: "${entry[0]}". Color name can only contain letters and underlines.`);
                break;
            }
            if (!IsValidColorSyntax(entry[1])) {
                haserror=true;
                console.error(`At entry ${i+1} in --colors: Illegal CSS color declaration for lightColorCSSCode: "${entry[1].trim()}". The syntax of lightColorCSSCode must follow CSS color declaration requirements.`);
            }
            if (!IsValidColorSyntax(entry[2])) {
                haserror=true;
                console.error(`At entry ${i+1} in --colors: Illegal CSS color declaration for lightColorCSSCode: "${entry[2].trim()}". The syntax of darkColorCSSCode must follow CSS color declaration requirements.`);
            }
            if (haserror) {
                break;
            }
            colorsparam.push({color: entry[0], colorCodeLight: entry[1].trim(), colorCodeDark: entry[2].trim()});
        }
    }
}
if (haserror) {
    process.exit(1);
}

const MAX_RANK = maxrankparam>0?maxrankparam:10;
const MAX_FILE = maxfileparam>0?maxfileparam:12;
const MIN_RANK = minrankparam>0?minrankparam:1;
const MIN_FILE = minfileparam>0?minfileparam:1;

let boardsize = 640;
let piecesizepercent = 100;
let miniboardscale = 0.5;
let miniboardsize = boardsize * miniboardscale;

let digitaccuracy = 1;
let percentaccuracy = 5;

let i = 0;
let j = 0;
let k = 0;

if (MAX_FILE<MIN_FILE) {
    console.error("Maximum file is smaller than minimum file.");
    process.exit(1);
}
if (MAX_RANK<MIN_RANK) {
    console.error("Maximum rank is smaller than minimum rank.");
    process.exit(1);
}



//ChessgroundX CSS

if (!directoryExists("./public/assets")) {
    if (!makeDirectory("./public/assets")) {
        console.error("Failed to make directory: ./public/assets/");
        process.exit(1);
    }
    console.log("Created directory: ./public/assets/");
}

let result = "/* Automatically generated, do not edit!!! */\n";

for (i = MIN_FILE; i <= MAX_FILE; i++) {
    for (j = MIN_RANK; j <= MAX_RANK; j++) {
        result += `
.board${i}x${j} .cg-wrap {
    width: ${(i > j ? boardsize : boardsize * i / j).toFixed(digitaccuracy)}px;
    height: ${(j > i ? boardsize : boardsize * j / i).toFixed(digitaccuracy)}px;
}

.board${i}x${j}.pockets .cg-wrap {
    width: ${(i > j ? boardsize * i / (i + 2) : boardsize * i / j * i / (i + 2)).toFixed(digitaccuracy)}px;
    height: ${(j > i ? boardsize * i / (i + 2) : boardsize * j / (i + 2)).toFixed(digitaccuracy)}px;
}

.board${i}x${j} cg-helper {
    width: ${(piecesizepercent / i).toFixed(percentaccuracy)}%;
    height: ${(piecesizepercent / j).toFixed(percentaccuracy)}%;
}

.board${i}x${j} cg-board square {
    width: ${(piecesizepercent / i).toFixed(percentaccuracy)}%;
    height: ${(piecesizepercent / j).toFixed(percentaccuracy)}%;
}

.board${i}x${j} .cg-wrap piece {
    width: ${(piecesizepercent / i).toFixed(percentaccuracy)}%;
    height: ${(piecesizepercent / j).toFixed(percentaccuracy)}%;
}

.board${i}x${j} .cg-wrap.micro {
    width: ${(i > j ? miniboardsize : miniboardsize * i / j).toFixed(digitaccuracy)}px;
    height: ${(j > i ? miniboardsize : miniboardsize * j / i).toFixed(digitaccuracy)}px;
}

.board${i}x${j}.pockets .cg-wrap.micro {
    width: ${(i > j ? miniboardsize * i / (i + 2) : miniboardsize * i / j * i / (i + 2)).toFixed(digitaccuracy)}px;
    height: ${(j > i ? miniboardsize * i / (i + 2) : miniboardsize * j / (i + 2)).toFixed(digitaccuracy)}px;
}
`.replace(/\r\n|\r|\n|[ ]{4}/g,"").replace(/\:[ ]+/g,":").replace(/[ ]+\{/g,"{").replace(/\;[ ]*\}/g,"}");
    }
}

fs.writeFileSync("./public/assets/generated.css", result, "utf8");
if (!HIDE_OUTPUT) {
    console.log("./public/assets/generated.css\n");
}



//Board CSS & SVG

if (!directoryExists("./public/assets/images/board")) {
    if (!makeDirectory("./public/assets/images/board")) {
        console.error("Failed to make directory: ./public/assets/images/board/");
        process.exit(1);
    }
    console.log("Created directory: ./public/assets/images/board/");
}

const colors= ((colorsparam.length==0) ? [
    {color: "blue", colorCodeLight: "#dee3e6", colorCodeDark: "#8ca2ad"},
    {color: "green", colorCodeLight: "#ffffdd", colorCodeDark: "#86a666"},
    {color: "brown", colorCodeLight: "#f0d9b5", colorCodeDark: "#b58863"},
    {color: "purple", colorCodeLight: "#eadfed", colorCodeDark: "#a781b1"},
] : colorsparam);

result="";

for (k=0;k<colors.length;k++){
    result=`/* Automatically generated, do not edit!!! */\n.${colors[k].color}board{--dark-square-color:${colors[k].colorCodeDark};--light-square-color:${colors[k].colorCodeLight}}`;
    if (!directoryExists(`./public/assets/images/board/${colors[k].color}`)) {
        if (!makeDirectory(`./public/assets/images/board/${colors[k].color}`)) {
            console.error(`Failed to make directory: ./public/assets/images/board/${colors[k].color}`);
            process.exit(1);
        }
        console.log(`Created directory: ./public/assets/images/board/${colors[k].color}`);
    }
    for (i = MIN_FILE; i <= MAX_FILE; i++) {
        for (j = MIN_RANK; j <= MAX_RANK; j++) {
            if (COMPRESS_SVG) {
                fs.writeFileSync(`./public/assets/images/board/${colors[k].color}/${colors[k].color}${i}x${j}.svg`,
                    GenerateGenericBoardSVGLineReuse(i,j,100,100,colors[k].colorCodeLight,colors[k].colorCodeDark),
                    "utf8",
                );
            }
            else {
                fs.writeFileSync(`./public/assets/images/board/${colors[k].color}/${colors[k].color}${i}x${j}.svg`,
                    GenerateGenericBoardSVGTiling(i,j,100,100,colors[k].colorCodeLight,colors[k].colorCodeDark),
                    "utf8",
                );
            }
            if (!HIDE_OUTPUT) {
                console.log(`./public/assets/images/board/${colors[k].color}/${colors[k].color}${i}x${j}.svg`);
            }
            result+=`.${colors[k].color}board.board${i}x${j} cg-board{background-image:url('images/board/${colors[k].color}/${colors[k].color}${i}x${j}.svg')}`;
        }
    }
    fs.writeFileSync(`./public/assets/theme-board-${colors[k].color}board.css`,result,"utf8");
    if (!HIDE_OUTPUT) {
        console.log(`./public/assets/theme-board-${colors[k].color}board.css`);
    }
}

console.log("");



//Letter theme CSS

result="/* Automatically generated, do not edit!!! */\n";

for (i="a".charCodeAt(0);i<"z".charCodeAt(0);i++) {
    result+=`.letters .cg-wrap piece.${String.fromCharCode(i)}-piece.white{background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='80px' height='80px'><text font-size='30' x='50%' y='50%' fill='white' class='white' text-anchor='middle' dominant-baseline='central'>${String.fromCharCode(i-32)}</text></svg>\")}`;
    result+=`.letters .cg-wrap piece.${String.fromCharCode(i)}-piece.black{background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='80px' height='80px'><text font-size='30' x='50%' y='50%' fill='black' class='black' text-anchor='middle' dominant-baseline='central'>${String.fromCharCode(i)}</text></svg>\")}`;
}
result+=`.letters .cg-wrap piece._-piece{background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='80px' height='80px'><text font-size='30' x='50%' y='50%' fill='red' class='red' text-anchor='middle' dominant-baseline='central'>✽</text></svg>\")}`;
result+=`.letters .cg-wrap piece.unknown{background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='80px' height='80px'><text font-size='30' x='50%' y='50%' fill='grey' class='grey' text-anchor='middle' dominant-baseline='central'>❔</text></svg>\")}`;

fs.writeFileSync("./public/assets/theme-piece-letters.css", result, "utf8");
if (!HIDE_OUTPUT) {
    console.log("./public/assets/theme-piece-letters.css\n");
}

console.log(`Finished generating SVG and CSS files. Total generated files: ${colors.length*((MAX_FILE-MIN_FILE+1)*(MAX_RANK-MIN_RANK+1)+1)+2}\n\n`);

process.exit(0);

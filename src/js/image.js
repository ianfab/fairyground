import * as moveutil from "./move.js";

function ParseFEN(fen) {
    if (typeof fen!="string") {
      throw TypeError;
    }
    let i=0;
    let j=0;
    const pieceprefixes=['+','|'];
    const piecesuffixes=['~'];
    const specialpieces=['*'];
    let boardwidth=0;
    let boardheight=0;
    let chcode=0;
    let ParserState=-1;
    let pieces=[];
    let piececolor="";
    let pieceid="";
    let firstrow=true;
    let columncount=0;
    let prefix="";
    let suffix="";
    let blankcount=0;
    let ch;
    const fenelem=fen.split(/[ ]+/);
    const position=fenelem[0];
    for (i=0;i<position.length;i++) {
        ch=position[i];
        chcode=ch.charCodeAt(0);
        if (ParserState==-1) {  //Initial state
            if (chcode>=65 && chcode<=90) {
                boardheight=1;
                columncount++;
                piececolor="white";
                pieceid=String.fromCharCode(chcode+32);
                ParserState=1;
            }
            else if (chcode>=97 && chcode<=122) {
                boardheight=1;
                columncount++;
                piececolor="black";
                pieceid=ch;
                ParserState=1;
            }
            else if (chcode>=48 && chcode<=57) {
                boardheight=1;
                blankcount=parseInt(ch);
                ParserState=0;
            }
            else if (pieceprefixes.includes(ch)) {
                if (prefix.includes(ch)) {
                    console.warn(`Duplicated piece prefix "${ch}" at char ${i+1} of FEN.`);
                    return null;
                }
                boardheight=1;
                prefix+=ch;
                ParserState=0;
            }
            else if (specialpieces.includes(ch)) {
                columncount++;
                boardheight=1;
                pieces.push({role: ch, color: null, prefix: null, suffix: null});
                ParserState=0;
            }
            else {
                console.warn(`Illegal character "${ch}" at char ${i+1} of FEN.`);
                return null;
            }
        }
        else if (ParserState==0) {  //Main state
            if (blankcount>0 && (chcode<48 || chcode>57)) {
                for (j=0;j<blankcount;j++) {
                    pieces.push({role: null, color: null, prefix: null, suffix: null});
                }
                columncount+=blankcount;
                blankcount=0;
            }
            if (chcode>=65 && chcode<=90) {
                piececolor="white";
                pieceid=String.fromCharCode(chcode+32);
                columncount++;
                ParserState=1;
            }
            else if (chcode>=97 && chcode<=122) {
                piececolor="black";
                pieceid=ch;
                columncount++;
                ParserState=1;
            }
            else if (chcode>=48 && chcode<=57) {
                if (prefix.length>0) {
                    console.warn(`Illegal prefix "${prefix}" describing empty squares at char ${i+1} of FEN.`);
                    return null;
                }
                blankcount=blankcount*10+parseInt(ch);
                prefix="";
                suffix="";
            }
            else if (pieceprefixes.includes(ch)) {
                if (prefix.includes(ch)) {
                    console.warn(`Duplicated piece prefix "${ch}" at char ${i+1} of FEN.`);
                    return null;
                }
                prefix+=ch;
            }
            else if (specialpieces.includes(ch)) {
                if (prefix.length>0) {
                    console.warn(`Illegal prefix "${prefix}" describing special piece at char ${i+1} of FEN.`);
                    return null;
                }
                columncount++;
                pieces.push({role: ch, color: null, prefix: null, suffix: null});
            }
            else if (ch=='/') {
                if (firstrow) {
                    boardwidth=columncount;
                    firstrow=false;
                }
                else if (columncount!=boardwidth) {
                    console.warn(`Column count mismatch at row ${boardheight}. Expected: ${boardwidth}, Actual: ${columncount}`);
                    return null;
                }
                columncount=0;
                boardheight++;
                if (prefix.length>0) {
                    console.warn(`Illegal prefix "${prefix}" at end of row at char ${i+1} of FEN.`);
                    return null;
                }
            }
            else {
                console.warn(`Illegal character "${ch}" at char ${i+1} of FEN.`);
                return null;
            }
        }
        else if (ParserState==1) {  //Parsing suffixes
            if (piecesuffixes.includes(ch)) {
                suffix+=ch;
            }
            else {
                pieces.push({role: pieceid, color: piececolor, prefix: prefix, suffix: suffix});
                prefix="";
                suffix="";
                i--;
                ParserState=0;
            }
        }
    }
    if (ParserState==0) {
        if (blankcount>0) {
            for (j=0;j<blankcount;j++) {
                pieces.push({role: null, color: null, prefix: null, suffix: null});
            }
            columncount+=blankcount;
        }
    }
    else if (ParserState==1) {
        pieces.push({role: pieceid, color: piececolor, prefix: prefix, suffix: suffix});
        prefix="";
    }
    if (firstrow) {
        boardwidth=columncount;
    }
    else if (columncount!=boardwidth) {
        console.warn(`Column count mismatch at row ${boardheight}. Expected: ${boardwidth}, Actual: ${columncount}`);
        return null;
    }
    if (prefix.length>0) {
        console.warn(`Illegal prefix "${prefix}" at end of row at char ${i+1} of FEN.`);
        return null;
    }
    return pieces;
}

function GetBoardAndPocket(FEN)
{
    if (typeof FEN!="string")
    {
        throw TypeError();
    }
    let fenpieces=FEN.split(" ")[0];
    let index=fenpieces.indexOf("[");
    let index2=fenpieces.indexOf("]");
    if (index>=0 && index2>index)
    {
        return {board: fenpieces.substring(0,index), pocket: fenpieces.substring(index+1,index2)};
    }
    else
    {
        return {board: fenpieces, pocket: ""};
    }
}

function ConvertMoveToCoordinate(UCIMove,BoardHeight)
{
    if (typeof UCIMove!="string" || typeof BoardHeight!="number")
    {
        throw TypeError();
    }
    let move=moveutil.ParseUCIMove(UCIMove);
    let from=move[0];
    let to=move[1];
    if (typeof from=="string" && typeof to=="string")
    {
        let from_x=-1;
        let from_y=-1;
        let to_x=(to.charCodeAt(0)-97);
        let to_y=BoardHeight-parseInt(to.substring(1));
        if (!from.includes("@"))
        {
            from_x=(from.charCodeAt(0)-97);
            from_y=BoardHeight-parseInt(from.substring(1));
        }
        return {from_x: from_x, from_y: from_y, to_x: to_x, to_y: to_y};
    }
    else
    {
        return {from_x: -1, from_y: -1, to_x: -1, to_y: -1};
    }
}

export function GenerateBoardImage(FEN,LastMove,HasPocket,Orientation,BoardWidth,BoardHeight,PieceImageURLMap,BoardImageURL,ImageWidth,ImageHeight,OnFinishedCallback)
{
    if (typeof FEN!="string" || typeof LastMove!="string" || typeof HasPocket!="boolean" || typeof Orientation!="string" || typeof BoardWidth!="number" || typeof BoardHeight!="number" || !(PieceImageURLMap instanceof Map) || typeof BoardImageURL!="string" || typeof ImageWidth!="number" || typeof ImageHeight!="number" || typeof OnFinishedCallback!="function")
    {
        throw TypeError();
    }
    function CountCharacters(str)
    {
        if (typeof str!="string")
        {
            throw TypeError();
        }
        let i=0;
        let char;
        const whitepieces = new Map();
        const blackpieces = new Map();
        for (i=0;i<str.length;i++)
        {
            char=str[i];
            if (char.charCodeAt(0)>=65 && char.charCodeAt(0)<=90)
            {
                whitepieces.set(char, (whitepieces.get(char) || 0) + 1);
            }
            else if (char.charCodeAt(0)>=97 && char.charCodeAt(0)<=122)
            {
                blackpieces.set(char, (blackpieces.get(char) || 0) + 1);
            }
        }
        return {white: whitepieces, black: blackpieces};
    }
    let drawnelementcount=0;
    let fenparts=GetBoardAndPocket(FEN);
    let pieces=ParseFEN(fenparts.board);
    let pocket=CountCharacters(fenparts.pocket);
    let lastmove=ConvertMoveToCoordinate(LastMove,BoardHeight);
    let whitepocket=[...pocket.white.keys()];
    let blackpocket=[...pocket.black.keys()];
    let pocketsize=Math.max(whitepocket.length,blackpocket.length);
    let totalcount=pieces.length+whitepocket.length+blackpocket.length;
    let displaywidth=Math.max(BoardWidth,pocketsize);
    let displayheight=HasPocket?BoardHeight+2:BoardHeight;
    let squarepixelwidth=ImageWidth/displaywidth;
    let squarepixelheight=ImageHeight/displayheight;
    let noflipboard=(Orientation=="white");
    if (pieces.length!=BoardWidth*BoardHeight)
    {
        throw SyntaxError("Invalid FEN.");
    }
    const canvas = document.createElement('canvas');
    canvas.width = ImageWidth;
    canvas.height = ImageHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,ImageWidth,ImageHeight);

    //Board
    const boardimg = new Image();
    boardimg.onload = ()=>{
        let i=0,j=0;
        let pieceitem;
        let piecechar;
        ctx.drawImage(boardimg,0,HasPocket?squarepixelheight:0,squarepixelwidth*BoardWidth,squarepixelheight*BoardHeight);
        
        //Pieces On Board
        for (i=0;i<BoardWidth;i++)
        {
            for (j=0;j<BoardHeight;j++)
            {
                pieceitem=pieces[j*BoardWidth+i];
                piecechar=pieceitem.role;
                if (piecechar!=null)
                {
                    if (pieceitem.color=="white")
                    {
                        piecechar=piecechar.toUpperCase();
                    }
                    if (pieceitem.prefix && pieceitem.prefix.includes("+"))
                    {
                        piecechar="p"+piecechar;
                    }
                }
                if (noflipboard)
                {
                    (function(x,y,index_x,index_y,imgurl){
                        if ((index_x==lastmove.from_x && index_y==lastmove.from_y) || (index_x==lastmove.to_x && index_y==lastmove.to_y))
                        {
                            ctx.fillStyle="rgba(155, 199, 0, 0.41)";
                            ctx.fillRect(x,y,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="";
                        }
                        if (imgurl)
                        {
                            const pieceimg = new Image();
                            pieceimg.onload = ()=>{
                                ctx.drawImage(pieceimg,x,y,squarepixelwidth,squarepixelheight);
                                drawnelementcount++;
                                if (drawnelementcount>=totalcount)
                                {
                                    OnFinishedCallback(canvas);
                                }
                            };
                            pieceimg.src=imgurl;
                        }
                        else
                        {
                            drawnelementcount++;
                            if (drawnelementcount>=totalcount)
                            {
                                OnFinishedCallback(canvas);
                            }
                        }
                    })(i*squarepixelwidth,(HasPocket?j+1:j)*squarepixelheight,i,j,PieceImageURLMap.get(piecechar));
                }
                else
                {
                    (function(x,y,index_x,index_y,imgurl){
                        if ((index_x==lastmove.from_x && index_y==lastmove.from_y) || (index_x==lastmove.to_x && index_y==lastmove.to_y))
                        {
                            ctx.fillStyle="rgba(155, 199, 0, 0.41)";
                            ctx.fillRect(x,y,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="";
                        }
                        if (imgurl)
                        {
                            const pieceimg = new Image();
                            pieceimg.onload = ()=>{
                                ctx.drawImage(pieceimg,x,y,squarepixelwidth,squarepixelheight);
                                drawnelementcount++;
                                if (drawnelementcount>=totalcount)
                                {
                                    OnFinishedCallback(canvas);
                                }
                            };
                            pieceimg.src=imgurl;
                        }
                        else
                        {
                            drawnelementcount++;
                            if (drawnelementcount>=totalcount)
                            {
                                OnFinishedCallback(canvas);
                            }
                        }
                    })((BoardWidth-i-1)*squarepixelwidth,(HasPocket?(BoardHeight-j):(BoardHeight-j-1))*squarepixelheight,i,j,PieceImageURLMap.get(piecechar));
                }
            }
        }
    };
    boardimg.src=BoardImageURL;

    //Pocket
    if (HasPocket)
    {
        let i=0;
        let piecechar;
        let fontsize=Math.min(0.3*squarepixelwidth,0.3*squarepixelheight);
        if (noflipboard)
        {
            for (i=0;i<blackpocket.length;i++)
            {
                piecechar=blackpocket[i];
                (function(x,count,imgurl){
                    if (imgurl)
                    {
                        const pieceimg = new Image();
                        let countstr=String(count);
                        let countstroffset=(2*countstr.length-1)*fontsize/4;
                        pieceimg.onload = ()=>{
                            ctx.fillStyle="#888";
                            ctx.fillRect(x,0,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="";
                            ctx.drawImage(pieceimg,x,0,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="#d85000";
                            ctx.fillRect(x+0.666*squarepixelwidth,0.666*squarepixelheight,0.333*squarepixelwidth,0.333*squarepixelheight);
                            ctx.fillStyle="#fff";
                            ctx.font = `${fontsize}px Arial`;
                            ctx.fillText(countstr,x+0.8325*squarepixelwidth-countstroffset,0.666*squarepixelheight+fontsize,0.333*squarepixelwidth);
                            ctx.fillStyle="";
                            ctx.font="";
                            drawnelementcount++;
                            if (drawnelementcount>=totalcount)
                            {
                                OnFinishedCallback(canvas);
                            }
                        };
                        pieceimg.src=imgurl;
                    }
                    else
                    {
                        drawnelementcount++;
                        if (drawnelementcount>=totalcount)
                        {
                            OnFinishedCallback(canvas);
                        }
                    }
                })(i*squarepixelwidth,pocket.black.get(piecechar),PieceImageURLMap.get(piecechar));
            }
            for (i=0;i<whitepocket.length;i++)
            {
                piecechar=whitepocket[i];
                (function(x,count,imgurl){
                    if (imgurl)
                    {
                        const pieceimg = new Image();
                        let countstr=String(count);
                        let countstroffset=(2*countstr.length-1)*fontsize/4;
                        pieceimg.onload = ()=>{
                            ctx.fillStyle="#888";
                            ctx.fillRect(x,ImageHeight-squarepixelheight,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="";
                            ctx.drawImage(pieceimg,x,ImageHeight-squarepixelheight,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="#d85000";
                            ctx.fillRect(x+0.666*squarepixelwidth,ImageHeight-0.333*squarepixelheight,0.333*squarepixelwidth,0.333*squarepixelheight);
                            ctx.fillStyle="#fff";
                            ctx.font = `${fontsize}px Arial`;
                            ctx.fillText(countstr,x+0.8325*squarepixelwidth-countstroffset,ImageHeight-0.333*squarepixelheight+fontsize,0.333*squarepixelwidth);
                            ctx.fillStyle="";
                            ctx.font="";
                            drawnelementcount++;
                            if (drawnelementcount>=totalcount)
                            {
                                OnFinishedCallback(canvas);
                            }
                        };
                        pieceimg.src=imgurl;
                    }
                    else
                    {
                        drawnelementcount++;
                        if (drawnelementcount>=totalcount)
                        {
                            OnFinishedCallback(canvas);
                        }
                    }
                })(i*squarepixelwidth,pocket.white.get(piecechar),PieceImageURLMap.get(piecechar));
            }
        }
        else
        {
            for (i=0;i<whitepocket.length;i++)
            {
                piecechar=whitepocket[i];
                (function(x,count,imgurl){
                    if (imgurl)
                    {
                        const pieceimg = new Image();
                        let countstr=String(count);
                        let countstroffset=(2*countstr.length-1)*fontsize/4;
                        pieceimg.onload = ()=>{
                            ctx.fillStyle="#888";
                            ctx.fillRect(x,0,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="";
                            ctx.drawImage(pieceimg,x,0,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="#d85000";
                            ctx.fillRect(x+0.666*squarepixelwidth,0.666*squarepixelheight,0.333*squarepixelwidth,0.333*squarepixelheight);
                            ctx.fillStyle="#fff";
                            ctx.font = `${fontsize}px Arial`;
                            ctx.fillText(countstr,x+0.8325*squarepixelwidth-countstroffset,0.666*squarepixelheight+fontsize,0.333*squarepixelwidth);
                            ctx.fillStyle="";
                            ctx.font="";
                            drawnelementcount++;
                            if (drawnelementcount>=totalcount)
                            {
                                OnFinishedCallback(canvas);
                            }
                        };
                        pieceimg.src=imgurl;
                    }
                    else
                    {
                        drawnelementcount++;
                        if (drawnelementcount>=totalcount)
                        {
                            OnFinishedCallback(canvas);
                        }
                    }
                })(i*squarepixelwidth,pocket.white.get(piecechar),PieceImageURLMap.get(piecechar));
            }
            for (i=0;i<blackpocket.length;i++)
            {
                piecechar=blackpocket[i];
                (function(x,count,imgurl){
                    if (imgurl)
                    {
                        const pieceimg = new Image();
                        let countstr=String(count);
                        let countstroffset=(2*countstr.length-1)*fontsize/4;
                        pieceimg.onload = ()=>{
                            ctx.fillStyle="#888";
                            ctx.fillRect(x,ImageHeight-squarepixelheight,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="";
                            ctx.drawImage(pieceimg,x,ImageHeight-squarepixelheight,squarepixelwidth,squarepixelheight);
                            ctx.fillStyle="#d85000";
                            ctx.fillRect(x+0.666*squarepixelwidth,ImageHeight-0.333*squarepixelheight,0.333*squarepixelwidth,0.333*squarepixelheight);
                            ctx.fillStyle="#fff";
                            ctx.font = `${fontsize}px Arial`;
                            ctx.fillText(countstr,x+0.8325*squarepixelwidth-countstroffset,ImageHeight-0.333*squarepixelheight+fontsize,0.333*squarepixelwidth);
                            ctx.fillStyle="";
                            ctx.font="";
                            drawnelementcount++;
                            if (drawnelementcount>=totalcount)
                            {
                                OnFinishedCallback(canvas);
                            }
                        };
                        pieceimg.src=imgurl;
                    }
                    else
                    {
                        drawnelementcount++;
                        if (drawnelementcount>=totalcount)
                        {
                            OnFinishedCallback(canvas);
                        }
                    }
                })(i*squarepixelwidth,pocket.black.get(piecechar),PieceImageURLMap.get(piecechar));
            }
        }
    }
}
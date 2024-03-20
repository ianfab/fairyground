const express = require('express');
const server = express();
const port = 5005;

server.use(function (req, res, next) {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
});

server.use('/public', express.static('public'));

server.all('/', function (req, res) {
    console.log("[HTTP Server] Redirect to index page.");
    res.redirect("/public/index.html");
});

var httpserver = server.listen(port, function () {
    let host = httpserver.address().address;
    let port = httpserver.address().port;
    let addr = `http://localhost:${port}`;
    console.log("=======================================");
    console.log("          FairyGround  Server");
    console.log("=======================================");
    console.log("This is the back end of FairyGround, acting as a server.");
    console.log("To open FairyGround UI, open your browser and go to the following URL:");
    console.log(addr);
    console.log("Closing this window will close FairyGround. Pages opened in your browser won't work then.\n");
    console.log("[HTTP Server] Server is up at http://localhost:%s", port);
});

function openDefaultBrowser(url) {
  var exec = require('child_process').exec;
  switch (process.platform) {
    case "darwin":
      exec('open ' + url);
      break;
    case "win32":
      exec('start ' + url);
      break;
    default:
      exec('xdg-open ' + url);
  }
}

openDefaultBrowser(`http://localhost:${port}`);

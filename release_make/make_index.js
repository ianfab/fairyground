const fs=require("fs");

let data=fs.readFileSync("../src/js/server.js","utf8");
data=data+`

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

if (typeof port == "number") {
    openDefaultBrowser("http://localhost:" + port.toString());
}
else {
    throw Error("Missing or bad port definition.");
}
`;

console.log(data);
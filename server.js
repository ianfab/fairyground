// Simple server for ffish.js test

const express = require("express")
const app = express()
const path = require("path")

const port = 3000

app.use(express.static("public"))

// Is this the right way to serve the wasm file?
app.get("/ffish.wasm", (req, res) =>
{
	const ffishWasmFilename = path.join(__dirname, "node_modules", "ffish", "ffish.wasm")
	res.sendFile(ffishWasmFilename)
})

const listener = app.listen(port, () =>
{
	console.log(`Listening on port ${listener.address().port}`)
})

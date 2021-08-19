// Simple server for ffish.js test

const express = require("express")
const app = express()
const path = require("path")

const port = 3000

app.use(express.static("public"))

// Is this the right way to serve these files?
app.get("/ffish.wasm", (req, res) =>
{
	const ffishWasmFilename = path.join(__dirname, "node_modules", "ffish-es6", "ffish.wasm")
	res.sendFile(ffishWasmFilename)
})
app.get("/ffish.js", (req, res) =>
{
	const ffishJsFilename = path.join(__dirname, "node_modules", "ffish-es6", "ffish.js")
	res.sendFile(ffishJsFilename)
})

const listener = app.listen(port, () =>
{
	console.log(`Listening on port ${listener.address().port}`)
})

// Testing ffish.js on the server
const ffish = require("ffish")

ffish["onRuntimeInitialized"] = () =>
{
	// This gets properly called!
	console.log("ffish.js initialized!")

	let board = new ffish.Board("chess")
	board.push("e2e4")
	board.push("d7d5")
	console.log(board.toString())

	board.delete()
}

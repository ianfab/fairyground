// Client-side ffish.js test

const ffish = require("ffish")

console.log("Loading ffish.js...")

ffish["onRuntimeEnabled"] = () =>
{
	// Never gets called...
	console.log("ffish.js initialized!")

	let board = new ffish.Board("chess")
	board.push("e2e4")
	board.push("d7d5")
	console.log(board.toString())

	board.delete()
}

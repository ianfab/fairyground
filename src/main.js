// Client-side ffish.js test

import Module from "ffish-es6"
let ffish = null

console.log("Loading ffish.js...")

new Module().then(loadedModule =>
{
	ffish = loadedModule
	console.log("ffish.js initialized!")

	let board = new ffish.Board("chess")
	board.push("e2e4")
	board.push("d7d5")
	console.log(board.toString())

	board.delete()
})

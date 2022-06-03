const express = require("express")
const http = require("http")
const socketIo = require("socket.io")

const port = process.env.PORT || 4005
const app = express()
const server = http.createServer(app)

const roomHelper = require("./helpers/getAllRooms")
const gameHelper = require("./helpers/createGame")
const evaluate = require("./helpers/evaluateRound")

const io = socketIo(server, {
	cors: {
		origin: "*",
	},
})

let players = {}
let games = {}

function updatePlayerName(id, newName) {
	const oldName = players[id]
	players[id] = newName
	console.log(`Updated playername of socket ${id}: ${oldName} --> ${newName}`)
}

function getIDfromPlayerName(name) {
	return Object.keys(players).find((key) => players[key] === name)
}

async function getRoomMembers(room) {
	let playerIDsList = []
	try {
		playerIDsList = Array.from(Object.fromEntries(io.sockets.adapter.rooms)[room])
	} catch (error) {
		console.log("No members found in room " + room)
		return []
	}
	let namesList = []
	playerIDsList.forEach((playerID) => {
		namesList.push(players[playerID])
	})
	return namesList
}

io.on("connection", (socket) => {
	updatePlayerName(socket.id, socket.id)
	socket.emit("your-name", socket.id)

	socket.on("change-client-name", async (newClientName) => {
		updatePlayerName(socket.id, newClientName)
		socket.emit("your-name", players[socket.id])
	})

	socket.on("join-room", async (room) => {
		await socket.join(room)
		console.log(`${players[socket.id]} joined room ${room}`)
		socket.emit("your-room-name", room)
		io.in(room).emit("your-room-members", await getRoomMembers(room))
	})

	socket.on("start-game", async (room) => {
		games[room] = gameHelper.createGame(await getRoomMembers(room), 25)
		await io.in(room).emit("your-game-info", games[room])
		await io.in(room).emit("your-game-started")
		console.log(`Started game in room ${room}`)
	})

	socket.on("my-answer", (data) => {
		if (games[data.room]["player_answers"][players[socket.id]] !== undefined) {
			return
		}
		games[data.room]["player_answers"][players[socket.id]] = data.answer
		const finishedPlayers = Object.keys(games[data.room]["player_answers"])
		for (let fp of finishedPlayers) {
			io.to(getIDfromPlayerName(fp)).emit("room-answers", games[data.room])
		}
	})

	socket.on("next-question", (room) => {
		// EVALUATE GIVEN ANSWERS
		games[room] = evaluate.evaulateRound(games[room])

		// UPDATE CURRENT ROUND INDEX
		games[room].round_info.current += 1

		// REMOVE PLAYER ANSWERS
		games[room].player_answers = {}

		// UPDATE GAME DATA FOR PLAYERS
		io.in(room).emit("your-game-info", games[room])
	})

	socket.on("disconnecting", async () => {
		const allRooms = socket.rooms
		for (room of allRooms) {
			await socket.leave(room)
			io.in(room).emit("your-room-members", await getRoomMembers(room))
		}
		delete players[socket.id]
		console.log(`Removed socket ${socket.id} from players list`)
	})
})
server.listen(port, () => console.log(`Listening on port ${port}`))

const express = require("express")
const http = require("http")
const socketIo = require("socket.io")

const port = process.env.PORT || 4005
const app = express()
const server = http.createServer(app)

const createNewGame = require("./helpers/createNewGame")
const playerController = require("./helpers/playersController")
const evaluate = require("./helpers/evaluateRound")
const getAllRooms = require("./helpers/getAllRooms")

const io = socketIo(server, {
	cors: {
		origin: "*",
	},
})

let players = {}
let games = {}

app.get("/games", (req, res) => {
	res.send(games)
})

app.get("/players", (req, res) => {
	res.send(players)
})

function getIDfromPlayerName(name) {
	const keys = Object.keys(players)
	for (let i = 0; i < keys.length; i++) {
		if (players[keys[i]].name === name) {
			return keys[i]
		}
	}
}

async function getRoomMembers(room) {
	let playerIDsList = []
	try {
		playerIDsList = Array.from(Object.fromEntries(io.sockets.adapter.rooms)[room])
	} catch (error) {
		console.log(`No members found in room ${room}, deleting game if exists ...`)
		//delete games[room]
		return []
	}
	let namesList = []
	playerIDsList.forEach((playerID) => {
		namesList.push(players[playerID])
	})
	return namesList
}

io.on("connection", (socket) => {
	players = playerController.addNewPlayer(socket.id, players, socket, io)
	socket.emit("your-name-changed", socket.id)

	socket.on("change-client-name", async (newClientName) => {
		players = playerController.renamePlayer(socket.id, newClientName, players, socket, io)
	})

	socket.on("join-room", (room) => {
		socket.join(room)
		console.log(`${players[socket.id]} joined room ${room}`)
		const allRooms = getAllRooms.getAllRooms(io)
		getAllRooms.sendRoomMembersToAllRooms(allRooms, io, players)
		socket.emit("your-room-name", room)
	})

	socket.on("start-game", async (room) => {
		games[room] = createNewGame.createNewGame(room, 5, await getRoomMembers(room), socket, io)
		await io.in(room).emit("your-game-started")
		await io.in(room).emit("game-data", games[room])
		console.log(`Started game in room ${room}`)
	})

	socket.on("my-answer", (data) => {
		if (games[data.room]["player_answers"][players[socket.id].name] !== undefined) {
			return
		}
		games[data.room]["player_answers"][players[socket.id].name] = data.answer
		console.log(games)
		const finishedPlayers = Object.keys(games[data.room]["player_answers"])
		for (let fp of finishedPlayers) {
			console.log(getIDfromPlayerName(fp))
			let socketID = getIDfromPlayerName(fp)
			io.to(socketID).emit("room-answers", games[data.room])
		}
	})

	socket.on("next-question", (room) => {
		// EVALUATE GIVEN ANSWERS
		games[room] = evaluate.evaulateRound(games[room])

		// IF GAME FINISHED -> SEND PLAYER SCORES
		if (games[room].current_round === games[room].total_rounds) {
			console.log(`Game in room ${room} has been finished ...`)
			io.in(room).emit("game-finished", games[room])
			return
		}

		// UPDATE CURRENT ROUND INDEX
		games[room].current_round += 1

		// REMOVE PLAYER ANSWERS
		games[room].player_answers = {}

		// UPDATE GAME DATA FOR PLAYERS
		io.in(room).emit("game-data", games[room])
	})

	socket.on("disconnecting", async () => {
		const allClientRooms = socket.rooms
		for (room of allClientRooms) {
			await socket.leave(room)
		}

		const allRooms = getAllRooms.getAllRooms(io)
		getAllRooms.sendRoomMembersToAllRooms(allRooms, io, players)

		delete players[socket.id]
		console.log(`Removed socket ${socket.id} from players list`)
	})
})
server.listen(port, () => console.log(`Listening on port ${port}`))

const express = require("express")
const http = require("http")
const socketIo = require("socket.io")

const port = 4005
const app = express()
const server = http.createServer(app)

const createNewGame = require("./helpers/createNewGame")
const playerController = require("./helpers/playersController")
const evaluate = require("./helpers/evaluateRound")
const getAllRooms = require("./helpers/getAllRooms")
const questionHelper = require("./questions/questionHelper")

const io = socketIo(server, {
	cors: {
		origin: "*",
	},
})

let players = {}
let games = {}

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

	socket.on("join-room", async (room) => {
		await socket.join(room)
		console.log(`${players[socket.id]} joined room ${room}`)
		const allRooms = getAllRooms.getAllRooms(io)
		getAllRooms.sendRoomMembersToAllRooms(allRooms, io, players)
		socket.emit("your-room-name", room)
	})

	socket.on("change-lobby-total-rounds", (data) => {
		io.in(data.room).emit("lobby-total-rounds", data.totalRounds)
	})

	socket.on("start-game", async (data) => {
		let room = data.room
		let totalRounds = data.totalRounds

		// SHOW LOADING SPINNER ON CLIENTS
		io.in(room).emit("show-loading")

		io.in(room).emit("your-game-started")
		games[room] = await createNewGame.createNewGame(
			room,
			totalRounds,
			await getRoomMembers(room),
			socket,
			io
		)
		await io.in(room).emit("game-data", games[room])
		console.log(`Started game in room ${room}`)
	})

	socket.on("my-answer", async (data) => {
		if (games[data.room]["player_answers"][players[socket.id].name] !== undefined) {
			return
		}
		games[data.room]["player_answers"][players[socket.id].name] = data.answer
		const finishedPlayers = Object.keys(games[data.room]["player_answers"])
		for (let fp of finishedPlayers) {
			let socketID = getIDfromPlayerName(fp)
			io.to(socketID).emit("room-answers", games[data.room])
		}

		if (games[data.room].scoreboard.length === finishedPlayers.length) {
			io.in(data.room).emit("show-correct-answer", games[data.room].current_question.correct)
		}
	})

	socket.on("next-question", async (room) => {
		// SHOW LOADING SPINNER ON CLIENTS
		io.in(room).emit("show-loading")

		io.in(room).emit("next-round-starting")

		// EVALUATE GIVEN ANSWERS
		games[room] = evaluate.evaulateRound(games[room])

		// IF GAME FINISHED -> SEND PLAYER SCORES
		if (games[room].current_round.toString() === games[room].total_rounds) {
			console.log(`Game in room ${room} has been finished ...`)
			io.in(room).emit("game-finished", games[room])
			delete games[room]
			return
		}

		// UPDATE CURRENT ROUND INDEX
		games[room].current_round += 1

		// REMOVE PLAYER ANSWERS
		games[room].player_answers = {}

		// GET NEW QUESTION
		games[room].current_question = {}
		games[room].current_question = await questionHelper.getNewQuestion()

		// UPDATE GAME DATA FOR PLAYERS
		io.in(room).emit("game-data", games[room])
	})

	socket.on("disconnecting", async () => {
		const allClientRooms = socket.rooms
		const allGames = Object.keys(games)

		for (room of allClientRooms) {
			await socket.leave(room)
		}

		games = removePlayerFromGames(games, socket.id)

		const allRooms = getAllRooms.getAllRooms(io)
		getAllRooms.sendRoomMembersToAllRooms(allRooms, io, players)
		for (const r of Object.keys(games)) {
			io.in(r).emit("game-data", games[r])
		}

		delete players[socket.id]
		console.log(`Removed socket ${socket.id} from players list`)
	})
})

function removePlayerFromGames(gameslist, socketID) {
	if (gameslist === undefined) {
		console.log("gameslist is empty")
		return {}
	}
	for (const game of Object.keys(gameslist)) {
		for (let i = 0; i < gameslist[game].scoreboard.length; i++) {
			console.log(gameslist[game].scoreboard[i].name)
			console.log(players[socketID].name)
			if (gameslist[game].scoreboard[i].name === players[socketID].name) {
				gameslist[game].scoreboard.splice(i, 1)
			}
		}
	}
	return gameslist
}

server.listen(port, () => console.log(`Listening on port ${port}`))

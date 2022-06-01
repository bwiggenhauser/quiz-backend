const express = require("express")
const http = require("http")
const socketIo = require("socket.io")

const port = process.env.PORT || 4005
const app = express()
const server = http.createServer(app)

const roomHelper = require("./helpers/getAllRooms")
const gameHelper = require("./helpers/createGame")

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

async function getRoomMembers(room) {
	let playerIDsList = []
	try {
		playerIDsList = Array.from(
			Object.fromEntries(io.sockets.adapter.rooms)[room]
		)
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
		io.in(room).emit("your-game-info", games[room])
		io.in(room).emit("your-game-started")
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

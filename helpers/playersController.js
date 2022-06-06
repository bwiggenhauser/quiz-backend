function addNewPlayer(name, players, socket, io) {
	players[name] = {
		name: name,
		rooms: [name],
	}
	socket.emit("your-name-changed", name)
	//io.emit("all-players", players)
	console.log(`New Player ${name} has been added ...`)
	return players
}

function renamePlayer(id, newName, players, socket, io) {
	players[id].name = newName
	socket.emit("your-name-changed", players[id].name)
	io.emit("all-players", players)
	console.log(`Changed playername to ${newName}`)
	return players
}

function removePlayers(id, players, socket, io) {
	delete players[id]
	console.log(`Deleted player ${id} ...`)
	io.emit("all-players", players)
	return players
}

function addRoomToPlayer(id, room, socket, io) {
	players[id].rooms.push(room)
	io.emit("all-players", players)
	return players
}

module.exports = {
	addNewPlayer,
	addRoomToPlayer,
	removePlayers,
	renamePlayer,
}

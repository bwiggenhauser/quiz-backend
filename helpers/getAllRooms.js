function getAllRooms(socketio) {
	const rooms = Array.from(socketio.sockets.adapter.rooms)
	const filtered = rooms.filter((room) => !room[1].has(room[0]))
	const res = filtered.map((i) => i[0])
	return res
}

function sendRoomMembersToAllRooms(roomlist, io, playerlist) {
	console.log(roomlist)
	const connectedIDs = Object.keys(Object.fromEntries(io.sockets.adapter.sids))
	for (const room of roomlist) {
		const idsInRoom = Array.from(Object.fromEntries(io.sockets.adapter.rooms)[room])
		let namesInRoom = []
		for (const socketID of idsInRoom) {
			namesInRoom.push(playerlist[socketID].name)
		}
		io.in(room).emit("your-room-members", namesInRoom)
	}
}

function getUsersInRoom(socket) {
	return Object.entries(rooms).reduce((names, [name, room]) => {
		if (room.users[socket.id] != null) names.push(name)
		return names
	}, [])
}

module.exports = {
	getAllRooms,
	sendRoomMembersToAllRooms,
}

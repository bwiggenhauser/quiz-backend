function getAllRooms(socketio) {
	const rooms = Array.from(socketio.sockets.adapter.rooms);
	const filtered = rooms.filter((room) => !room[1].has(room[0]));
	const res = filtered.map((i) => i[0]);
	return res;
}

module.exports = {
	getAllRooms,
};

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4005;
const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
	cors: {
		origin: "*",
	},
});

io.on("connection", (socket) => {
	socket.emit("your-name", socket.id);

	socket.on("change-client-name", (newSocketID) => {
		const oldName = socket.id;
		socket.id = newSocketID;
		socket.emit("your-name", socket.id);
		console.log(`User ${oldName} has been renamed to ${newSocketID}`);
	});

	socket.on("join-lobby", async (lobby) => {
		socket.join(lobby);
		socket.emit("your-lobby", { lobby_name: lobby });
		console.log(`User ${socket.id} joined lobby ${lobby}`);

		const sockets = await io.in(lobby).fetchSockets();
		console.log(sockets);
	});
});

server.listen(port, () => console.log(`Listening on port ${port}`));

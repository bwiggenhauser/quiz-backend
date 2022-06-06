function sendUpdatedGameData(io, gameData, room) {
	io.in(room).emit("game-data", gameData)
}

function createNewGame(roomName, maxRounds, playersInGame, socket, io) {
	let newGame = {
		total_rounds: maxRounds,
		current_round: 1,
		scoreboard: [],
		current_question: getNewQuestion(),
		player_answers: {},
	}
	for (const p of playersInGame) {
		newGame.scoreboard.push({
			name: p.name,
			score: 0,
		})
	}
	sendUpdatedGameData(io, newGame, roomName)
	return newGame
}

function changeTotalRounds(newTotalRounds, id, games, socket, io) {
	games = games[id].total_rounds = newTotalRounds
	return games
}

function nextRound(id, games, socket, io) {
	// UPDATE SCOREBOARD
	games[id].scoreboard = checkAllPlayers(
		games[id].player_answers,
		games[id].current_question.correct,
		games[id].scoreboard
	)

	//UPDATE QUESTION
	games = games[id].current_question = getNewQuestion()

	// UPDATE CURRENT COUNTER
	games = games[id].current_round += 1
	sendUpdatedGameData(io, games[id], id)
	return games
}

function addScoreToPlayer(scoreboard, name, toAdd) {
	for (let i = 0; i < scoreboard.length; i++) {
		if (scoreboard[i].name === name) {
			scoreboard[i].score += toAdd
		}
	}
	return scoreboard
}

function checkAllPlayers(player_answers, correct, scoreboard) {
	for (const aa of Object.keys(player_answers)) {
		if (checkAnswer(player_answers[aa])) {
			scoreboard = addScoreToPlayer(scoreboard, aa, 1)
		}
	}
	return scoreboard
}

function checkAnswer(answer, correct) {
	return answer === correct
}

function getNewQuestion() {
	return {
		question: "Wie hoch ist der Mount Everest?",
		answers: ["1000m", "2000m", "8848m", "12000m"],
		correct: "8848m",
	}
}

module.exports = {
	createNewGame,
	changeTotalRounds,
	nextRound,
}

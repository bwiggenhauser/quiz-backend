function createGame(players, maxRounds) {
	let game = {
		all_questions: [],
		players: [],
		round_info: {
			current: 0,
			total: maxRounds,
		},
	}

	// GENERATE THE QUESTIONS
	for (let i = 0; i < maxRounds; i++) {
		game["all_questions"].push(getQuestion())
	}

	// GENERATE THE PLAYER INFOS
	for (let i = 0; i < players.length; i++) {
		game["players"].push({
			name: players[i],
			score: 0,
		})
	}
	return game
}

const questions = [
	{
		question: "Wie hoch ist der Mount Everest?",
		answers: ["8200m", "8848m", "8910m", "9100m"],
		correct: ["8848m"],
	},
	{
		question: "Wann sank die Titanic?",
		answers: ["1904", "1908", "1912", "1916"],
		correct: ["1912"],
	},
]

function getQuestion() {
	return questions[Math.floor(Math.random() * questions.length)]
}

module.exports = {
	createGame,
}

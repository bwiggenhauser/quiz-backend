function evaulateRound(gameObj) {
	const currentQuestionIndex = gameObj.round_info.current
	const correctAnswer = gameObj.all_questions[currentQuestionIndex].correct[0]
	for (let p of gameObj.players) {
		const playerAnswer = gameObj.player_answers[p.name]
		if (playerAnswer === correctAnswer) {
			gameObj = addScoreToPlayer(p.name, 1, gameObj)
		}
	}
	return gameObj
}

function addScoreToPlayer(playerName, scoreToAdd, gameObj) {
	for (let i = 0; i < gameObj.players.length; i++) {
		if (gameObj.players[i].name === playerName) {
			gameObj.players[i].score += scoreToAdd
		}
	}
	return gameObj
}

module.exports = {
	evaulateRound,
}

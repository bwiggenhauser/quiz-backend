function evaulateRound(gameObj) {
	console.log(gameObj)
	const correctAnswer = gameObj.current_question.correct
	for (let playerName of Object.keys(gameObj.player_answers)) {
		const playerAnswer = gameObj.player_answers[playerName]
		if (playerAnswer === correctAnswer) {
			gameObj = addScoreToPlayer(playerName, 1, gameObj)
		}
	}
	return gameObj
}

function addScoreToPlayer(playerName, scoreToAdd, gameObj) {
	for (let i = 0; i < gameObj.scoreboard.length; i++) {
		if (gameObj.scoreboard[i].name === playerName) {
			gameObj.scoreboard[i].score += scoreToAdd
		}
	}
	return gameObj
}

module.exports = {
	evaulateRound,
}

const he = require("he")
const questionAPI = "https://opentdb.com/api.php?amount=1&category=9&type=multiple"

async function getNewQuestion() {
	try {
		let res = await fetch(questionAPI)
		res = await res.json()
		res = await res.results[0]
		let incorrect = await res.incorrect_answers
		await incorrect.push(res.correct_answer)
		let decoded = []
		for (const a of incorrect) {
			decoded.push(he.decode(a))
		}
		const shuffled = incorrect.sort((a, b) => 0.5 - Math.random())
		return {
			question: he.decode(res.question),
			correct: he.decode(res.correct_answer),
			answers: shuffled,
		}
	} catch (error) {
		console.log(error)
	}
}

module.exports = {
	getNewQuestion,
}
